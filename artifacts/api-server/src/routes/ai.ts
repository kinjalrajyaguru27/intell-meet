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
} from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

// Apply auth to all AI routes
router.use(requireAuth);

// ─── POST /ai/transcribe ──────────────────────────────────────────────────────
router.post("/ai/transcribe", async (req: AuthenticatedRequest, res) => {
  const { meetingId, speaker, text } = req.body;
  if (!meetingId || !speaker || !text) {
    res.status(400).json({ error: "Missing required fields: meetingId, speaker, text" });
    return;
  }

  try {
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
  if (meetingId) filter.meetingId = meetingId;
  if (search) filter.decision = new RegExp(search as string, "i");

  try {
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
  if (meetingId) filter.meetingId = meetingId;

  try {
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
    const filterMeeting: any = {};
    const filterAction: any = {};
    const filterDecision: any = {};
    const filterSummary: any = {};

    // 1. Simple search query parameter
    if (query) {
      const regex = new RegExp(query as string, "i");
      filterMeeting.$or = [{ title: regex }, { description: regex }, { notes: regex }, { participantNames: regex }];
      filterAction.$or = [{ title: regex }, { description: regex }, { assigneeName: regex }];
      filterDecision.decision = regex;
      filterSummary.$or = [{ shortSummary: regex }, { detailedSummary: regex }, { executiveSummary: regex }];
    }

    // 2. Filter by date
    if (date) {
      const d = new Date(date as string);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      filterMeeting.startTime = { $gte: startOfDay, $lte: endOfDay };
      // Decisions, summaries, action items are joined via meetings matching date
      const matchingMeetings = await Meeting.find({ startTime: { $gte: startOfDay, $lte: endOfDay } });
      const ids = matchingMeetings.map((m) => m._id);
      filterAction.meetingId = { $in: ids };
      filterDecision.meetingId = { $in: ids };
      filterSummary.meetingId = { $in: ids };
    }

    // 3. Filter by meetingId
    if (meetingId) {
      filterMeeting._id = meetingId;
      filterAction.meetingId = meetingId;
      filterDecision.meetingId = meetingId;
      filterSummary.meetingId = meetingId;
    }

    // 4. Filter by user (assignee / owner / participant)
    if (user) {
      const regex = new RegExp(user as string, "i");
      filterMeeting.participantNames = regex;
      filterAction.assigneeName = regex;
      filterDecision.owner = regex;
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
