import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./lib/logger";

interface RoomParticipant {
  userId: string;
  displayName: string;
  socketId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

const rooms = new Map<string, Map<string, RoomParticipant>>();

export function initSignaling(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    socket.on(
      "join-room",
      ({
        roomId,
        userId,
        displayName,
      }: {
        roomId: string;
        userId: string;
        displayName: string;
      }) => {
        currentRoomId = roomId;
        currentUserId = userId;

        socket.join(roomId);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }

        const room = rooms.get(roomId)!;

        // Send existing users to the new participant
        const existingUsers = Array.from(room.values()).map((p) => ({
          userId: p.userId,
          displayName: p.displayName,
          isMuted: p.isMuted,
          isCameraOff: p.isCameraOff,
          isScreenSharing: p.isScreenSharing,
        }));
        socket.emit("existing-users", existingUsers);

        // Add the new participant
        room.set(userId, {
          userId,
          displayName,
          socketId: socket.id,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
        });

        // Notify others that a new user joined
        socket.to(roomId).emit("user-connected", { userId, displayName });

        logger.info({ roomId, userId, displayName }, "User joined room");
      },
    );

    socket.on(
      "offer",
      ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const target = room.get(to);
        if (!target) return;
        io.to(target.socketId).emit("offer", {
          from: currentUserId,
          offer,
        });
      },
    );

    socket.on(
      "answer",
      ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const target = room.get(to);
        if (!target) return;
        io.to(target.socketId).emit("answer", {
          from: currentUserId,
          answer,
        });
      },
    );

    socket.on(
      "ice-candidate",
      ({
        to,
        candidate,
      }: {
        to: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const target = room.get(to);
        if (!target) return;
        io.to(target.socketId).emit("ice-candidate", {
          from: currentUserId,
          candidate,
        });
      },
    );

    socket.on(
      "media-state",
      ({
        isMuted,
        isCameraOff,
        isScreenSharing,
      }: {
        isMuted: boolean;
        isCameraOff: boolean;
        isScreenSharing: boolean;
      }) => {
        if (!currentRoomId || !currentUserId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const participant = room.get(currentUserId);
        if (participant) {
          participant.isMuted = isMuted;
          participant.isCameraOff = isCameraOff;
          participant.isScreenSharing = isScreenSharing;
        }
        socket.to(currentRoomId).emit("media-state-changed", {
          userId: currentUserId,
          isMuted,
          isCameraOff,
          isScreenSharing,
        });
      },
    );

    socket.on("leave-room", ({ roomId, userId }: { roomId: string; userId: string }) => {
      handleLeave(roomId, userId);
    });

    socket.on("disconnect", () => {
      if (currentRoomId && currentUserId) {
        handleLeave(currentRoomId, currentUserId);
      }
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });

    function handleLeave(roomId: string, userId: string) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.delete(userId);
      if (room.size === 0) {
        rooms.delete(roomId);
      }
      socket.to(roomId).emit("user-disconnected", { userId });
      socket.leave(roomId);
      logger.info({ roomId, userId }, "User left room");
    }
  });

  return io;
}

export function getRoomParticipantCount(roomId: string): number {
  return rooms.get(roomId)?.size ?? 0;
}
