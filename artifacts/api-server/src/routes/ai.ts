import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { AIService } from "../lib/aiService";
import {
  MeetingTranscript,
  MeetingSummary,
  ActionItem,
  MeetingInsight,
  Decision,
  Meeting,
  User,
  Participant,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { canAccessMeeting } from "../lib/authHelpers";

const router = Router();

// Apply auth to all AI routes
router.use(requireAuth);

// Helper to get allowed meeting IDs for a user
async function getAllowedMeetingIds(userId: string): Promise<any[]> {
  const participantMeetings = await Participant.find({ user: userId }).select("meeting");
  const meetingIds = participantMeetings.map((p) => p.meeting);

  const allowedMeetings = await Meeting.find({
    $or: [
      { host: userId },
      { _id: { $in: meetingIds } }
    ]
  }).select("_id");

  return allowedMeetings.map((m) => m._id);
}

// ─── POST /ai/transcribe ──────────────────────────────────────────────────────
router.post("/ai/transcribe", async (req: AuthenticatedRequest, res) => {
  const { meetingId, speaker, text } = req.body;
  if (!meetingId || !speaker || !text) {
    res.status(400).json({ error: "Missing required fields: meetingId, speaker, text" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to transcribe for this meeting" });
      return;
    }

    const transcript = new MeetingTranscript({
      meetingId,
      speaker,
      text,
      timestamp: Date.now(),
    });
    await transcript.save();

    res.status(200).json({
      id: transcript._id.toString(),
      meetingId: transcript.meetingId.toString(),
      speaker: transcript.speaker,
      text: transcript.text,
      timestamp: transcript.timestamp,
    });
  } catch (error) {
    logger.error({ error }, "Error saving transcribe line");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /ai/summarize ───────────────────────────────────────────────────────
router.post("/ai/summarize", async (req: AuthenticatedRequest, res) => {
  const { meetingId, summaryType } = req.body;
  if (!meetingId || !summaryType) {
    res.status(400).json({ error: "Missing meetingId or summaryType" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to summarize this meeting" });
      return;
    }

    const summary = await AIService.generateSummary(meetingId, summaryType);
    res.status(200).json({
      id: summary._id.toString(),
      meetingId: summary.meetingId.toString(),
      summaryType: summary.summaryType,
      shortSummary: summary.shortSummary,
      detailedSummary: summary.detailedSummary,
      executiveSummary: summary.executiveSummary,
      keyPoints: summary.keyPoints,
      decisions: summary.decisions,
      outcomes: summary.outcomes,
      highlights: summary.highlights,
      risks: summary.risks,
      opportunities: summary.opportunities,
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating summary");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// ─── POST /ai/action-items ───────────────────────────────────────────────────
router.post("/ai/action-items", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.body;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to extract action items for this meeting" });
      return;
    }

    const items = await AIService.extractActionItems(meetingId);
    const formatted = items.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error extracting action items");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /ai/insights ────────────────────────────────────────────────────────
router.post("/ai/insights", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.body;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to generate insights for this meeting" });
      return;
    }

    const insight = await AIService.generateInsights(meetingId);
    const speaks: Record<string, number> = {};
    if (insight.speakingTimeAnalytics) {
      insight.speakingTimeAnalytics.forEach((val: number, key: string) => {
        speaks[key] = val;
      });
    }

    res.status(200).json({
      id: insight._id.toString(),
      meetingId: insight.meetingId.toString(),
      productivityScore: insight.productivityScore,
      engagementScore: insight.engagementScore,
      sentimentScore: insight.sentimentScore,
      sentimentAnalysis: insight.sentimentAnalysis,
      participationScore: insight.participationScore,
      speakingTimeAnalytics: speaks,
      mostActiveParticipant: insight.mostActiveParticipant,
      leastActiveParticipant: insight.leastActiveParticipant,
      topicAnalysis: insight.topicAnalysis,
    });
  } catch (error) {
    logger.error({ error }, "Error generating insights");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /ai/insights ─────────────────────────────────────────────────────────
router.get("/ai/insights", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view insights for this meeting" });
      return;
    }

    const insight = await MeetingInsight.findOne({ meetingId });
    if (!insight) {
      res.status(404).json({ error: "Insights not found for this meeting" });
      return;
    }

    const speaks: Record<string, number> = {};
    if (insight.speakingTimeAnalytics) {
      insight.speakingTimeAnalytics.forEach((val: number, key: string) => {
        speaks[key] = val;
      });
    }

    res.status(200).json({
      id: insight._id.toString(),
      meetingId: insight.meetingId.toString(),
      productivityScore: insight.productivityScore,
      engagementScore: insight.engagementScore,
      sentimentScore: insight.sentimentScore,
      sentimentAnalysis: insight.sentimentAnalysis,
      participationScore: insight.participationScore,
      speakingTimeAnalytics: speaks,
      mostActiveParticipant: insight.mostActiveParticipant,
      leastActiveParticipant: insight.leastActiveParticipant,
      topicAnalysis: insight.topicAnalysis,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching insights");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /ai/summaries ────────────────────────────────────────────────────────
router.get("/ai/summaries", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view summaries for this meeting" });
      return;
    }

    const summaries = await MeetingSummary.find({ meetingId });
    const formatted = summaries.map((s) => ({
      id: s._id.toString(),
      meetingId: s.meetingId.toString(),
      summaryType: s.summaryType,
      shortSummary: s.shortSummary,
      detailedSummary: s.detailedSummary,
      executiveSummary: s.executiveSummary,
      keyPoints: s.keyPoints,
      decisions: s.decisions,
      outcomes: s.outcomes,
      highlights: s.highlights,
      risks: s.risks,
      opportunities: s.opportunities,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching summaries");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /ai/transcripts ──────────────────────────────────────────────────────
router.get("/ai/transcripts", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }

  try {
    const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view transcripts for this meeting" });
      return;
    }

    const transcripts = await MeetingTranscript.find({ meetingId }).sort({ timestamp: 1 });
    const formatted = transcripts.map((t) => ({
      id: t._id.toString(),
      meetingId: t.meetingId.toString(),
      speaker: t.speaker,
      text: t.text,
      timestamp: t.timestamp,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching transcripts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /ai/decisions ────────────────────────────────────────────────────────
router.get("/ai/decisions", async (req: AuthenticatedRequest, res) => {
  const { meetingId, search } = req.query;
  const filter: any = {};

  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user!.id);

    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You do not have permission to view decisions for this meeting" });
        return;
      }
      filter.meetingId = meetingId;
    } else {
      filter.meetingId = { $in: allowedMeetingIds };
    }

    if (search) filter.decision = new RegExp(search as string, "i");

    const decisions = await Decision.find(filter).sort({ timestamp: -1 });
    const formatted = decisions.map((d) => ({
      id: d._id.toString(),
      meetingId: d.meetingId.toString(),
      decision: d.decision,
      owner: d.owner,
      timestamp: d.timestamp.toISOString(),
      impact: d.impact,
      relatedTasks: d.relatedTasks,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching decisions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /ai/action-items ─────────────────────────────────────────────────────
router.get("/ai/action-items", async (req: AuthenticatedRequest, res) => {
  const { meetingId } = req.query;
  const filter: any = {};

  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user!.id);

    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You do not have permission to view AI action items for this meeting" });
        return;
      }
      filter.meetingId = meetingId;
    } else {
      filter.meetingId = { $in: allowedMeetingIds };
    }

    const items = await ActionItem.find(filter).sort({ createdAt: -1 });
    const formatted = items.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching action items");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /ai/action-items/:id ───────────────────────────────────────────────────
router.put("/ai/action-items/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { taskId, status, assignee, assigneeName } = req.body;

  try {
    const item = await ActionItem.findById(id);
    if (!item) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }

    const hasAccess = await canAccessMeeting(item.meetingId, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify action items for this meeting" });
      return;
    }

    if (taskId !== undefined) item.taskId = taskId || null;
    if (status !== undefined) item.status = status;
    if (assignee !== undefined) item.assignee = assignee || null;
    if (assigneeName !== undefined) item.assigneeName = assigneeName;

    await item.save();

    res.status(200).json({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status,
    });
  } catch (error) {
    logger.error({ error }, "Error updating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});


// ─── GET /ai/search ───────────────────────────────────────────────────────────
router.get("/ai/search", async (req: AuthenticatedRequest, res) => {
  const { query, date, teamId, meetingId, user } = req.query;

  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user!.id);

    const filterMeeting: any = {
      _id: { $in: allowedMeetingIds }
    };
    const filterAction: any = {
      meetingId: { $in: allowedMeetingIds }
    };
    const filterDecision: any = {
      meetingId: { $in: allowedMeetingIds }
    };
    const filterSummary: any = {
      meetingId: { $in: allowedMeetingIds }
    };

    // 1. Simple search query parameter
    if (query) {
      const regex = new RegExp(query as string, "i");
      filterMeeting.$and = [
        { _id: { $in: allowedMeetingIds } },
        {
          $or: [{ title: regex }, { description: regex }, { notes: regex }, { participantNames: regex }]
        }
      ];
      filterAction.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        {
          $or: [{ title: regex }, { description: regex }, { assigneeName: regex }]
        }
      ];
      filterDecision.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        { decision: regex }
      ];
      filterSummary.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        {
          $or: [{ shortSummary: regex }, { detailedSummary: regex }, { executiveSummary: regex }]
        }
      ];
    }

    // 2. Filter by date
    if (date) {
      const d = new Date(date as string);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      filterMeeting.startTime = { $gte: startOfDay, $lte: endOfDay };
      
      const matchingMeetings = await Meeting.find({
        _id: { $in: allowedMeetingIds },
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });
      const ids = matchingMeetings.map((m) => m._id);
      
      filterAction.meetingId = { $in: ids };
      filterDecision.meetingId = { $in: ids };
      filterSummary.meetingId = { $in: ids };
    }

    // 3. Filter by meetingId
    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId as string, req.user!.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      filterMeeting._id = meetingId;
      filterAction.meetingId = meetingId;
      filterDecision.meetingId = meetingId;
      filterSummary.meetingId = meetingId;
    }

    // 4. Filter by user (assignee / owner / participant)
    if (user) {
      const regex = new RegExp(user as string, "i");
      
      if (filterMeeting.$and) {
        filterMeeting.$and.push({ participantNames: regex });
      } else {
        filterMeeting.participantNames = regex;
      }

      if (filterAction.$and) {
        filterAction.$and.push({ assigneeName: regex });
      } else {
        filterAction.assigneeName = regex;
      }

      if (filterDecision.$and) {
        filterDecision.$and.push({ owner: regex });
      } else {
        filterDecision.owner = regex;
      }
    }

    // Run queries
    const meetingsList = await Meeting.find(filterMeeting).sort({ startTime: -1 }).limit(10);
    const actionList = await ActionItem.find(filterAction).sort({ createdAt: -1 }).limit(20);
    const decisionList = await Decision.find(filterDecision).sort({ timestamp: -1 }).limit(20);
    const summaryList = await MeetingSummary.find(filterSummary).sort({ createdAt: -1 }).limit(20);

    const formattedMeetings = meetingsList.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      name: m.name,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt ? m.endedAt.toISOString() : null,
      durationSeconds: m.durationSeconds,
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

    const formattedActions = actionList.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status,
    }));

    const formattedDecisions = decisionList.map((d) => ({
      id: d._id.toString(),
      meetingId: d.meetingId.toString(),
      decision: d.decision,
      owner: d.owner,
      timestamp: d.timestamp.toISOString(),
      impact: d.impact,
      relatedTasks: d.relatedTasks,
    }));

    const formattedSummaries = summaryList.map((s) => ({
      id: s._id.toString(),
      meetingId: s.meetingId.toString(),
      summaryType: s.summaryType,
      shortSummary: s.shortSummary,
      detailedSummary: s.detailedSummary,
      executiveSummary: s.executiveSummary,
      keyPoints: s.keyPoints,
      decisions: s.decisions,
      outcomes: s.outcomes,
      highlights: s.highlights,
      risks: s.risks,
      opportunities: s.opportunities,
    }));

    res.status(200).json({
      meetings: formattedMeetings,
      actionItems: formattedActions,
      decisions: formattedDecisions,
      summaries: formattedSummaries,
    });
  } catch (error) {
    logger.error({ error }, "Error executing AI search engine");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
