import { Router } from "express";
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
  const { roomId } = parsed.data;
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

export default router;
