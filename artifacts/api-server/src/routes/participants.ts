import { Router } from "express";
import { Participant, Meeting } from "@workspace/db";
import { MuteParticipantBody, RemoveParticipantBody, RaiseHandParticipantBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// ─── POST /participants/mute ──────────────────────────────────────────────────
router.post("/participants/mute", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = MuteParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId, isMuted } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Verify requesting user is the host of this meeting
    if (meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Only the host can mute other participants" });
      return;
    }

    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { isMuted },
      { new: true }
    );

    if (!participant) {
      res.status(404).json({ error: "Participant not found or not currently in meeting" });
      return;
    }

    res.json({
      id: participant._id.toString(),
      meetingId: meeting.meetingId,
      userId: participant.user?.toString() || null,
      displayName: participant.displayName,
      role: participant.role,
      status: participant.status,
      isMuted: participant.isMuted,
      isCameraOff: participant.isCameraOff,
      isRaisedHand: participant.isRaisedHand,
      joinedAt: participant.joinedAt.toISOString(),
      leftAt: participant.leftAt ? participant.leftAt.toISOString() : null,
    });
  } catch (error) {
    req.log.error({ error }, "Error muting participant");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /participants/remove ────────────────────────────────────────────────
router.post("/participants/remove", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = RemoveParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Verify requesting user is the host of this meeting
    if (meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Only the host can remove participants" });
      return;
    }

    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { status: "left", leftAt: new Date() },
      { new: true }
    );

    if (!participant) {
      res.status(404).json({ error: "Participant not found or not currently in meeting" });
      return;
    }

    res.json({ message: "Participant removed successfully" });
  } catch (error) {
    req.log.error({ error }, "Error removing participant");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /participants/raise-hand ────────────────────────────────────────────
router.post("/participants/raise-hand", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = RaiseHandParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId, isRaisedHand } = parsed.data;

  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    // Verify requesting user is the participant themselves, or the host of the meeting
    if (userId !== req.user?.id && meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Forbidden: You cannot modify other participants' states" });
      return;
    }

    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { isRaisedHand },
      { new: true }
    );

    if (!participant) {
      res.status(404).json({ error: "Participant not found or not in meeting" });
      return;
    }

    res.json({
      id: participant._id.toString(),
      meetingId: meeting.meetingId,
      userId: participant.user?.toString() || null,
      displayName: participant.displayName,
      role: participant.role,
      status: participant.status,
      isMuted: participant.isMuted,
      isCameraOff: participant.isCameraOff,
      isRaisedHand: participant.isRaisedHand,
      joinedAt: participant.joinedAt.toISOString(),
      leftAt: participant.leftAt ? participant.leftAt.toISOString() : null,
    });
  } catch (error) {
    req.log.error({ error }, "Error raising hand");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
