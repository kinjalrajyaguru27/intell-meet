import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./lib/logger";
import jwt from "jsonwebtoken";
import { Meeting, Participant, MeetingTranscript, Message, Channel, Team, User, Notification } from "@workspace/db";

const JWT_SECRET = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";

interface RTCSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

interface RoomParticipant {
  userId: string;
  displayName: string;
  socketId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRaisedHand: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

// Global maps to track state
const rooms = new Map<string, Map<string, RoomParticipant>>();
const chatHistory = new Map<string, ChatMessage[]>();
const waitingUsers = new Map<string, Array<{ userId: string; displayName: string; socketId: string }>>();
const lockedMeetings = new Map<string, boolean>();

// Feature 4: Online Presence and socket mapping
export const activeUsers = new Map<string, Set<string>>(); // userId -> Set of socketId
export const userPresence = new Map<string, "online" | "offline" | "away" | "in-meeting">(); // userId -> Presence Status

const MAX_CHAT_HISTORY = 100;

export let ioInstance: SocketIOServer | null = null;

// Helper to push real-time notifications and persist them
export async function pushNotificationToUser(
  recipientId: string,
  type: "mention" | "reply" | "message" | "file_upload" | "task_assignment" | "meeting_reminder",
  title: string,
  content: string,
  link?: string
) {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      content,
      link: link || "",
      isRead: false,
    });
    await notification.save();

    logger.info({ recipientId, type, title }, "Notification created and saved to DB");

    if (ioInstance) {
      const sockets = activeUsers.get(recipientId);
      if (sockets) {
        sockets.forEach((sId) => {
          ioInstance!.to(sId).emit("notification", notification);
        });
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to create/send real-time notification");
  }
}

export function initSignaling(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

  // Secure Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn({ socketId: socket.id }, "Socket connection rejected: No token provided");
      return next(new Error("Authentication error: Token required"));
    }
    try {
      const decoded = jwt.verify(token as string, JWT_SECRET) as {
        id: string;
        email: string;
        role: "Admin" | "Manager" | "Member";
        name: string;
      };
      socket.data.user = decoded;
      next();
    } catch (err) {
      logger.warn({ socketId: socket.id, err }, "Socket connection rejected: Invalid token");
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info({ socketId: socket.id, userId: user?.id }, "Secure socket connected");

    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    // Track presence and active socket mapping
    if (user?.id) {
      if (!activeUsers.has(user.id)) {
        activeUsers.set(user.id, new Set());
      }
      activeUsers.get(user.id)!.add(socket.id);
      
      const previousPresence = userPresence.get(user.id);
      if (previousPresence !== "in-meeting") {
        userPresence.set(user.id, "online");
        io.emit("presence-changed", {
          userId: user.id,
          status: "online",
          timestamp: Date.now(),
        });
      }
    }

    // Join room endpoint (WebRTC video meeting)
    socket.on(
      "join-room",
      async ({
        roomId,
        userId,
        displayName,
        isMuted,
        isCameraOff,
      }: {
        roomId: string;
        userId: string;
        displayName: string;
        isMuted?: boolean;
        isCameraOff?: boolean;
      }) => {
        currentRoomId = roomId;
        currentUserId = userId;

        try {
          // Check if the meeting is locked
          if (lockedMeetings.get(roomId)) {
            socket.emit("waiting-room-status", { status: "locked" });
            socket.disconnect();
            return;
          }

          // Fetch meeting details from database
          const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
          const isHost = meeting ? meeting.host?.toString() === user?.id : false;

          // Handle Waiting Room Queue
          if (meeting && meeting.waitingRoomEnabled && !isHost) {
            // Check if already admitted in DB
            const isAdmitted = await Participant.findOne({
              meeting: meeting._id,
              user: user?.id,
              status: "admitted",
            });

            if (!isAdmitted) {
              if (!waitingUsers.has(roomId)) {
                waitingUsers.set(roomId, []);
              }
              const queue = waitingUsers.get(roomId)!;
              if (!queue.some((q) => q.userId === userId)) {
                queue.push({ userId, displayName, socketId: socket.id });
              }

              // Save Participant in database as "waiting"
              await Participant.findOneAndUpdate(
                { meeting: meeting._id, user: user?.id },
                { displayName, role: "participant", status: "waiting", joinedAt: new Date() },
                { upsert: true }
              );

              // Notify the hosts in this room
              if (rooms.has(roomId)) {
                const roomPeers = rooms.get(roomId)!;
                const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
                hosts.forEach((h) => {
                  io.to(h.socketId).emit("waiting-users-list", queue);
                });
              }

              socket.emit("waiting-room-status", { status: "waiting" });
              logger.info({ roomId, userId }, "User added to waiting room queue");
              return;
            }
          }

          // Join standard room
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
            isRaisedHand: p.isRaisedHand,
          }));
          socket.emit("existing-users", existingUsers);

          // Send chat history
          const history = chatHistory.get(roomId) ?? [];
          socket.emit("chat-history", history);

          // Add participant
          room.set(userId, {
            userId,
            displayName,
            socketId: socket.id,
            isMuted: !!isMuted,
            isCameraOff: !!isCameraOff,
            isScreenSharing: false,
            isRaisedHand: false,
          });

          // Save Participant in database as "admitted"
          if (meeting) {
            await Participant.findOneAndUpdate(
              { meeting: meeting._id, user: user?.id },
              {
                displayName,
                role: isHost ? "host" : "participant",
                status: "admitted",
                joinedAt: new Date(),
                leftAt: null,
              },
              { upsert: true }
            );

            // Add participant's name to meeting history record
            await Meeting.findByIdAndUpdate(meeting._id, {
              $addToSet: { participantNames: displayName },
            });

            // Log activity
            const { logActivity } = await import("./lib/activity");
            if (user?.id) {
              await logActivity(
                user.id,
                "meeting_joined",
                meeting._id.toString(),
                "Meeting",
                `Joined meeting "${meeting.title || meeting.name}"`
              );
            }
          }

          // If they are the host, send them the current waiting list
          if (isHost) {
            const queue = waitingUsers.get(roomId) ?? [];
            socket.emit("waiting-users-list", queue);
          }

          // Notify others
          socket.to(roomId).emit("user-connected", {
            userId,
            displayName,
            isMuted: !!isMuted,
            isCameraOff: !!isCameraOff,
            isScreenSharing: false,
            isRaisedHand: false,
          });

          // Broadcast initial locked status
          socket.emit("room-lock-changed", { isLocked: !!lockedMeetings.get(roomId) });

          // Update presence to "in-meeting"
          if (user?.id) {
            userPresence.set(user.id, "in-meeting");
            io.emit("presence-changed", {
              userId: user.id,
              status: "in-meeting",
              timestamp: Date.now(),
            });
          }

          logger.info({ roomId, userId, displayName }, "User joined room");
        } catch (error) {
          logger.error({ error }, "Error during join-room handler");
          socket.emit("error", "Failed to join meeting room.");
        }
      }
    );

    // ─── PRESENCE CONTROL ───────────────────────────────────────────────────
    socket.on("update-presence", ({ status }: { status: "online" | "away" | "in-meeting" }) => {
      if (user?.id) {
        userPresence.set(user.id, status);
        io.emit("presence-changed", {
          userId: user.id,
          status,
          timestamp: Date.now(),
        });
        logger.info({ userId: user.id, status }, "Presence updated via socket");
      }
    });

    socket.on("get-presence", () => {
      const list = Array.from(userPresence.entries()).map(([userId, status]) => ({
        userId,
        status,
      }));
      socket.emit("presence-list", list);
    });

    // ─── CHANNELS CHAT ROOM JOIN/LEAVE ──────────────────────────────────────
    socket.on("join-channel", ({ channelId }: { channelId: string }) => {
      socket.join(channelId);
      logger.info({ socketId: socket.id, channelId }, "Socket joined channel room");
    });

    socket.on("leave-channel", ({ channelId }: { channelId: string }) => {
      socket.leave(channelId);
      logger.info({ socketId: socket.id, channelId }, "Socket left channel room");
    });

    // ─── CHANNEL MESSAGES ───────────────────────────────────────────────────
    socket.on("send-channel-message", async ({ channelId, text, fileId }: { channelId: string; text: string; fileId?: string }) => {
      if (!user?.id) return;
      try {
        const channelObj = await Channel.findById(channelId);
        if (!channelObj) {
          socket.emit("error", "Channel not found");
          return;
        }

        // Verify team membership
        const team = await Team.findOne({ _id: channelObj.teamId, "members.user": user.id });
        if (!team) {
          socket.emit("error", "Forbidden: You are not a member of this team");
          return;
        }

        const msg = new Message({
          sender: user.id,
          channel: channelId,
          text: text || "",
          file: fileId || undefined,
          delivered: true,
        });
        await msg.save();

        const populated = await Message.findById(msg._id)
          .populate("sender", "name email avatar")
          .populate("file");

        io.to(channelId).emit("channel-message", populated);

        // Scan for mentions
        for (const member of team.members) {
          if (member.user.toString() === user.id) continue;

          const memberUser = await User.findById(member.user);
          if (memberUser && text.toLowerCase().includes(`@${memberUser.name.toLowerCase()}`)) {
            await pushNotificationToUser(
              memberUser._id.toString(),
              "mention",
              `Mentioned in #${channelObj.name}`,
              `${user.name}: "${text.length > 50 ? text.slice(0, 50) + "..." : text}"`,
              `/dashboard?tab=chat&channel=${channelId}`
            );
          }
        }
      } catch (err) {
        logger.error({ err }, "Error sending channel message via socket");
      }
    });

    // ─── DIRECT MESSAGES (1-on-1 Chat) ──────────────────────────────────────
    socket.on("send-direct-message", async ({ recipientId, text, fileId }: { recipientId: string; text: string; fileId?: string }) => {
      if (!user?.id) return;
      try {
        const msg = new Message({
          sender: user.id,
          recipient: recipientId,
          text: text || "",
          file: fileId || undefined,
          delivered: true,
        });
        await msg.save();

        const populated = await Message.findById(msg._id)
          .populate("sender", "name email avatar")
          .populate("recipient", "name email avatar")
          .populate("file");

        // Send to recipient's sockets
        const recipientSockets = activeUsers.get(recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((sId) => {
            io.to(sId).emit("direct-message", populated);
          });
        }

        // Send to other sockets of the sender
        const senderSockets = activeUsers.get(user.id);
        if (senderSockets) {
          senderSockets.forEach((sId) => {
            io.to(sId).emit("direct-message", populated);
          });
        }

        // Send real-time notification to recipient
        await pushNotificationToUser(
          recipientId,
          "message",
          `Message from ${user.name}`,
          text.length > 50 ? text.slice(0, 50) + "..." : text,
          `/dashboard?tab=chat&dm=${user.id}`
        );
      } catch (err) {
        logger.error({ err }, "Error sending direct message via socket");
      }
    });

    // ─── TYPING INDICATORS ──────────────────────────────────────────────────
    socket.on("typing-indicator", ({ recipientId, channelId, isTyping }: { recipientId?: string; channelId?: string; isTyping: boolean }) => {
      if (!user?.id) return;
      const payload = {
        userId: user.id,
        displayName: user.name,
        recipientId,
        channelId,
        isTyping,
      };

      if (channelId) {
        socket.to(channelId).emit("typing-indicator", payload);
      } else if (recipientId) {
        const recipientSockets = activeUsers.get(recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((sId) => {
            io.to(sId).emit("typing-indicator", payload);
          });
        }
      }
    });

    // ─── MESSAGE READ RECEIPTS ──────────────────────────────────────────────
    socket.on("message-read", async ({ messageIds, senderId, channelId }: { messageIds: string[]; senderId?: string; channelId?: string }) => {
      if (!user?.id) return;
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: user.id } }
        );

        const payload = {
          messageIds,
          readBy: user.id,
          senderId,
          channelId,
        };

        if (channelId) {
          socket.to(channelId).emit("messages-read-update", payload);
        } else if (senderId) {
          const senderSockets = activeUsers.get(senderId);
          if (senderSockets) {
            senderSockets.forEach((sId) => {
              io.to(sId).emit("messages-read-update", payload);
            });
          }
        }
      } catch (err) {
        logger.error({ err }, "Error updating message read status");
      }
    });

    // ─── WAITING ROOM ACTIONS (Host Controls) ───────────────────────────────
    socket.on("admit-user", async ({ roomId, userId: targetUserId }: { roomId: string; userId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return; // Only host can admit

        const queue = waitingUsers.get(roomId) ?? [];
        const target = queue.find((q) => q.userId === targetUserId);

        if (target) {
          // Remove from queue
          waitingUsers.set(
            roomId,
            queue.filter((q) => q.userId !== targetUserId)
          );

          // Update database participant state
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: targetUserId },
            { status: "admitted", joinedAt: new Date() }
          );

          // Notify hosts of updated queue
          const roomPeers = rooms.get(roomId) ?? new Map();
          const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
          hosts.forEach((h) => {
            io.to(h.socketId).emit("waiting-users-list", waitingUsers.get(roomId) ?? []);
          });

          // Send admitted event to the target client
          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            targetSocket.emit("waiting-room-status", { status: "admitted" });
          }
        }
      } catch (err) {
        logger.error({ err }, "Error admitting user");
      }
    });

    socket.on("reject-user", async ({ roomId, userId: targetUserId }: { roomId: string; userId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        const queue = waitingUsers.get(roomId) ?? [];
        const target = queue.find((q) => q.userId === targetUserId);

        if (target) {
          waitingUsers.set(
            roomId,
            queue.filter((q) => q.userId !== targetUserId)
          );

          // Update DB
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: targetUserId },
            { status: "rejected", leftAt: new Date() }
          );

          // Notify hosts of updated queue
          const roomPeers = rooms.get(roomId) ?? new Map();
          const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
          hosts.forEach((h) => {
            io.to(h.socketId).emit("waiting-users-list", waitingUsers.get(roomId) ?? []);
          });

          // Disconnect target user
          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            targetSocket.emit("waiting-room-status", { status: "rejected" });
            targetSocket.disconnect();
          }
        }
      } catch (err) {
        logger.error({ err }, "Error rejecting user");
      }
    });

    // ─── HOST CONTROLS ──────────────────────────────────────────────────────
    socket.on("mute-user", async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-mute");
          logger.info({ roomId, targetUserId }, "Host force-muted participant");
        }
      } catch (err) {
        logger.error({ err }, "Error muting user");
      }
    });

    socket.on("disable-video", async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-disable-video");
          logger.info({ roomId, targetUserId }, "Host disabled participant video");
        }
      } catch (err) {
        logger.error({ err }, "Error disabling user video");
      }
    });

    socket.on("remove-user", async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-leave");
          logger.info({ roomId, targetUserId }, "Host removed participant from room");
        }
      } catch (err) {
        logger.error({ err }, "Error removing user");
      }
    });

    socket.on("lock-meeting", async ({ roomId, isLocked }: { roomId: string; isLocked: boolean }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        lockedMeetings.set(roomId, isLocked);
        io.to(roomId).emit("room-lock-changed", { isLocked });
        logger.info({ roomId, isLocked }, "Host updated meeting lock state");
      } catch (err) {
        logger.error({ err }, "Error locking meeting");
      }
    });

    socket.on("transfer-host", async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;

        // Update database
        meeting.host = targetUserId as any;
        await meeting.save();

        io.to(roomId).emit("host-transferred", { newHostId: targetUserId });
        logger.info({ roomId, targetUserId }, "Host transferred role");
      } catch (err) {
        logger.error({ err }, "Error transferring host");
      }
    });

    // ─── PARTICIPANT ACTIONS ────────────────────────────────────────────────
    socket.on("raise-hand", ({ roomId, isRaisedHand }: { roomId: string; isRaisedHand: boolean }) => {
      if (!currentUserId) return;
      const room = rooms.get(roomId);
      const participant = room?.get(currentUserId);
      if (participant) {
        participant.isRaisedHand = isRaisedHand;
        socket.to(roomId).emit("hand-state-changed", { userId: currentUserId, isRaisedHand });
      }
    });

    // ─── CHAT MESSAGING (Meeting room chat) ─────────────────────────────────
    socket.on("chat-message", async ({ text }: { text: string }) => {
      if (!currentRoomId || !currentUserId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const participant = room.get(currentUserId);
      if (!participant) return;

      const trimmed = text.trim().slice(0, 2000);
      if (!trimmed) return;

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUserId,
        displayName: participant.displayName,
        text: trimmed,
        timestamp: Date.now(),
      };

      if (!chatHistory.has(currentRoomId)) {
        chatHistory.set(currentRoomId, []);
      }
      const history = chatHistory.get(currentRoomId)!;
      history.push(message);
      if (history.length > MAX_CHAT_HISTORY) history.shift();

      io.to(currentRoomId).emit("chat-message", message);

      // Persist message to database
      try {
        const { MeetingChat } = await import("@workspace/db");
        const meeting = await Meeting.findOne({ roomId: currentRoomId, status: { $ne: "ended" } });
        if (meeting) {
          const chatDoc = new MeetingChat({
            meeting: meeting._id,
            sender: user?.id,
            displayName: participant.displayName,
            message: trimmed,
          });
          await chatDoc.save();
        }
      } catch (err) {
        logger.warn({ err }, "Could not persist chat message to DB");
      }

      logger.info({ roomId: currentRoomId, userId: currentUserId }, "Chat message sent & saved");
    });

    // ─── WEBRTC SIGNALING ───────────────────────────────────────────────────
    socket.on("offer", ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("offer", {
        from: currentUserId,
        offer,
      });
    });

    socket.on("answer", ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("answer", {
        from: currentUserId,
        answer,
      });
    });

    socket.on("ice-candidate", ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("ice-candidate", {
        from: currentUserId,
        candidate,
      });
    });

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
      }
    );

    socket.on("transcription-chunk", async ({ text }: { text: string }) => {
      if (!currentRoomId || !currentUserId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const participant = room.get(currentUserId);
      if (!participant) return;

      socket.to(currentRoomId).emit("transcription-chunk", {
        userId: currentUserId,
        displayName: participant.displayName,
        text,
        timestamp: Date.now(),
      });

      try {
        const meeting = await Meeting.findOne({ roomId: currentRoomId, status: { $ne: "ended" } });
        if (meeting) {
          const tLine = new MeetingTranscript({
            meetingId: meeting._id,
            speaker: participant.displayName,
            text,
            timestamp: Date.now(),
          });
          await tLine.save();
        }
      } catch (err) {
        logger.warn({ err }, "Could not auto-save transcription chunk to DB");
      }
    });

    socket.on("shared-notes-update", ({ notes }: { notes: string }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("shared-notes-update", { notes });
    });

    socket.on("task-changed", () => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("task-changed");
    });

    socket.on("kanban-task-updated", (data: any) => {
      socket.broadcast.emit("kanban-task-updated", data);
    });

    socket.on("analytics-updated", (data: any) => {
      socket.broadcast.emit("analytics-updated", data);
    });

    socket.on("milestone-alert", (data: any) => {
      socket.broadcast.emit("milestone-alert", data);
    });

    socket.on("leave-room", ({ roomId, userId }: { roomId: string; userId: string }) => {
      handleLeave(roomId, userId);
    });

    socket.on("disconnect", () => {
      if (currentRoomId && currentUserId) {
        handleLeave(currentRoomId, currentUserId);
      }

      // Cleanup user socket mapping and presence
      if (user?.id) {
        const userSockets = activeUsers.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            activeUsers.delete(user.id);
            userPresence.set(user.id, "offline");
            io.emit("presence-changed", {
              userId: user.id,
              status: "offline",
              timestamp: Date.now(),
            });
          }
        }
      }

      logger.info({ socketId: socket.id }, "Secure socket disconnected");
    });

    async function handleLeave(roomId: string, userId: string) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.delete(userId);

      // Remove from waiting room if they disconnect while waiting
      const queue = waitingUsers.get(roomId) ?? [];
      if (queue.some((q) => q.userId === userId)) {
        waitingUsers.set(
          roomId,
          queue.filter((q) => q.userId !== userId)
        );
      }

      // Mark Participant as left in DB
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (meeting) {
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: user?.id, status: "admitted" },
            { status: "left", leftAt: new Date() }
          );
        }
      } catch (err) {
        logger.warn({ err }, "Could not mark participant left in DB");
      }

      // Update presence back to online (if not completely offline)
      if (user?.id && activeUsers.has(user.id)) {
        userPresence.set(user.id, "online");
        io.emit("presence-changed", {
          userId: user.id,
          status: "online",
          timestamp: Date.now(),
        });
      }

      if (room.size === 0) {
        rooms.delete(roomId);
        chatHistory.delete(roomId);
        waitingUsers.delete(roomId);
        lockedMeetings.delete(roomId);
      } else {
        // Notify others
        socket.to(roomId).emit("user-disconnected", { userId });
      }

      socket.leave(roomId);
      logger.info({ roomId, userId }, "User left room and cleaned up states");
    }
  });

  return io;
}

export function getRoomParticipantCount(roomId: string): number {
  return rooms.get(roomId)?.size ?? 0;
}
