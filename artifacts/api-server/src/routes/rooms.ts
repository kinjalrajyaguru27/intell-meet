import { Router } from "express";
import { CreateRoomBody, GetRoomParams } from "@workspace/api-zod";
import { getRoomParticipantCount } from "../signaling";
import { logger } from "../lib/logger";
import { db, meetingsTable } from "@workspace/db";

const router = Router();

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

router.post("/rooms", async (req, res) => {
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
    await db.insert(meetingsTable).values({ roomId: id, name, startedAt: now });
  } catch (err) {
    logger.warn({ err }, "Failed to persist meeting to DB");
  }

  req.log.info({ roomId: id, name }, "Room created");
  res.status(201).json({
    ...room,
    participantCount: 0,
  });
});

router.get("/rooms/:roomId", (req, res) => {
  const parsed = GetRoomParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const { roomId } = parsed.data;
  const room = roomStore.get(roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({
    ...room,
    participantCount: getRoomParticipantCount(roomId),
  });
});

export default router;
