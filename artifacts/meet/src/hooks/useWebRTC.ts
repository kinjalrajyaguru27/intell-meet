import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type ParticipantState = {
  id: string;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRaisedHand: boolean;
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

function createSilentAudioTrack(): MediaStreamTrack {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dst = ctx.createMediaStreamDestination();
  const track = dst.stream.getAudioTracks()[0];
  track.enabled = false;
  (track as any).isSilentDummy = true;
  const origStop = track.stop.bind(track);
  track.stop = () => {
    try {
      ctx.close();
    } catch (e) {}
    origStop();
  };
  return track;
}

export function useWebRTC(
  roomId: string,
  userId: string,
  displayName: string,
  hasJoined = false,
  token: string | null = null
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [participants, setParticipants] = useState<Record<string, ParticipantState>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});
  const [isSimulating, setIsSimulating] = useState(false);

  // Waiting Room and state
  const [waitingStatus, setWaitingStatus] = useState<"none" | "waiting" | "admitted" | "rejected" | "locked">("none");
  const [waitingUsersList, setWaitingUsersList] = useState<Array<{ userId: string; displayName: string; socketId: string }>>([]);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [roomHostId, setRoomHostId] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const sourcesRef = useRef<Record<string, MediaStreamAudioSourceNode>>({});

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const blackTrackRef = useRef<MediaStreamTrack | null>(null);
  const silentAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});

  const isMutedRef = useRef(false);
  const isCameraOffRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const isHandRaisedRef = useRef(false);

  const iceCandidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const remoteDescSet = useRef<Record<string, boolean>>({});

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isCameraOffRef.current = isCameraOff; }, [isCameraOff]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { isHandRaisedRef.current = isHandRaised; }, [isHandRaised]);

  // Handle mock simulation chat
  useEffect(() => {
    const handleMockChat = (e: Event) => {
      const { userId: mockId, displayName: mockName, text } = (e as CustomEvent).detail;
      const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: mockId,
        displayName: mockName,
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
    };
    window.addEventListener("mock-chat", handleMockChat);
    return () => window.removeEventListener("mock-chat", handleMockChat);
  }, []);

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
    delete remoteStreamsRef.current[id];
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

  const flushIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    remoteDescSet.current[peerId] = true;
    const queued = iceCandidateQueues.current[peerId] ?? [];
    iceCandidateQueues.current[peerId] = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Ignore stale candidates
      }
    }
  }, []);

  const createPeer = useCallback(
    (targetUserId: string, initiator: boolean): RTCPeerConnection => {
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

      pc.ontrack = (event) => {
        let stream = remoteStreamsRef.current[targetUserId];
        if (!stream) {
          stream = new MediaStream();
          remoteStreamsRef.current[targetUserId] = stream;
        }

        const track = event.track;
        if (!stream.getTracks().some((t) => t.id === track.id)) {
          stream.addTrack(track);
        }

        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: stream!,
        }));
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current!);
          } catch (e) {
            console.warn("Failed to add track to peer:", e);
          }
        });
      }

      // Ensure both video and audio transceivers are present
      const hasVideo = pc.getSenders().some((s) => s.track?.kind === "video");
      if (!hasVideo) {
        try {
          pc.addTransceiver("video", { direction: "sendrecv" });
        } catch (e) {
          console.warn("Failed to add video transceiver:", e);
        }
      }

      const hasAudio = pc.getSenders().some((s) => s.track?.kind === "audio");
      if (!hasAudio) {
        try {
          pc.addTransceiver("audio", { direction: "sendrecv" });
        } catch (e) {
          console.warn("Failed to add audio transceiver:", e);
        }
      }

      if (initiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
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

  const stopScreenShareCleanup = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    if (localStreamRef.current) {
      const cameraTrack = isCameraOffRef.current
        ? blackTrackRef.current!
        : (cameraTrackRef.current || blackTrackRef.current!);
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                       pc.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      });
      const tracks = [];
      if (cameraTrack) tracks.push(cameraTrack);
      const activeAudio = isMutedRef.current ? silentAudioTrackRef.current : audioTrackRef.current;
      if (activeAudio) tracks.push(activeAudio);
      setLocalStream(new MediaStream(tracks));
    }

    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    broadcastMediaState(isMutedRef.current, isCameraOffRef.current, false);
  }, [broadcastMediaState]);

  // Effect 1: Capture local media preview (Run unconditionally on mount)
  useEffect(() => {
    let mounted = true;

    const mediaAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices;

    const handleDeviceChange = async () => {
      try {
        if (mediaAvailable) {
          const currentDevices = await navigator.mediaDevices.enumerateDevices();
          if (mounted) {
            setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
            setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));
          }
        }
      } catch (e) {
        console.error("enumerateDevices on devicechange error", e);
      }
    };

    async function initMedia() {
      // Always pre-create dummy silent/black tracks for WebRTC fallback/renegotiation bypass
      blackTrackRef.current = createBlackVideoTrack();
      silentAudioTrackRef.current = createSilentAudioTrack();

      let realVideoTrack: MediaStreamTrack | null = null;
      let realAudioTrack: MediaStreamTrack | null = null;
      let hasVideoDevice = false;
      let hasAudioDevice = false;

      if (mediaAvailable) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasVideoDevice = devices.some((d) => d.kind === "videoinput");
          hasAudioDevice = devices.some((d) => d.kind === "audioinput");
        } catch (e) {
          hasVideoDevice = true;
          hasAudioDevice = true;
        }
      }

      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: "user",
      };

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 },
      };

      // Request video and audio in a single combined call for maximum reliability and a single browser prompt
      if (mediaAvailable) {
        try {
          const combinedStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          });
          realVideoTrack = combinedStream.getVideoTracks()[0];
          realAudioTrack = combinedStream.getAudioTracks()[0];
          cameraTrackRef.current = realVideoTrack || null;
          audioTrackRef.current = realAudioTrack || null;
        } catch (combinedErr) {
          console.warn("Combined getUserMedia failed, trying fallback constraints:", combinedErr);
          try {
            const combinedStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            realVideoTrack = combinedStream.getVideoTracks()[0];
            realAudioTrack = combinedStream.getAudioTracks()[0];
            cameraTrackRef.current = realVideoTrack || null;
            audioTrackRef.current = realAudioTrack || null;
          } catch (fallbackErr) {
            console.warn("Combined fallback failed, trying separate calls:", fallbackErr);
          }
        }

        // If combined call didn't get both, try capturing separately for whatever is missing
        if (!realVideoTrack) {
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
            });
            realVideoTrack = videoStream.getVideoTracks()[0];
            cameraTrackRef.current = realVideoTrack || null;
          } catch (videoErr) {
            console.warn("Could not capture camera stream with constraints, trying video: true:", videoErr);
            try {
              const videoStream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              realVideoTrack = videoStream.getVideoTracks()[0];
              cameraTrackRef.current = realVideoTrack || null;
            } catch (fallbackErr) {
              console.error("Failed completely to capture camera stream:", fallbackErr);
            }
          }
        }

        if (!realAudioTrack) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: audioConstraints,
            });
            realAudioTrack = audioStream.getAudioTracks()[0];
            audioTrackRef.current = realAudioTrack || null;
          } catch (audioErr) {
            console.warn("Could not capture microphone stream with constraints, trying audio: true:", audioErr);
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
              realAudioTrack = audioStream.getAudioTracks()[0];
              audioTrackRef.current = realAudioTrack || null;
            } catch (fallbackErr) {
              console.warn("Combined and default audio:true captures failed, trying individual audio inputs:", fallbackErr);
              try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter((d) => d.kind === "audioinput");
                for (const mic of mics) {
                  try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                      audio: { deviceId: { exact: mic.deviceId } },
                    });
                    realAudioTrack = audioStream.getAudioTracks()[0];
                    if (realAudioTrack) {
                      audioTrackRef.current = realAudioTrack;
                      console.log("Successfully captured microphone device explicitly:", mic.label || mic.deviceId);
                      break;
                    }
                  } catch (micErr) {
                    console.warn(`Failed to capture mic ${mic.label || mic.deviceId} explicitly:`, micErr);
                  }
                }
              } catch (enumErr) {
                console.error("Failed completely to enumerate devices for mic fallback:", enumErr);
              }
            }
          }
        }
      }

      if (!mounted) {
        realVideoTrack?.stop();
        realAudioTrack?.stop();
        blackTrackRef.current?.stop();
        silentAudioTrackRef.current?.stop();
        return;
      }

      // Build the unified local stream containing exactly 1 video track and 1 audio track
      const localStreamObj = new MediaStream();

      let currentDevices: MediaDeviceInfo[] = [];
      if (mediaAvailable) {
        currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
      }
      setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
      setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));

      // 1. Setup Video
      if (realVideoTrack) {
        localStreamObj.addTrack(realVideoTrack);
        const cams = currentDevices.filter((d) => d.kind === "videoinput");
        const matched = cams.find((d) => d.label === realVideoTrack.label);
        const defaultCam = cams.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
        setSelectedCameraId(
          matched?.deviceId ||
          realVideoTrack.getSettings().deviceId ||
          defaultCam?.deviceId ||
          cams[0]?.deviceId ||
          ""
        );
        setIsCameraOff(false);
        isCameraOffRef.current = false;
      } else {
        if (blackTrackRef.current) {
          localStreamObj.addTrack(blackTrackRef.current);
        }
        const cams = currentDevices.filter((d) => d.kind === "videoinput");
        const defaultCam = cams.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
        setSelectedCameraId(defaultCam?.deviceId || cams[0]?.deviceId || "");
        setIsCameraOff(true);
        isCameraOffRef.current = true;
      }

      // 2. Setup Audio
      if (realAudioTrack) {
        localStreamObj.addTrack(realAudioTrack);
        const mics = currentDevices.filter((d) => d.kind === "audioinput");
        const matched = mics.find((d) => d.label === realAudioTrack.label);
        const defaultMic = mics.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
        setSelectedMicId(
          matched?.deviceId ||
          realAudioTrack.getSettings().deviceId ||
          defaultMic?.deviceId ||
          mics[0]?.deviceId ||
          ""
        );
        setIsMuted(false);
        isMutedRef.current = false;
      } else {
        if (silentAudioTrackRef.current) {
          localStreamObj.addTrack(silentAudioTrackRef.current);
        }
        const mics = currentDevices.filter((d) => d.kind === "audioinput");
        const defaultMic = mics.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
        setSelectedMicId(defaultMic?.deviceId || mics[0]?.deviceId || "");
        setIsMuted(true);
        isMutedRef.current = true;
      }

      setLocalStream(localStreamObj);
      localStreamRef.current = localStreamObj;

      // Refresh devices list after 500ms to guarantee browser permission cache has synced and labels are populated
      setTimeout(async () => {
        if (mounted && mediaAvailable) {
          try {
            const freshDevices = await navigator.mediaDevices.enumerateDevices();
            const freshCams = freshDevices.filter((d) => d.kind === "videoinput");
            const freshMics = freshDevices.filter((d) => d.kind === "audioinput");
            setCameras(freshCams);
            setMicrophones(freshMics);
            
            if (realAudioTrack) {
              const matched = freshMics.find((d) => d.label === realAudioTrack.label);
              const defaultMic = freshMics.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
              setSelectedMicId(
                matched?.deviceId ||
                realAudioTrack.getSettings().deviceId ||
                defaultMic?.deviceId ||
                freshMics[0]?.deviceId ||
                ""
              );
            } else {
              const defaultMic = freshMics.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
              setSelectedMicId(defaultMic?.deviceId || freshMics[0]?.deviceId || "");
            }

            if (realVideoTrack) {
              const matched = freshCams.find((d) => d.label === realVideoTrack.label);
              const defaultCam = freshCams.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
              setSelectedCameraId(
                matched?.deviceId ||
                realVideoTrack.getSettings().deviceId ||
                defaultCam?.deviceId ||
                freshCams[0]?.deviceId ||
                ""
              );
            } else {
              const defaultCam = freshCams.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
              setSelectedCameraId(defaultCam?.deviceId || freshCams[0]?.deviceId || "");
            }
          } catch (e) {
            console.warn("Delayed device enumeration refresh failed:", e);
          }
        }
      }, 500);

      if (mediaAvailable) {
        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (mediaAvailable) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      blackTrackRef.current?.stop();
      silentAudioTrackRef.current?.stop();
    };
  }, []);

  // Effect 2: Setup socket connection & room joining (Only runs when hasJoined is true)
  useEffect(() => {
    if (!hasJoined) return;

    let mounted = true;
    setConnectionStatus("connecting");

    const socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      socket.emit("join-room", {
        roomId,
        userId,
        displayName,
        isMuted: isMutedRef.current,
        isCameraOff: isCameraOffRef.current,
      });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(err.message || "Socket connection failed.");
      setConnectionStatus("disconnected");
    });

    // Handle Waiting Room status
    socket.on("waiting-room-status", ({ status }: { status: "none" | "waiting" | "admitted" | "rejected" | "locked" }) => {
      setWaitingStatus(status);
      if (status === "rejected") {
        setError("You were rejected from entering this meeting room.");
        socket.disconnect();
      } else if (status === "locked") {
        setError("This meeting is locked and cannot be joined.");
        socket.disconnect();
      }
    });

    socket.on("waiting-users-list", (queue: Array<{ userId: string; displayName: string; socketId: string }>) => {
      setWaitingUsersList(queue);
    });

    socket.on("room-lock-changed", ({ isLocked }: { isLocked: boolean }) => {
      setIsRoomLocked(isLocked);
    });

    socket.on("host-transferred", ({ newHostId }: { newHostId: string }) => {
      setRoomHostId(newHostId);
    });

    // Host administrative actions pushed to the client
    socket.on("force-mute", () => {
      const stream = localStreamRef.current;
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = false;
      }
      setIsMuted(true);
      isMutedRef.current = true;
      broadcastMediaState(true, isCameraOffRef.current, isScreenSharingRef.current);
    });

    socket.on("force-disable-video", () => {
      const stream = localStreamRef.current;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = false;
      }

      // Send black frame to peers
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && blackTrackRef.current) sender.replaceTrack(blackTrackRef.current);
      });

      setIsCameraOff(true);
      isCameraOffRef.current = true;
      broadcastMediaState(isMutedRef.current, true, isScreenSharingRef.current);
    });

    socket.on("force-leave", () => {
      // Force exit page
      window.location.href = "/dashboard";
    });

    socket.on("hand-state-changed", ({ userId: uId, isRaisedHand: handState }: { userId: string; isRaisedHand: boolean }) => {
      updateParticipant(uId, { isRaisedHand: handState });
    });

    socket.on(
      "existing-users",
      (
        users: {
          userId: string;
          displayName: string;
          isMuted: boolean;
          isCameraOff: boolean;
          isScreenSharing: boolean;
          isRaisedHand: boolean;
        }[]
      ) => {
        if (!mounted) return;
        users.forEach((u) => {
          if (u.userId !== userId) {
            setParticipants((prev) => ({
              ...prev,
              [u.userId]: {
                id: u.userId,
                displayName: u.displayName,
                isMuted: u.isMuted,
                isCameraOff: u.isCameraOff,
                isScreenSharing: u.isScreenSharing,
                isRaisedHand: u.isRaisedHand,
              },
            }));
            createPeer(u.userId, true);
          }
        });
      }
    );

    socket.on(
      "user-connected",
      (user: {
        userId: string;
        displayName: string;
        isMuted: boolean;
        isCameraOff: boolean;
        isScreenSharing: boolean;
        isRaisedHand: boolean;
      }) => {
        if (!mounted) return;
        setParticipants((prev) => ({
          ...prev,
          [user.userId]: {
            id: user.userId,
            displayName: user.displayName,
            isMuted: user.isMuted,
            isCameraOff: user.isCameraOff,
            isScreenSharing: user.isScreenSharing,
            isRaisedHand: user.isRaisedHand,
          },
        }));
      }
    );

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
      if (!iceCandidateQueues.current[from]) {
        iceCandidateQueues.current[from] = [];
      }

      const pc = peersRef.current[from];
      if (pc && remoteDescSet.current[from]) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // Ignore stale candidates
        }
      } else {
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

    return () => {
      mounted = false;
      socket.emit("leave-room", { roomId, userId });
      socket.disconnect();
      socketRef.current = null;
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      iceCandidateQueues.current = {};
      remoteDescSet.current = {};
      setRemoteStreams({});
      setParticipants({});
    };
  }, [hasJoined, roomId, userId, displayName, token, createPeer, removePeer, updateParticipant, flushIceCandidates]);

  // Audio monitoring effects
  const startMonitoringStream = useCallback((streamId: string, stream: MediaStream) => {
    if (stream.getAudioTracks().length === 0) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      if (sourcesRef.current[streamId]) {
        try { sourcesRef.current[streamId].disconnect(); } catch (e) {}
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      analysersRef.current[streamId] = analyser;
      sourcesRef.current[streamId] = source;
    } catch (e) {
      console.warn("Could not setup audio monitoring for stream", streamId, e);
    }
  }, []);

  const stopMonitoringStream = useCallback((streamId: string) => {
    if (sourcesRef.current[streamId]) {
      try { sourcesRef.current[streamId].disconnect(); } catch (e) {}
      delete sourcesRef.current[streamId];
    }
    if (analysersRef.current[streamId]) {
      delete analysersRef.current[streamId];
    }
  }, []);

  useEffect(() => {
    if (localStream) {
      if (!isMuted) {
        startMonitoringStream("__local__", localStream);
      } else {
        stopMonitoringStream("__local__");
      }
    } else {
      stopMonitoringStream("__local__");
    }
  }, [localStream, isMuted, startMonitoringStream, stopMonitoringStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([uid, stream]) => {
      if (stream) {
        startMonitoringStream(uid, stream);
      }
    });

    Object.keys(sourcesRef.current).forEach((uid) => {
      if (uid !== "__local__" && !remoteStreams[uid]) {
        stopMonitoringStream(uid);
      }
    });
  }, [remoteStreams, startMonitoringStream, stopMonitoringStream]);

  // Speaking state detection loop
  useEffect(() => {
    const timer = setInterval(() => {
      const nextSpeaking: Record<string, boolean> = {};
      let changed = false;

      Object.entries(analysersRef.current).forEach(([streamId, analyser]) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const isSpeaking = avg > 25;

        if (speakingUsers[streamId] !== isSpeaking) {
          changed = true;
        }
        if (isSpeaking) {
          nextSpeaking[streamId] = true;
        }
      });

      if (changed || Object.keys(nextSpeaking).length !== Object.keys(speakingUsers).length) {
        setSpeakingUsers(nextSpeaking);
      }
    }, 150);

    return () => clearInterval(timer);
  }, [speakingUsers]);

  // Simulation effect
  useEffect(() => {
    if (!isSimulating) {
      setParticipants((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith("mock_")) {
            delete next[key];
          }
        });
        return next;
      });
      return;
    }

    const mockUsers: Record<string, ParticipantState> = {};
    const names = [
      "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
      "Fiona Gallagher", "George Lucas", "Hannah Abbott", "Ian Malcolm", "Julia Roberts",
      "Kevin Bacon", "Laura Croft", "Michael Jordan", "Nina Simone", "Oscar Wilde",
      "Penelope Cruz", "Quentin Tarantino", "Rachel Green", "Steve Rogers", "Tony Stark",
      "Uma Thurman", "Victor Frankenstein", "Wanda Maximoff", "Xavier Charles", "Yolanda Adams",
      "Zachary Levi", "Arthur Pendragon", "Bruce Wayne", "Clark Kent", "David Beckham",
      "Emma Watson", "Frank Sinatra", "Grace Kelly", "Harry Potter", "Iris West",
      "Jack Sparrow", "Katherine Pierce", "Luke Skywalker", "Marilyn Monroe", "Neo Anderson",
      "Olivia Pope", "Peter Parker", "Queen Elizabeth", "Ronald Weasley", "Sherlock Holmes",
      "Tris Prior", "Ursula K.", "Vito Corleone", "Walter White", "Ygritte Wildling"
    ];

    names.forEach((name, idx) => {
      const id = `mock_user_${idx + 1}`;
      mockUsers[id] = {
        id,
        displayName: name,
        isMuted: Math.random() > 0.2,
        isCameraOff: Math.random() > 0.1,
        isScreenSharing: false,
        isRaisedHand: false,
      };
    });

    setParticipants((prev) => ({
      ...prev,
      ...mockUsers,
    }));

    const speechPhrases = [
      "We should verify the database connection first.",
      "I am working on polishing the CSS styles and animations.",
      "Let's make sure the client builds without any warnings.",
      "Are we ready for the Q3 release schedule next week?",
      "I think the active speaker detection solves our grid scaling issue.",
      "Does anyone have questions about the WebRTC connection state?",
      "The recording feature has been successfully verified on Chrome.",
      "Let's review the user roles for team workspace access.",
      "I'll prepare the release notes and walkthrough documents.",
      "Can we optimize the latency for the video layout?"
    ];

    const chatPhrases = [
      "Sounds great!",
      "I agree with that approach.",
      "Can someone post the link to the spec document?",
      "Awesome work on the mock dashboard!",
      "I will review the pull request after the call.",
      "Is the recording saved locally or uploaded?",
      "Yes, let's schedule a follow-up demo.",
      "Perfect, let's do that.",
      "Looks good to me!",
      "Interesting point."
    ];

    const speakInterval = setInterval(() => {
      const mockIds = Object.keys(mockUsers);
      const speakerId = mockIds[Math.floor(Math.random() * mockIds.length)];
      const speaker = mockUsers[speakerId];

      if (!speaker.isMuted) {
        setSpeakingUsers((prev) => ({
          ...prev,
          [speakerId]: true,
        }));

        const text = speechPhrases[Math.floor(Math.random() * speechPhrases.length)];
        window.dispatchEvent(
          new CustomEvent("mock-transcription", {
            detail: { speaker: speaker.displayName, text },
          })
        );

        setTimeout(() => {
          setSpeakingUsers((prev) => {
            const next = { ...prev };
            delete next[speakerId];
            return next;
          });
        }, 2500);
      }
    }, 4000);

    const chatInterval = setInterval(() => {
      const mockIds = Object.keys(mockUsers);
      const chatterId = mockIds[Math.floor(Math.random() * mockIds.length)];
      const chatter = mockUsers[chatterId];
      const text = chatPhrases[Math.floor(Math.random() * chatPhrases.length)];

      window.dispatchEvent(
        new CustomEvent("mock-chat", {
          detail: {
            userId: chatterId,
            displayName: chatter.displayName,
            text,
          },
        })
      );
    }, 9000);

    return () => {
      clearInterval(speakInterval);
      clearInterval(chatInterval);
    };
  }, [isSimulating]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((s) => !s);
  }, []);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    let audioTrack = stream.getAudioTracks()[0];
    const newMuted = !isMutedRef.current;

    if (newMuted) {
      // Muting: stop active real microphone track and replace it with dummy silent track
      if (audioTrack && audioTrack !== silentAudioTrackRef.current) {
        audioTrack.stop();
        stream.removeTrack(audioTrack);
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
      }
      if (silentAudioTrackRef.current) {
        if (!stream.getAudioTracks().includes(silentAudioTrackRef.current)) {
          stream.addTrack(silentAudioTrackRef.current);
        }
        audioTrack = silentAudioTrackRef.current;
      }

      // Update peers
      if (silentAudioTrackRef.current) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio") ||
                         pc.getTransceivers().find((t) => t.receiver.track.kind === "audio")?.sender;
          if (sender) sender.replaceTrack(silentAudioTrackRef.current);
        });
      }

      setIsMuted(true);
      isMutedRef.current = true;
      setLocalStream(new MediaStream(stream.getTracks()));
      broadcastMediaState(true, isCameraOffRef.current, isScreenSharingRef.current);
    } else {
      // Unmuting: if current track is dummy or missing, request real track
      const isDummy = !audioTrack || audioTrack === silentAudioTrackRef.current || (audioTrack as any).isSilentDummy;
      if (isDummy) {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          setError("Microphone access is not supported on this device/connection.");
          return;
        }
        try {
          let tempStream: MediaStream | null = null;
          try {
            const constraints: MediaTrackConstraints = {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: { ideal: 48000 },
              channelCount: { ideal: 1 },
            };
            if (selectedMicId) {
              constraints.deviceId = { exact: selectedMicId };
            }
            tempStream = await navigator.mediaDevices.getUserMedia({
              audio: constraints,
            });
          } catch (err) {
            console.warn("Failed to capture audio with constraints, trying fallback options");
            try {
              if (selectedMicId) {
                tempStream = await navigator.mediaDevices.getUserMedia({
                  audio: { deviceId: { exact: selectedMicId } },
                });
              } else {
                tempStream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                });
              }
            } catch (fallbackErr) {
              console.warn("Default and selectedMicId captures failed, looping through all audio inputs");
              const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
              const mics = devices.filter((d) => d.kind === "audioinput");
              let success = false;
              for (const mic of mics) {
                try {
                  tempStream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: mic.deviceId } },
                  });
                  success = true;
                  break;
                } catch (micErr) {
                  console.warn(`Failed to capture mic ${mic.label || mic.deviceId} explicitly:`, micErr);
                }
              }
              if (!success) {
                throw fallbackErr;
              }
            }
          }
          const realTrack = tempStream?.getAudioTracks()[0];
          if (realTrack) {
            if (audioTrack) {
              stream.removeTrack(audioTrack);
            }
            stream.addTrack(realTrack);
            audioTrack = realTrack;
            audioTrackRef.current = realTrack;

            // Update peers
            Object.values(peersRef.current).forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "audio") ||
                             pc.getTransceivers().find((t) => t.receiver.track.kind === "audio")?.sender;
              if (sender) sender.replaceTrack(realTrack);
            });

            // Update microphones and cameras list
            const currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
            const freshMics = currentDevices.filter((d) => d.kind === "audioinput");
            setMicrophones(freshMics);
            setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
            const matched = freshMics.find((d) => d.label === realTrack.label);
            const defaultMic = freshMics.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
            setSelectedMicId(matched?.deviceId || realTrack.getSettings().deviceId || defaultMic?.deviceId || freshMics[0]?.deviceId || "");
          }
        } catch (err: any) {
          console.warn("Could not capture real microphone track on toggle:", err);
          let msg = "Could not access your microphone.";
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            msg = "Microphone permission denied. Please allow microphone access in browser settings.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            msg = "Microphone is in use by another application. Close other apps and try again.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            const freshDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
            const mics = freshDevices.filter((d) => d.kind === "audioinput");
            if (mics.length > 0) {
              msg = "Could not access the selected microphone. Please select another microphone from the list.";
            } else {
              msg = "No microphone device found on this system.";
            }
          } else if (err.message) {
            msg = `Microphone error: ${err.message}`;
          }
          setError(msg);
          return;
        }
      }

      setIsMuted(false);
      isMutedRef.current = false;
      setLocalStream(new MediaStream(stream.getTracks()));
      broadcastMediaState(false, isCameraOffRef.current, isScreenSharingRef.current);
    }
  }, [broadcastMediaState]);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    let videoTrack = stream.getVideoTracks()[0];
    const newCameraOff = !isCameraOffRef.current;

    if (newCameraOff) {
      // Turning OFF: stop active real camera track and replace it with dummy black track
      if (videoTrack && videoTrack !== blackTrackRef.current) {
        videoTrack.stop();
        stream.removeTrack(videoTrack);
      }
      if (cameraTrackRef.current) {
        cameraTrackRef.current.stop();
      }
      if (blackTrackRef.current) {
        if (!stream.getVideoTracks().includes(blackTrackRef.current)) {
          stream.addTrack(blackTrackRef.current);
        }
        videoTrack = blackTrackRef.current;
      }

      // Update peers
      if (blackTrackRef.current) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                         pc.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
          if (sender) sender.replaceTrack(blackTrackRef.current);
        });
      }

      setIsCameraOff(true);
      isCameraOffRef.current = true;
      setLocalStream(new MediaStream(stream.getTracks()));
      broadcastMediaState(isMutedRef.current, true, isScreenSharingRef.current);
    } else {
      // Turning ON: if current track is dummy or missing, request real track
      const isDummy = !videoTrack || videoTrack === blackTrackRef.current;
      if (isDummy) {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          setError("Camera access is not supported on this device/connection.");
          return;
        }
        try {
          let tempStream: MediaStream;
          try {
            tempStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
                facingMode: "user",
              },
            });
          } catch (err) {
            console.warn("Failed to capture camera with constraints on toggle, trying video: true");
            tempStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }
          const realTrack = tempStream.getVideoTracks()[0];
          if (realTrack) {
            if (videoTrack) {
              stream.removeTrack(videoTrack);
            }
            stream.addTrack(realTrack);
            videoTrack = realTrack;
            cameraTrackRef.current = realTrack;

            // Update peers
            Object.values(peersRef.current).forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                             pc.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
              if (sender) sender.replaceTrack(realTrack);
            });

            // Update cameras and microphones lists since permission is granted
            const currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
            const freshCams = currentDevices.filter((d) => d.kind === "videoinput");
            setCameras(freshCams);
            setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));
            const matched = freshCams.find((d) => d.label === realTrack.label);
            const defaultCam = freshCams.find((d) => d.deviceId === "default" || d.label.toLowerCase().includes("default"));
            setSelectedCameraId(matched?.deviceId || realTrack.getSettings().deviceId || defaultCam?.deviceId || freshCams[0]?.deviceId || "");
          }
        } catch (err: any) {
          console.warn("Could not capture real camera track on toggle:", err);
          let msg = "Could not access your camera.";
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            msg = "Camera permission denied. Please allow camera access in browser settings.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            msg = "Camera is in use by another application. Close other apps and try again.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            msg = "No camera device found on this system.";
          } else if (err.name === "OverconstrainedError") {
            msg = "Requested camera resolution or constraints are not supported by your device.";
          } else if (err.message) {
            msg = `Camera error: ${err.message}`;
          }
          setError(msg);
          return;
        }
      }

      setIsCameraOff(false);
      isCameraOffRef.current = false;
      setLocalStream(new MediaStream(stream.getTracks()));
      broadcastMediaState(isMutedRef.current, false, isScreenSharingRef.current);
    }
  }, [broadcastMediaState]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      stopScreenShareCleanup();
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError("Screen sharing is not supported on this device/connection.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      screenStreamRef.current = stream;
      const screenTrack = stream.getVideoTracks()[0];

      screenTrack.addEventListener("ended", () => {
        stopScreenShareCleanup();
      });

      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                       pc.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
        if (sender) sender.replaceTrack(screenTrack);
      });

      const activeAudio = isMutedRef.current ? silentAudioTrackRef.current : audioTrackRef.current;
      const combinedTracks = [screenTrack];
      if (activeAudio) combinedTracks.push(activeAudio);
      const combined = new MediaStream(combinedTracks);
      setLocalStream(combined);

      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      broadcastMediaState(isMutedRef.current, isCameraOffRef.current, true);
    } catch (e) {
      console.error("Screen share error:", e);
    }
  }, [stopScreenShareCleanup, broadcastMediaState]);

  const setCameraDevice = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Camera switching is not supported on this device/connection.");
      return;
    }
    try {
      const oldTracks = localStreamRef.current.getVideoTracks();
      oldTracks.forEach((t) => {
        if (t !== blackTrackRef.current) t.stop();
      });

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
      } catch (err) {
        console.warn("Failed to set camera with constraints, trying exact deviceId only");
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
      }
      const newTrack = newStream.getVideoTracks()[0];
      newTrack.enabled = !isCameraOffRef.current;

      if (oldTracks.length > 0) {
        oldTracks.forEach(t => localStreamRef.current?.removeTrack(t));
      }
      localStreamRef.current.addTrack(newTrack);
      cameraTrackRef.current = newTrack;

      if (!isScreenSharingRef.current) {
        const trackToSend = isCameraOffRef.current ? (blackTrackRef.current || null) : newTrack;
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                         pc.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
          if (sender && trackToSend) sender.replaceTrack(trackToSend);
        });
      }

      setSelectedCameraId(deviceId);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err: any) {
      console.error("Error setting camera device:", err);
      // Fallback to black track if it failed
      const oldTracks = localStreamRef.current.getVideoTracks();
      oldTracks.forEach(t => {
        if (t !== blackTrackRef.current) {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        }
      });
      if (blackTrackRef.current && !localStreamRef.current.getVideoTracks().includes(blackTrackRef.current)) {
        localStreamRef.current.addTrack(blackTrackRef.current);
      }
      setIsCameraOff(true);
      isCameraOffRef.current = true;
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      
      let msg = "Could not switch camera device.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission denied for this device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Selected camera is already in use by another app or tab.";
      }
      setError(msg);
    }
  }, []);

  const setMicDevice = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Microphone switching is not supported on this device/connection.");
      return;
    }
    try {
      const oldTracks = localStreamRef.current.getAudioTracks();
      oldTracks.forEach((t) => {
        if (t !== silentAudioTrackRef.current) t.stop();
      });

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 },
          },
        });
      } catch (err) {
        console.warn("Failed to set microphone with constraints, trying exact deviceId only");
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
      }
      const newTrack = newStream.getAudioTracks()[0];
      newTrack.enabled = !isMutedRef.current;

      if (oldTracks.length > 0) {
        oldTracks.forEach(t => localStreamRef.current?.removeTrack(t));
      }
      localStreamRef.current.addTrack(newTrack);
      audioTrackRef.current = newTrack;

      const trackToSend = isMutedRef.current ? (silentAudioTrackRef.current || null) : newTrack;
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio") ||
                       pc.getTransceivers().find((t) => t.receiver.track.kind === "audio")?.sender;
        if (sender && trackToSend) sender.replaceTrack(trackToSend);
      });

      setSelectedMicId(deviceId);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err: any) {
      console.error("Error setting microphone device:", err);
      // Fallback to silent track
      const oldTracks = localStreamRef.current.getAudioTracks();
      oldTracks.forEach(t => {
        if (t !== silentAudioTrackRef.current) {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        }
      });
      if (silentAudioTrackRef.current && !localStreamRef.current.getAudioTracks().includes(silentAudioTrackRef.current)) {
        localStreamRef.current.addTrack(silentAudioTrackRef.current);
      }
      setIsMuted(true);
      isMutedRef.current = true;
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      
      let msg = "Could not switch microphone device.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Microphone permission denied for this device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Selected microphone is already in use by another app or tab.";
      }
      setError(msg);
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit("chat-message", { text: text.trim() });
    }
  }, []);

  // ─── WAITING ROOM ADMINISTRATIVE HOST COMMANDS ───────────────────────────
  const admitUser = useCallback((targetUserId: string) => {
    socketRef.current?.emit("admit-user", { roomId, userId: targetUserId });
  }, [roomId]);

  const rejectUser = useCallback((targetUserId: string) => {
    socketRef.current?.emit("reject-user", { roomId, userId: targetUserId });
  }, [roomId]);

  const muteUser = useCallback((targetUserId: string) => {
    socketRef.current?.emit("mute-user", { roomId, targetUserId });
  }, [roomId]);

  const disableVideoUser = useCallback((targetUserId: string) => {
    socketRef.current?.emit("disable-video", { roomId, targetUserId });
  }, [roomId]);

  const removeUser = useCallback((targetUserId: string) => {
    socketRef.current?.emit("remove-user", { roomId, targetUserId });
  }, [roomId]);

  const lockMeeting = useCallback((isLocked: boolean) => {
    socketRef.current?.emit("lock-meeting", { roomId, isLocked });
  }, [roomId]);

  const transferHost = useCallback((targetUserId: string) => {
    socketRef.current?.emit("transfer-host", { roomId, targetUserId });
  }, [roomId]);

  const raiseHand = useCallback((isRaised: boolean) => {
    setIsHandRaised(isRaised);
    socketRef.current?.emit("raise-hand", { roomId, isRaisedHand: isRaised });
  }, [roomId]);

  return {
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isHandRaised,
    error,
    messages,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    socket: socketRef.current,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicId,
    setCameraDevice,
    setMicDevice,
    connectionStatus,
    speakingUsers,
    isSimulating,
    toggleSimulation,
    // Waiting room & Host controls exports
    waitingStatus,
    waitingUsersList,
    isRoomLocked,
    roomHostId,
    raiseHand,
    admitUser,
    rejectUser,
    muteUser,
    disableVideoUser,
    removeUser,
    lockMeeting,
    transferHost,
  };
}
