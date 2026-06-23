import { Router } from "express";
import { Recording, Meeting } from "@workspace/db";
import { StartRecordingBody, StopRecordingBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { canAccessMeeting } from "../lib/authHelpers";

const router = Router();

// ─── POST /recordings/start ──────────────────────────────────────────────────
router.post("/recordings/start", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = StartRecordingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, title } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Access check
    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to record this meeting" });
      return;
    }

    // Create a new recording record with initial placeholders
    const recording = new Recording({
      meeting: meeting._id,
      title: title || `Recording - ${meeting.title || meeting.name}`,
      fileUrl: `/static/recordings/${meetingId}-${Date.now()}.mp4`, // Static path
      durationSeconds: 0,
      sizeBytes: 0,
      recordedBy: req.user?.id,
    });

    await recording.save();

    // Log activity
    const { logActivity } = await import("../lib/activity");
    await logActivity(
      req.user!.id,
      "recording_started",
      recording._id.toString(),
      "Recording",
      `Started recording for meeting "${meeting.title || meeting.name}"`
    );

    res.json({
      id: recording._id.toString(),
      meetingId: meeting.meetingId,
      title: recording.title,
      fileUrl: recording.fileUrl,
      durationSeconds: recording.durationSeconds,
      sizeBytes: recording.sizeBytes,
      recordedBy: recording.recordedBy.toString(),
      createdAt: recording.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error starting recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /recordings/stop ───────────────────────────────────────────────────
router.post("/recordings/stop", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = StopRecordingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, durationSeconds, sizeBytes } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Access check
    const hasAccess = await canAccessMeeting(meeting._id, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify recordings for this meeting" });
      return;
    }

    // Find the latest recording for this meeting that is not populated yet
    const recording = await Recording.findOne({ meeting: meeting._id }).sort({ createdAt: -1 });
    if (!recording) {
      res.status(404).json({ error: "No active recording found for this meeting" });
      return;
    }

    recording.durationSeconds = durationSeconds;
    recording.sizeBytes = sizeBytes;
    await recording.save();

    // Log activity
    const { logActivity } = await import("../lib/activity");
    await logActivity(
      req.user!.id,
      "recording_stopped",
      recording._id.toString(),
      "Recording",
      `Stopped recording for meeting "${meeting.title || meeting.name}"`
    );

    res.json({
      id: recording._id.toString(),
      meetingId: meeting.meetingId,
      title: recording.title,
      fileUrl: recording.fileUrl,
      durationSeconds: recording.durationSeconds,
      sizeBytes: recording.sizeBytes,
      recordedBy: recording.recordedBy.toString(),
      createdAt: recording.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error stopping recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /recordings ──────────────────────────────────────────────────────────
router.get("/recordings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Find all meetings user has access to (host or participant)
    const { Participant } = await import("@workspace/db");
    const participantMeetings = await Participant.find({ user: req.user!.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);

    const allowedMeetings = await Meeting.find({
      $or: [
        { host: req.user!.id },
        { _id: { $in: meetingIds } }
      ]
    }).select("_id");

    const allowedMeetingIds = allowedMeetings.map((m) => m._id);

    // Return recordings only for meetings the user is authorized to access
    const recordings = await Recording.find({ meeting: { $in: allowedMeetingIds } })
      .populate("meeting")
      .sort({ createdAt: -1 });

    const results = recordings.map((r: any) => ({
      id: r._id.toString(),
      meetingId: r.meeting?.meetingId || "",
      title: r.title,
      fileUrl: r.fileUrl,
      durationSeconds: r.durationSeconds,
      sizeBytes: r.sizeBytes,
      recordedBy: r.recordedBy.toString(),
      createdAt: r.createdAt.toISOString(),
    }));

    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing recordings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
