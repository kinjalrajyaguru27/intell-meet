import { useEffect, useRef, useState, useCallback } from "react";
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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
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
  iceCandidatePoolSize: 10,
};

function createBlackVideoTrack(): MediaStreamTrack {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 640, 480);
  // Keep drawing so the track stays live
  const interval = setInterval(() => {
    ctx.fillRect(0, 0, 640, 480);
  }, 1000);
  const stream = canvas.captureStream(5);
  const track = stream.getVideoTracks()[0];
  const origStop = track.stop.bind(track);
  track.stop = () => {
    clearInterval(interval);
    origStop();
  };
  return track;
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

  // Refs to hold latest state values — prevents stale closures inside WebRTC callbacks
  const isMutedRef = useRef(false);
  const isCameraOffRef = useRef(false);
  const isScreenSharingRef = useRef(false);

  // ICE candidate queue: hold candidates until remote description is set
  const iceCandidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const remoteDescSet = useRef<Record<string, boolean>>({});

  // Keep refs in sync with state
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isCameraOffRef.current = isCameraOff; }, [isCameraOff]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);

  const broadcastMediaState = useCallback(
    (muted: boolean, cameraOff: boolean, screenSharing: boolean) => {
      socketRef.current?.emit("media-state", {
        isMuted: muted,
        isCameraOff: cameraOff,
        isScreenSharing: screenSharing,
      });
    },
    []
  );

  const updateParticipant = useCallback(
    (id: string, updates: Partial<ParticipantState>) => {
      setParticipants((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...updates },
      }));
    },
    []
  );

  const removePeer = useCallback((id: string) => {
    peersRef.current[id]?.close();
    delete peersRef.current[id];
    delete iceCandidateQueues.current[id];
    delete remoteDescSet.current[id];
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

  // Flush queued ICE candidates once remote description is set
  const flushIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    remoteDescSet.current[peerId] = true;
    const queued = iceCandidateQueues.current[peerId] ?? [];
    iceCandidateQueues.current[peerId] = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Silently ignore — candidate may no longer be relevant
      }
    }
  }, []);

  const createPeer = useCallback(
    (targetUserId: string, initiator: boolean): RTCPeerConnection => {
      // Close and remove any pre-existing connection for this peer
      if (peersRef.current[targetUserId]) {
        peersRef.current[targetUserId].close();
        delete peersRef.current[targetUserId];
      }
      remoteDescSet.current[targetUserId] = false;
      iceCandidateQueues.current[targetUserId] = [];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetUserId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            to: targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Accumulate tracks into the same MediaStream per peer
      pc.ontrack = (event) => {
        const incomingTrack = event.track;
        const remoteStream = event.streams[0];

        if (remoteStream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetUserId]: remoteStream,
          }));
        } else {
          // Fallback: build a MediaStream ourselves from individual tracks
          setRemoteStreams((prev) => {
            const existing = prev[targetUserId];
            if (existing) {
              // Replace an existing track of the same kind
              existing.getTracks()
                .filter((t) => t.kind === incomingTrack.kind)
                .forEach((t) => existing.removeTrack(t));
              existing.addTrack(incomingTrack);
              return { ...prev, [targetUserId]: existing };
            }
            return { ...prev, [targetUserId]: new MediaStream([incomingTrack]) };
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      // Add all local tracks (video + audio)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      if (initiator) {
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socketRef.current?.emit("offer", {
              to: targetUserId,
              offer: pc.localDescription,
            });
          })
          .catch((e) => console.error("createOffer error", e));
      }

      return pc;
    },
    []
  );

  // Stop screen share cleanly — uses refs to avoid stale closures
  const stopScreenShareCleanup = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    if (localStreamRef.current) {
      const cameraTrack = isCameraOffRef.current
        ? blackTrackRef.current!
        : localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      });
    }

    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    broadcastMediaState(isMutedRef.current, isCameraOffRef.current, false);
  }, [broadcastMediaState]);

  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
        blackTrackRef.current = createBlackVideoTrack();

        const socket = io({ path: "/api/socket.io", transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-room", { roomId, userId, displayName });
        });

        socket.on("existing-users", (users: { userId: string; displayName: string }[]) => {
          users.forEach((u) => {
            if (u.userId !== userId) {
              setParticipants((prev) => ({
                ...prev,
                [u.userId]: {
                  id: u.userId,
                  displayName: u.displayName,
                  isMuted: false,
                  isCameraOff: false,
                  isScreenSharing: false,
                },
              }));
              createPeer(u.userId, true);
            }
          });
        });

        socket.on("user-connected", (user: { userId: string; displayName: string }) => {
          // The NEW user will initiate offers to existing users — just register them
          setParticipants((prev) => ({
            ...prev,
            [user.userId]: {
              id: user.userId,
              displayName: user.displayName,
              isMuted: false,
              isCameraOff: false,
              isScreenSharing: false,
            },
          }));
        });

        socket.on("user-disconnected", ({ userId: disconnectedId }: { userId: string }) => {
          removePeer(disconnectedId);
        });

        socket.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
          const pc = createPeer(from, false);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushIceCandidates(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { to: from, answer: pc.localDescription });
        });

        socket.on("answer", async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
          const pc = peersRef.current[from];
          if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushIceCandidates(from, pc);
          }
        });

        socket.on("ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
          const pc = peersRef.current[from];
          if (!pc) return;

          if (remoteDescSet.current[from]) {
            // Remote description already set — add immediately
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              // ignore stale candidates
            }
          } else {
            // Queue until remote description is ready
            if (!iceCandidateQueues.current[from]) {
              iceCandidateQueues.current[from] = [];
            }
            iceCandidateQueues.current[from].push(candidate);
          }
        });

        socket.on(
          "media-state-changed",
          ({
            userId: changedId,
            isMuted: m,
            isCameraOff: c,
            isScreenSharing: s,
          }: {
            userId: string;
            isMuted: boolean;
            isCameraOff: boolean;
            isScreenSharing: boolean;
          }) => {
            updateParticipant(changedId, { isMuted: m, isCameraOff: c, isScreenSharing: s });
          }
        );

        socket.on("chat-history", (history: ChatMessage[]) => {
          setMessages(history);
        });

        socket.on("chat-message", (msg: ChatMessage) => {
          setMessages((prev) => [...prev, msg]);
        });

      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Media device error:", err);
        const msg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera/microphone permission denied. Please allow access and refresh."
            : err instanceof Error && err.name === "NotFoundError"
              ? "No camera or microphone found."
              : "Could not access camera or microphone.";
        setError(msg);
      }
    }

    initMedia();

    return () => {
      mounted = false;
      socketRef.current?.emit("leave-room", { roomId, userId });
      socketRef.current?.disconnect();
      socketRef.current = null;
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      blackTrackRef.current?.stop();
      iceCandidateQueues.current = {};
      remoteDescSet.current = {};
    };
  }, [roomId, userId, displayName, createPeer, removePeer, updateParticipant, flushIceCandidates]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    const newMuted = !isMutedRef.current;
    audioTrack.enabled = !newMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    broadcastMediaState(newMuted, isCameraOffRef.current, isScreenSharingRef.current);
  }, [broadcastMediaState]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    const newCameraOff = !isCameraOffRef.current;
    videoTrack.enabled = !newCameraOff;

    // Replace track sent to all peers (black frame vs real camera)
    const trackToSend = newCameraOff ? blackTrackRef.current! : videoTrack;
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(trackToSend);
    });

    setIsCameraOff(newCameraOff);
    isCameraOffRef.current = newCameraOff;
    broadcastMediaState(isMutedRef.current, newCameraOff, isScreenSharingRef.current);
  }, [broadcastMediaState]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      stopScreenShareCleanup();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false, // Avoid audio feedback; mic is already in the peer connection
      });
      screenStreamRef.current = stream;
      const screenTrack = stream.getVideoTracks()[0];

      // When user clicks "Stop sharing" in the browser's own dialog
      screenTrack.addEventListener("ended", () => {
        stopScreenShareCleanup();
      });

      // Replace video track on all active peer connections
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      broadcastMediaState(isMutedRef.current, isCameraOffRef.current, true);
    } catch (e) {
      // User cancelled or permission denied — do nothing
      console.error("Screen share error:", e);
    }
  }, [stopScreenShareCleanup, broadcastMediaState]);

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
