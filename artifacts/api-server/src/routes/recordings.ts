import { Router } from "express";
import { Recording, Meeting } from "@workspace/db";
import { StartRecordingBody, StopRecordingBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

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

    // Find the latest recording for this meeting that is not populated yet
    const recording = await Recording.findOne({ meeting: meeting._id }).sort({ createdAt: -1 });
    if (!recording) {
      res.status(404).json({ error: "No active recording found for this meeting" });
      return;
    }

    recording.durationSeconds = durationSeconds;
    recording.sizeBytes = sizeBytes;
    await recording.save();

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
    // Return all recordings and populate meeting info
    const recordings = await Recording.find().populate("meeting").sort({ createdAt: -1 });

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
