import { Router } from "express";
import { Meeting } from "@workspace/db";
import {
  EndMeetingParams,
  EndMeetingBody,
  GetMeetingParams,
  UpsertNotesParams,
  UpsertNotesBody,
  CreateActionItemParams,
  CreateActionItemBody,
  UpdateActionItemParams,
  UpdateActionItemBody,
  DeleteActionItemParams,
  CreateMeetingBody,
  JoinMeetingBody,
  LeaveMeetingBody,
} from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { canAccessMeeting } from "../lib/authHelpers";

const router = Router();

// Helper to calculate weekly start date
const getStartOfWeek = () => {
  const now = new Date();
  const diff = now.getDate() - now.getDay();
  return new Date(now.setDate(diff));
};

// ─── POST /rooms/:roomId/end ─────────────────────────────────────────────────
router.post("/rooms/:roomId/end", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = EndMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const body = EndMeetingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.format() });
    return;
  }

  const { roomId } = params.data;
  const { participantNames, durationSeconds, transcript } = body.data;

  try {
    // Find the latest meeting for this room that hasn't ended yet
    let meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });

    const now = new Date();

    if (meeting) {
      // Access check
      const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You are not authorized to access this meeting" });
        return;
      }

      meeting.endedAt = now;
      meeting.status = "ended";
      meeting.durationSeconds = durationSeconds;
      meeting.participantNames = participantNames;
      if (transcript && transcript.length > 0) {
        meeting.transcript = transcript.map((line: any) => ({
          speaker: line.speaker,
          text: line.text,
          timestamp: line.timestamp,
        }));
      }
      await meeting.save();
      req.log.info({ meetingId: meeting._id.toString() }, "Meeting ended");
    } else {
      // No existing meeting — create one
      meeting = new Meeting({
        roomId,
        name: `Meeting ${roomId}`,
        endedAt: now,
        durationSeconds,
        participantNames,
        transcript: transcript || [],
        title: `Meeting ${roomId}`,
        meetingId: roomId,
        status: "ended",
        startTime: now,
        host: req.user!.id, // Set host to current user
      });
      await meeting.save();
      req.log.info({ meetingId: meeting._id.toString() }, "Meeting created + ended");
    }

    try {
      const { MeetingTranscript } = await import("@workspace/db");
      
      // If client sent transcript, sync it to MeetingTranscript collection
      if (transcript && transcript.length > 0) {
        await MeetingTranscript.deleteMany({ meetingId: meeting._id });
        const transcriptDocs = transcript.map((line: any) => ({
          meetingId: meeting._id,
          speaker: line.speaker,
          text: line.text,
          timestamp: line.timestamp || Date.now(),
        }));
        await MeetingTranscript.insertMany(transcriptDocs);
      }

      // Check if we have any transcripts for this meeting (either synced now or live-saved via socket)
      const count = await MeetingTranscript.countDocuments({ meetingId: meeting._id });
      if (count > 0) {
        const { AIService } = await import("../lib/aiService");
        const mId = meeting._id.toString();
        await AIService.generateSummary(mId, "Detailed");
        await AIService.generateSummary(mId, "Short");
        await AIService.generateInsights(mId);
        await AIService.extractActionItems(mId);
        req.log.info({ meetingId: mId }, "AI reports auto-compiled on meeting end");
      }
    } catch (aiErr) {
      req.log.error({ err: aiErr }, "AI reports auto-compilation failed on meeting end");
    }

    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt?.toISOString() ?? null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      actionItemCount: meeting.actionItems.length,
      openActionItemCount: meeting.actionItems.filter((item: any) => !item.isDone).length,
      hasNotes: !!meeting.notes,
    });
  } catch (error) {
    req.log.error({ error }, "Error ending meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /rooms/:roomId/active-meeting ───────────────────────────────────────
router.get("/rooms/:roomId/active-meeting", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { roomId } = req.params;
  try {
    const meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    if (!meeting) {
      res.status(404).json({ error: "Active meeting not found" });
      return;
    }

    // Access check
    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You are not authorized to access this meeting" });
      return;
    }

    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: null,
      durationSeconds: null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line: any) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })),
      actionItems: meeting.actionItems.map((item: any) => ({
        id: item._id!.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    req.log.error({ error }, "Error getting active meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /meetings ───────────────────────────────────────────────────────────
router.get("/meetings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { Participant } = await import("@workspace/db");
    const participantMeetings = await Participant.find({ user: req.user!.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);

    const meetings = await Meeting.find({
      $or: [
        { host: req.user!.id },
        { _id: { $in: meetingIds } }
      ]
    }).sort({ startedAt: -1 });

    const results = meetings.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      name: m.name,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt ? m.endedAt.toISOString() : null,
      durationSeconds: m.durationSeconds ?? null,
      participantNames: m.participantNames,
      actionItemCount: m.actionItems.length,
      openActionItemCount: m.actionItems.filter((i: any) => !i.isDone).length,
      hasNotes: !!m.notes,
      notes: m.notes || null,
      transcript: m.transcript.map((line: any) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })),
    }));

    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing meetings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /meetings/:meetingId ─────────────────────────────────────────────────
router.get("/meetings/:meetingId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = GetMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Access check
    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have access to this meeting" });
      return;
    }

    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line: any) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })),
      actionItems: meeting.actionItems.map((item: any) => ({
        id: item._id!.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    req.log.error({ error }, "Error getting meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /meetings/:meetingId/notes ───────────────────────────────────────────
router.put("/meetings/:meetingId/notes", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = UpsertNotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = UpsertNotesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify notes for this meeting" });
      return;
    }

    meeting.notes = body.data.content;
    await meeting.save();

    // Save notes version checkpoint
    const { MeetingNotesVersion } = await import("@workspace/db");
    const notesVersion = new MeetingNotesVersion({
      meetingId: meeting._id,
      content: body.data.content,
      author: req.user!.id,
    });
    await notesVersion.save();

    res.json({
      id: meeting._id.toString() + "_notes",
      meetingId: meeting._id.toString(),
      content: meeting.notes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error saving notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /meetings/:meetingId/notes/versions ──────────────────────────────────
router.get("/meetings/:meetingId/notes/versions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const hasAccess = await canAccessMeeting(req.params.meetingId as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view notes for this meeting" });
      return;
    }

    const { MeetingNotesVersion } = await import("@workspace/db");
    const versions = await MeetingNotesVersion.find({ meetingId: req.params.meetingId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(versions);
  } catch (error) {
    req.log.error({ error }, "Error fetching notes versions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /meetings/:meetingId/notes/restore ──────────────────────────────────
router.post("/meetings/:meetingId/notes/restore", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { versionId } = req.body;
  if (!versionId) {
    res.status(400).json({ error: "versionId is required" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(req.params.meetingId as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to restore notes for this meeting" });
      return;
    }

    const { MeetingNotesVersion } = await import("@workspace/db");
    const version = await MeetingNotesVersion.findOne({ _id: versionId, meetingId: req.params.meetingId });
    if (!version) {
      res.status(404).json({ error: "Version not found for this meeting" });
      return;
    }

    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    meeting.notes = version.content;
    await meeting.save();

    res.json({
      message: "Notes restored successfully",
      content: meeting.notes,
    });
  } catch (error) {
    req.log.error({ error }, "Error restoring notes version");
    res.status(500).json({ error: "Internal server error" });
  }
});


// ─── POST /meetings/:meetingId/action-items ───────────────────────────────────
router.post("/meetings/:meetingId/action-items", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = CreateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = CreateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to add action items for this meeting" });
      return;
    }

    const newItem = {
      text: body.data.text,
      assigneeName: body.data.assigneeName ?? null,
      dueDate: body.data.dueDate ?? null,
      isDone: false,
      createdAt: new Date(),
    };

    meeting.actionItems.push(newItem);
    await meeting.save();

    const created = meeting.actionItems[meeting.actionItems.length - 1];

    res.status(201).json({
      id: created._id!.toString(),
      meetingId: meeting._id.toString(),
      text: created.text,
      assigneeName: created.assigneeName ?? null,
      dueDate: created.dueDate ?? null,
      isDone: created.isDone,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error creating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /action-items/:actionItemId ───────────────────────────────────────
router.patch("/action-items/:actionItemId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = UpdateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }
  const body = UpdateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const meeting = await Meeting.findOne({ "actionItems._id": params.data.actionItemId });
    if (!meeting) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify action items for this meeting" });
      return;
    }

    const item = meeting.actionItems.id(params.data.actionItemId);
    if (!item) {
      res.status(404).json({ error: "Action item not found in meeting" });
      return;
    }

    if (body.data.text !== undefined) item.text = body.data.text;
    if (body.data.isDone !== undefined) item.isDone = body.data.isDone;
    if ("assigneeName" in body.data) item.assigneeName = body.data.assigneeName ?? null;
    if ("dueDate" in body.data) item.dueDate = body.data.dueDate ?? null;

    await meeting.save();

    res.json({
      id: item._id!.toString(),
      meetingId: meeting._id.toString(),
      text: item.text,
      assigneeName: item.assigneeName ?? null,
      dueDate: item.dueDate ?? null,
      isDone: item.isDone,
      createdAt: item.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error updating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /action-items/:actionItemId ──────────────────────────────────────
router.delete("/action-items/:actionItemId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const params = DeleteActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }

  try {
    const meeting = await Meeting.findOne({ "actionItems._id": params.data.actionItemId });
    if (!meeting) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to delete action items for this meeting" });
      return;
    }

    (meeting.actionItems as any).pull(params.data.actionItemId);
    await meeting.save();

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting action item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /dashboard/stats ─────────────────────────────────────────────────────
router.get("/dashboard/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { Participant } = await import("@workspace/db");
    const participantMeetings = await Participant.find({ user: req.user!.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);

    const meetings = await Meeting.find({
      $or: [
        { host: req.user!.id },
        { _id: { $in: meetingIds } }
      ]
    });
    const totalMeetings = meetings.length;

    let totalDurationSeconds = 0;
    let meetingsThisWeek = 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let openActionItems = 0;
    let completedActionItems = 0;

    meetings.forEach((m) => {
      totalDurationSeconds += m.durationSeconds || 0;
      if (m.startedAt && new Date(m.startedAt) >= weekAgo) {
        meetingsThisWeek += 1;
      }
      m.actionItems.forEach((item: any) => {
        if (item.isDone) {
          completedActionItems += 1;
        } else {
          openActionItems += 1;
        }
      });
    });

    res.json({
      totalMeetings,
      totalDurationSeconds,
      openActionItems,
      completedActionItems,
      meetingsThisWeek,
    });
  } catch (error) {
    req.log.error({ error }, "Error getting dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /meetings/:meetingId/ai-generate ───────────────────────────────────
router.post("/meetings/:meetingId/ai-generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to run AI generation for this meeting" });
      return;
    }

    const transcriptText = meeting.transcript
      .map((line: any) => `${line.speaker}: ${line.text}`)
      .join("\n");

    if (!transcriptText.trim()) {
      res.status(400).json({ error: "Cannot generate AI summary on empty transcript" });
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    let summaryText = "";
    let extractedActionItems: Array<{ text: string; assigneeName: string | null; dueDate: string | null }> = [];

    if (OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a meeting assistant. Summarize the transcript into markdown notes (include sections like Executive Summary, Key Decisions, Discussion Points). Also extract action items with assignees and due dates. Return response strictly as a JSON object: { \"notes\": \"markdown summary text\", \"actionItems\": [ { \"text\": \"description\", \"assigneeName\": \"name or null\", \"dueDate\": \"YYYY-MM-DD or null\" } ] }",
              },
              {
                role: "user",
                content: transcriptText,
              },
            ],
          }),
        });

        const data = await response.json() as any;
        const parsedResult = JSON.parse(data.choices[0].message.content);
        summaryText = parsedResult.notes;
        extractedActionItems = parsedResult.actionItems || [];
      } catch (err) {
        req.log.warn({ err }, "OpenAI call failed, falling back to simulated generation");
      }
    }

    // Clear previous action items upon intelligence regeneration to prevent duplicates
    meeting.actionItems = [];

    // Fallback simulated AI if OpenAI is unavailable
    if (!summaryText) {
      const speakerLines = meeting.transcript.length;
      
      summaryText = `### Executive Summary
This meeting was held to review room progress, coordinate developer tasks, and discuss upcoming features. The session captured a total of **${speakerLines} transcription lines** with active collaboration between the team.

### Key Decisions & Discussion Topics
`;

      const topics: string[] = [];
      const transcriptStr = meeting.transcript.map((l: any) => l.text.toLowerCase()).join(" ");
      
      if (transcriptStr.includes("database") || transcriptStr.includes("connection") || transcriptStr.includes("mongodb")) {
        topics.push("- **Database Integration**: Addressed MongoDB connection requirements, performance parameters, and the integration of Mongoose models.");
      }
      if (transcriptStr.includes("css") || transcriptStr.includes("style") || transcriptStr.includes("animation") || transcriptStr.includes("layout")) {
        topics.push("- **Design & UI Aesthetics**: Focused on polishing UI animations, Tailwind styling configurations, and grid responsive layout behavior.");
      }
      if (transcriptStr.includes("webrtc") || transcriptStr.includes("connection") || transcriptStr.includes("stream") || transcriptStr.includes("video")) {
        topics.push("- **Real-time Signaling & Media**: Reviewed WebRTC peer connections, stun/turn server configs, video tile layout grid, and audio context level analysers.");
      }
      if (transcriptStr.includes("recording") || transcriptStr.includes("chrome") || transcriptStr.includes("audio")) {
        topics.push("- **Session Recording**: Confirmed recording reliability metrics on Google Chrome and layout synchronization.");
      }
      if (transcriptStr.includes("release") || transcriptStr.includes("schedule") || transcriptStr.includes("q3") || transcriptStr.includes("build") || transcriptStr.includes("warning")) {
        topics.push("- **Release Management**: Coordinated compiler warnings resolution and preparation for the Q3 release lifecycle schedule.");
      }
      if (transcriptStr.includes("roles") || transcriptStr.includes("workspace") || transcriptStr.includes("access")) {
        topics.push("- **Workspace Access Control**: Audited user permissions, host roles, and member invitations.");
      }

      if (topics.length === 0) {
        topics.push("- **General Progress Sync**: Checked team status updates, general tasks coordination, and next-step actions.");
      }

      summaryText += topics.join("\n") + "\n\n";
      summaryText += `### Participant Contributions
- **Participants**: ${meeting.participantNames.join(", ") || "No recorded participants"}
- **Active Dialogue Highlights**:
`;

      const contributorSummary = meeting.transcript.slice(0, 6).map((line: any) => `  - **${line.speaker}**: *"${line.text}"*`).join("\n");
      summaryText += contributorSummary + "\n\n*Simulated AI generation engine successfully analysed meeting records.*";

      // Enhanced action item extraction
      meeting.transcript.forEach((line: any) => {
        const text = line.text.toLowerCase();
        let matchedTaskText = "";
        let daysToAdd = 3;

        if (text.includes("database connection") || text.includes("verify the database")) {
          matchedTaskText = "Verify the database connection parameters";
          daysToAdd = 2;
        } else if (text.includes("polish the css") || text.includes("polishing the css") || text.includes("css styles")) {
          matchedTaskText = "Polish the CSS styles and layouts";
          daysToAdd = 3;
        } else if (text.includes("client builds") || text.includes("compiler warning") || text.includes("warnings")) {
          matchedTaskText = "Resolve compiler warnings and build the client";
          daysToAdd = 1;
        } else if (text.includes("release schedule") || text.includes("q3")) {
          matchedTaskText = "Finalize Q3 release schedule plans";
          daysToAdd = 5;
        } else if (text.includes("active speaker") || text.includes("speaker detection") || text.includes("grid")) {
          matchedTaskText = "Validate active speaker detection and grid resizing logic";
          daysToAdd = 4;
        } else if (text.includes("webrtc connection") || text.includes("webrtc")) {
          matchedTaskText = "Audit WebRTC signaling states and connection issues";
          daysToAdd = 2;
        } else if (text.includes("recording") || text.includes("chrome")) {
          matchedTaskText = "Validate session recording playback on Google Chrome";
          daysToAdd = 3;
        } else if (text.includes("user roles") || text.includes("workspace access")) {
          matchedTaskText = "Audit workspace user roles and folder permissions";
          daysToAdd = 6;
        } else if (text.includes("release notes") || text.includes("walkthrough")) {
          matchedTaskText = "Draft the release notes and user walkthrough document";
          daysToAdd = 1;
        } else if (text.includes("latency") || text.includes("video layout")) {
          matchedTaskText = "Optimize video grid display latency";
          daysToAdd = 4;
        } else {
          // Fallback regex search for lines starting with task triggers
          const match = line.text.match(/(?:i will|need to|should|let's|i'll|please)\s+([^.?!,;]+)/i);
          if (match && match[1] && match[1].trim().length > 10) {
            matchedTaskText = match[1].trim();
            matchedTaskText = matchedTaskText.charAt(0).toUpperCase() + matchedTaskText.slice(1);
            daysToAdd = 3;
          }
        }

        if (matchedTaskText) {
          // Prevent duplicates in extracted list
          if (!extractedActionItems.some(item => item.text.toLowerCase() === matchedTaskText.toLowerCase())) {
            extractedActionItems.push({
              text: matchedTaskText,
              assigneeName: line.speaker,
              dueDate: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            });
          }
        }
      });

      // Default fallback task if nothing matches
      if (extractedActionItems.length === 0) {
        extractedActionItems.push({
          text: "Review meeting logs and sync task boards",
          assigneeName: meeting.participantNames[0] || "Organizer",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
      }
    }

    // Save summary notes
    meeting.notes = summaryText;

    // Append action items
    extractedActionItems.forEach((item: any) => {
      meeting.actionItems.push({
        text: item.text,
        assigneeName: item.assigneeName,
        dueDate: item.dueDate,
        isDone: false,
        createdAt: new Date(),
      });
    });

    await meeting.save();

    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes,
      transcript: meeting.transcript.map((line: any) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })),
      actionItems: meeting.actionItems.map((item: any) => ({
        id: item._id!.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    req.log.error({ error }, "Error in AI generation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to generate a unique meeting ID code
function generateMeetingId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 9; i++) {
    if (i > 0 && i % 3 === 0) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ─── POST /meetings/create ──────────────────────────────────────────────────
router.post("/meetings/create", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { title, description, password, isRecurring, recurrenceRule, waitingRoomEnabled, startTime } = parsed.data;

  try {
    const meetingId = generateMeetingId();
    const st = startTime ? new Date(startTime) : new Date();
    const status = st.getTime() > Date.now() + 60000 ? "scheduled" : "active";

    const meeting = new Meeting({
      // Compat fields
      roomId: meetingId,
      name: title,
      startedAt: st,

      // New fields
      title,
      description: description || "",
      host: req.user?.id,
      meetingId,
      password: password || "",
      status,
      startTime: st,
      isRecurring: !!isRecurring,
      recurrenceRule: recurrenceRule || "",
      isPersonalRoom: false,
      waitingRoomEnabled: !!waitingRoomEnabled,
    });

    await meeting.save();

    res.status(201).json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: null,
      durationSeconds: null,
      participantNames: [],
      notes: "",
      transcript: [],
      actionItems: [],
    });
  } catch (error) {
    req.log.error({ error }, "Error creating meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /meetings/join ─────────────────────────────────────────────────────
router.post("/meetings/join", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = JoinMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, password } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId, status: { $ne: "ended" } });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found or already ended" });
      return;
    }

    if (meeting.password && meeting.password !== password) {
      res.status(401).json({ error: "Invalid meeting password" });
      return;
    }

    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line: any) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })),
      actionItems: meeting.actionItems.map((item: any) => ({
        id: item._id!.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    req.log.error({ error }, "Error joining meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /meetings/leave ────────────────────────────────────────────────────
router.post("/meetings/leave", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = LeaveMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId } = parsed.data;

  try {
    const { Participant } = await import("@workspace/db");
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      await Participant.findOneAndUpdate(
        { meeting: meeting._id, user: userId, status: "admitted" },
        { status: "left", leftAt: new Date() }
      );
    }

    res.json({ message: "Left successfully" });
  } catch (error) {
    req.log.error({ error }, "Error leaving meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /meetings/:meetingId ──────────────────────────────────────────────
router.delete("/meetings/:meetingId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const meetingId = req.params.meetingId;
  if (!meetingId) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Host check
    if (!meeting.host || meeting.host.toString() !== req.user!.id) {
      res.status(403).json({ error: "Access denied: Only the host can delete this meeting" });
      return;
    }

    // Clean up related documents
    const {
      MeetingTranscript,
      MeetingSummary,
      ActionItem,
      Decision,
      MeetingInsight,
      Recording,
      MeetingNotesVersion,
      Participant,
    } = await import("@workspace/db");

    await Promise.all([
      Meeting.findByIdAndDelete(meetingId),
      MeetingTranscript.deleteMany({ meetingId }),
      MeetingSummary.deleteMany({ meetingId }),
      ActionItem.deleteMany({ meetingId }),
      Decision.deleteMany({ meetingId }),
      MeetingInsight.deleteMany({ meetingId }),
      Recording.deleteMany({ meeting: meetingId }),
      MeetingNotesVersion.deleteMany({ meetingId }),
      Participant.deleteMany({ meeting: meetingId }),
    ]);

    req.log.info({ meetingId }, "Meeting and related records deleted");
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
