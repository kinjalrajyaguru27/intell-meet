import { Router } from "express";
import mongoose from "mongoose";
import { CreateRoomBody, GetRoomParams } from "@workspace/api-zod";
import { getRoomParticipantCount } from "../signaling";
import { logger } from "../lib/logger";
import { Meeting } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();
router.use(requireAuth);

// In-memory room store (sufficient for a signaling server; replace with DB if persistence needed)
interface Room {
  id: string;
  name: string;
  createdAt: string;
}

const roomStore = new Map<string, Room>();

function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 9; i++) {
    if (i > 0 && i % 3 === 0) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

router.post("/rooms", async (req: AuthenticatedRequest, res) => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name } = parsed.data;
  const id = generateRoomId();
  const now = new Date();
  const room: Room = {
    id,
    name,
    createdAt: now.toISOString(),
  };
  roomStore.set(id, room);

  // Persist meeting to DB for history tracking
  try {
    const meeting = new Meeting({
      roomId: id,
      name,
      startedAt: now,
      title: name,
      meetingId: id,
      status: "active",
      startTime: now,
      waitingRoomEnabled: false,
      host: req.user!.id,
    });
    await meeting.save();
    req.log.info({ roomId: id, meetingId: meeting._id.toString() }, "Meeting persisted to MongoDB");
  } catch (err) {
    logger.warn({ err }, "Failed to persist meeting to DB");
  }

  req.log.info({ roomId: id, name }, "Room created");
  res.status(201).json({
    ...room,
    participantCount: 0,
  });
});

router.get("/rooms/:roomId", async (req: AuthenticatedRequest, res) => {
  const parsed = GetRoomParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const roomId = parsed.data.roomId.trim().toLowerCase();
  const room = roomStore.get(roomId);
  
  if (room) {
    res.json({
      ...room,
      participantCount: getRoomParticipantCount(roomId),
    });
    return;
  }

  // Fallback to MongoDB Meeting collection for scheduled, recurring, or instant meetings
  try {
    const meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    if (meeting) {
      res.json({
        id: meeting.roomId,
        name: meeting.title || meeting.name,
        createdAt: meeting.startedAt.toISOString(),
        participantCount: getRoomParticipantCount(roomId),
        host: meeting.host?.toString() || "",
        password: meeting.password ? "protected" : "",
      });
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Error checking meeting fallback for room");
  }

  res.status(404).json({ error: "Room not found" });
});

// ─── DATABASE-BACKED SIGNALING & CHAT HTTP POLING FALLBACK ENDPOINTS ─────

router.post("/rooms/:roomId/sync", async (req: AuthenticatedRequest, res) => {
  const roomId = ((req.params.roomId as string) || "").trim().toLowerCase();
  const { userId, displayName, isMuted, isCameraOff, isScreenSharing, isRaisedHand } = req.body;

  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    res.status(500).json({ error: "Database not connected" });
    return;
  }

  const lobbyParticipants = db.collection("lobby_participants");
  const lobbySignals = db.collection("lobby_signals");
  const lobbyChats = db.collection("lobby_chats");

  const now = new Date();

  try {
    // 1. Update/Upsert current participant's heartbeat
    await lobbyParticipants.updateOne(
      { roomId, userId },
      {
        $set: {
          roomId,
          userId,
          displayName,
          isMuted,
          isCameraOff,
          isScreenSharing,
          isRaisedHand,
          lastSeen: now,
        }
      },
      { upsert: true }
    );

    // 2. Remove stale participants (timeout: 6 seconds)
    const staleThreshold = new Date(now.getTime() - 6000);
    await lobbyParticipants.deleteMany({ roomId, lastSeen: { $lt: staleThreshold } });

    // 3. Get other active participants in the room
    const participantsCursor = lobbyParticipants.find({ roomId, userId: { $ne: userId } });
    const activeParticipants = await participantsCursor.toArray();

    // 4. Fetch and consume WebRTC signaling messages addressed to current user
    const signalsCursor = lobbySignals.find({ roomId, to: userId });
    const pendingSignals = await signalsCursor.toArray();
    if (pendingSignals.length > 0) {
      await lobbySignals.deleteMany({ roomId, to: userId });
    }

    // 5. Fetch recent chat history
    const chatsCursor = lobbyChats.find({ roomId }).sort({ timestamp: 1 }).limit(50);
    const chats = await chatsCursor.toArray();

    // 6. Get room host and lock state
    let roomHostId = "";
    let isRoomLocked = false;
    const meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    if (meeting) {
      roomHostId = meeting.host?.toString() || "";
      isRoomLocked = meeting.isLocked || false;
    }

    // 7. Get and clear pending host actions
    const currentParticipant = await lobbyParticipants.findOne({ roomId, userId });
    const hostActions = currentParticipant?.hostActions || [];
    if (hostActions.length > 0) {
      await lobbyParticipants.updateOne({ roomId, userId }, { $set: { hostActions: [] } });
    }

    res.json({
      participants: activeParticipants.map((p) => ({
        id: p.userId,
        displayName: p.displayName,
        isMuted: p.isMuted,
        isCameraOff: p.isCameraOff,
        isScreenSharing: p.isScreenSharing,
        isRaisedHand: p.isRaisedHand,
      })),
      signals: pendingSignals.map((s) => ({
        from: s.from,
        type: s.type,
        candidate: s.type === "candidate" ? s.payload : undefined,
        offer: s.type === "offer" ? s.payload : undefined,
        answer: s.type === "answer" ? s.payload : undefined,
      })),
      chatHistory: chats.map((c) => ({
        id: c._id.toString(),
        userId: c.userId,
        displayName: c.displayName,
        text: c.text,
        timestamp: c.timestamp,
      })),
      roomHostId,
      isRoomLocked,
      hostActions,
    });
  } catch (err: any) {
    logger.error({ err }, "Error in rooms/sync endpoint");
    res.status(500).json({ error: err.message || "Failed to sync room" });
  }
});

router.post("/rooms/:roomId/signal", async (req: AuthenticatedRequest, res) => {
  const roomId = ((req.params.roomId as string) || "").trim().toLowerCase();
  const { from, to, type, payload } = req.body;

  if (!from || !to || !type) {
    res.status(400).json({ error: "Missing from/to/type signaling fields" });
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    res.status(500).json({ error: "Database not connected" });
    return;
  }

  try {
    const lobbySignals = db.collection("lobby_signals");
    await lobbySignals.insertOne({
      roomId,
      from,
      to,
      type,
      payload,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Error inserting signaling message");
    res.status(500).json({ error: err.message || "Failed to route signal" });
  }
});

router.post("/rooms/:roomId/chat", async (req: AuthenticatedRequest, res) => {
  const roomId = ((req.params.roomId as string) || "").trim().toLowerCase();
  const { userId, displayName, text } = req.body;

  if (!userId || !text) {
    res.status(400).json({ error: "Missing userId or text chat fields" });
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    res.status(500).json({ error: "Database not connected" });
    return;
  }

  try {
    const lobbyChats = db.collection("lobby_chats");
    await lobbyChats.insertOne({
      roomId,
      userId,
      displayName,
      text,
      timestamp: Date.now(),
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Error inserting chat message");
    res.status(500).json({ error: err.message || "Failed to insert chat" });
  }
});

router.post("/rooms/:roomId/host-action", async (req: AuthenticatedRequest, res) => {
  const roomId = ((req.params.roomId as string) || "").trim().toLowerCase();
  const { action, targetUserId } = req.body;

  if (!action) {
    res.status(400).json({ error: "Missing host action field" });
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    res.status(500).json({ error: "Database not connected" });
    return;
  }

  try {
    const lobbyParticipants = db.collection("lobby_participants");

    if (action === "mute" && targetUserId) {
      await lobbyParticipants.updateOne(
        { roomId, userId: targetUserId },
        { $addToSet: { hostActions: "force-mute" } }
      );
    } else if (action === "disable-video" && targetUserId) {
      await lobbyParticipants.updateOne(
        { roomId, userId: targetUserId },
        { $addToSet: { hostActions: "force-disable-video" } }
      );
    } else if (action === "lock") {
      await Meeting.updateOne({ roomId, endedAt: null }, { $set: { isLocked: true } });
    } else if (action === "unlock") {
      await Meeting.updateOne({ roomId, endedAt: null }, { $set: { isLocked: false } });
    }

    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Error executing host action");
    res.status(500).json({ error: err.message || "Failed to execute host action" });
  }
});

export default router;
