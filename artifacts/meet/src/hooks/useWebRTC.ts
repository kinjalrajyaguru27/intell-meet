import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type ParticipantState = {
  id: string;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
};

export type ChatMessage = {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.relay.metered.ca:80" },
    {
      username: "openrelayproject",
      credential: "openrelayproject",
      urls: "turn:openrelay.metered.ca:80",
    },
    {
      username: "openrelayproject",
      credential: "openrelayproject",
      urls: "turn:openrelay.metered.ca:443",
    },
    {
      username: "openrelayproject",
      credential: "openrelayproject",
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
    },
  ],
};

function createBlackVideoTrack(): MediaStreamTrack {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 640, 480);
  const stream = canvas.captureStream(1);
  return stream.getVideoTracks()[0];
}

export function useWebRTC(roomId: string, userId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [participants, setParticipants] = useState<Record<string, ParticipantState>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const blackTrackRef = useRef<MediaStreamTrack | null>(null);

  const broadcastMediaState = useCallback(
    (muted: boolean, cameraOff: boolean, screenSharing: boolean) => {
      if (socketRef.current) {
        socketRef.current.emit("media-state", {
          isMuted: muted,
          isCameraOff: cameraOff,
          isScreenSharing: screenSharing,
        });
      }
    },
    []
  );

  const updateParticipant = useCallback((id: string, updates: Partial<ParticipantState>) => {
    setParticipants((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, []);

  const removePeer = useCallback((id: string) => {
    if (peersRef.current[id]) {
      peersRef.current[id].close();
      delete peersRef.current[id];
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setParticipants((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const createPeer = useCallback(
    (targetUserId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetUserId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            to: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }));
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socketRef.current) {
              socketRef.current.emit("offer", {
                to: targetUserId,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error("Error creating offer", err));
      }

      return pc;
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
        });
        if (!mounted) return;
        setLocalStream(stream);
        localStreamRef.current = stream;
        blackTrackRef.current = createBlackVideoTrack();

        const socket = io({ path: "/api/socket.io" });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-room", { roomId, userId, displayName });
        });

        socket.on("existing-users", (users: { userId: string; displayName: string }[]) => {
          users.forEach((u) => {
            if (u.userId !== userId) {
              setParticipants((prev) => ({
                ...prev,
                [u.userId]: { id: u.userId, displayName: u.displayName, isMuted: false, isCameraOff: false, isScreenSharing: false },
              }));
              createPeer(u.userId, true);
            }
          });
        });

        socket.on("user-connected", (user: { userId: string; displayName: string }) => {
          setParticipants((prev) => ({
            ...prev,
            [user.userId]: { id: user.userId, displayName: user.displayName, isMuted: false, isCameraOff: false, isScreenSharing: false },
          }));
        });

        socket.on("user-disconnected", ({ userId: disconnectedUserId }) => {
          removePeer(disconnectedUserId);
        });

        socket.on("offer", async ({ from, offer }) => {
          const pc = createPeer(from, false);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { to: from, answer });
        });

        socket.on("answer", async ({ from, answer }) => {
          const pc = peersRef.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
          const pc = peersRef.current[from];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.error(e));
          }
        });

        socket.on("media-state-changed", ({ userId: changedUserId, isMuted: m, isCameraOff: c, isScreenSharing: s }) => {
          updateParticipant(changedUserId, { isMuted: m, isCameraOff: c, isScreenSharing: s });
        });

        socket.on("chat-history", (history: ChatMessage[]) => {
          setMessages(history);
        });

        socket.on("chat-message", (msg: ChatMessage) => {
          setMessages((prev) => [...prev, msg]);
        });

      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Could not access camera or microphone.");
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId, userId });
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (blackTrackRef.current) {
        blackTrackRef.current.stop();
      }
    };
  }, [roomId, userId, displayName, createPeer, removePeer, updateParticipant]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newMuted = !isMuted;
        audioTrack.enabled = !newMuted;
        setIsMuted(newMuted);
        broadcastMediaState(newMuted, isCameraOff, isScreenSharing);
      }
    }
  }, [isMuted, isCameraOff, isScreenSharing, broadcastMediaState]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newCameraOff = !isCameraOff;
        videoTrack.enabled = !newCameraOff;

        // Replace track for peers
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(newCameraOff ? blackTrackRef.current! : videoTrack);
          }
        });

        setIsCameraOff(newCameraOff);
        broadcastMediaState(isMuted, newCameraOff, isScreenSharing);
      }
    }
  }, [isCameraOff, isMuted, isScreenSharing, broadcastMediaState]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        const videoTrack = isCameraOff ? blackTrackRef.current! : localStreamRef.current.getVideoTracks()[0];
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      setIsScreenSharing(false);
      broadcastMediaState(isMuted, isCameraOff, false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare(); // Handle browser "Stop sharing" button
        };

        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        setIsScreenSharing(true);
        broadcastMediaState(isMuted, isCameraOff, true);
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    }
  }, [isScreenSharing, isCameraOff, isMuted, broadcastMediaState]);

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit("chat-message", { text: text.trim() });
    }
  }, []);

  return {
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    messages,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
  };
}
