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

  const isMutedRef = useRef(false);
  const isCameraOffRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const isHandRaisedRef = useRef(false);

  const iceCandidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const remoteDescSet = useRef<Record<string, boolean>>({});

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

      pc.ontrack = () => {
        setRemoteStreams((prev) => {
          const newStream = new MediaStream();
          pc.getReceivers().forEach((receiver) => {
            if (receiver.track && receiver.track.readyState === "live") {
              newStream.addTrack(receiver.track);
            }
          });
          return { ...prev, [targetUserId]: newStream };
        });
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
        : localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      });
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }

    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    broadcastMediaState(isMutedRef.current, isCameraOffRef.current, false);
  }, [broadcastMediaState]);

  // Effect 1: Capture local media preview (Run unconditionally on mount)
  useEffect(() => {
    let mounted = true;

    const handleDeviceChange = async () => {
      try {
        const currentDevices = await navigator.mediaDevices.enumerateDevices();
        if (mounted) {
          setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
          setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));
        }
      } catch (e) {
        console.error("enumerateDevices on devicechange error", e);
      }
    };

    async function initMedia() {
      // Always pre-create dummy silent/black tracks for WebRTC fallback/renegotiation bypass
      blackTrackRef.current = createBlackVideoTrack();
      silentAudioTrackRef.current = createSilentAudioTrack();

      let realStream: MediaStream | null = null;
      let hasVideoDevice = false;
      let hasAudioDevice = false;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasVideoDevice = devices.some((d) => d.kind === "videoinput");
        hasAudioDevice = devices.some((d) => d.kind === "audioinput");
      } catch (e) {
        hasVideoDevice = true;
        hasAudioDevice = true;
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

      // Try capturing real devices
      if (hasVideoDevice || hasAudioDevice) {
        try {
          realStream = await navigator.mediaDevices.getUserMedia({
            video: hasVideoDevice ? videoConstraints : false,
            audio: hasAudioDevice ? audioConstraints : false,
          });
        } catch (mediaErr) {
          console.warn("Could not capture both camera/mic streams:", mediaErr);
          
          // Fallback: Try capturing audio only
          if (hasAudioDevice) {
            try {
              realStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: false,
              });
            } catch (audioErr) {
              console.warn("Could not capture audio only stream:", audioErr);
            }
          }

          // Fallback: Try capturing video only
          if (!realStream && hasVideoDevice) {
            try {
              realStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false,
              });
            } catch (videoErr) {
              console.warn("Could not capture video only stream:", videoErr);
            }
          }
        }
      }

      if (!mounted) {
        realStream?.getTracks().forEach((t) => t.stop());
        blackTrackRef.current?.stop();
        silentAudioTrackRef.current?.stop();
        return;
      }

      // Build the unified local stream containing exactly 1 video track and 1 audio track
      const localStreamObj = new MediaStream();
      const realVideoTrack = realStream?.getVideoTracks()[0];
      const realAudioTrack = realStream?.getAudioTracks()[0];

      const currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
      setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
      setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));

      // 1. Setup Video
      if (realVideoTrack) {
        localStreamObj.addTrack(realVideoTrack);
        const matched = currentDevices.find((d) => d.kind === "videoinput" && d.label === realVideoTrack.label);
        setSelectedCameraId(matched?.deviceId || realVideoTrack.getSettings().deviceId || "");
        setIsCameraOff(false);
        isCameraOffRef.current = false;
      } else {
        localStreamObj.addTrack(blackTrackRef.current!);
        setIsCameraOff(true);
        isCameraOffRef.current = true;
      }

      // 2. Setup Audio
      if (realAudioTrack) {
        localStreamObj.addTrack(realAudioTrack);
        const matched = currentDevices.find((d) => d.kind === "audioinput" && d.label === realAudioTrack.label);
        setSelectedMicId(matched?.deviceId || realAudioTrack.getSettings().deviceId || "");
        setIsMuted(false);
        isMutedRef.current = false;
      } else {
        localStreamObj.addTrack(silentAudioTrackRef.current!);
        setIsMuted(true);
        isMutedRef.current = true;
      }

      setLocalStream(localStreamObj);
      localStreamRef.current = localStreamObj;

      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    initMedia();

    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
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

    const socket = io({
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
      const pc = peersRef.current[from];
      if (!pc) return;

      if (remoteDescSet.current[from]) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // Ignore stale candidates
        }
      } else {
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

    // If unmuting, and current track is our dummy silent track, attempt real capture
    if (!newMuted && audioTrack && (audioTrack as any).isSilentDummy) {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 },
          },
        });
        const realTrack = tempStream.getAudioTracks()[0];
        if (realTrack) {
          stream.removeTrack(audioTrack);
          audioTrack.stop(); // Stop dummy track
          stream.addTrack(realTrack);
          audioTrack = realTrack;

          // Update microphones list
          const currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
          setMicrophones(currentDevices.filter((d) => d.kind === "audioinput"));
          const matched = currentDevices.find((d) => d.kind === "audioinput" && d.label === realTrack.label);
          setSelectedMicId(matched?.deviceId || realTrack.getSettings().deviceId || "");
        }
      } catch (err) {
        console.warn("Could not capture real microphone track on toggle:", err);
      }
    }

    if (!audioTrack) return;
    audioTrack.enabled = !newMuted;

    // Update peers
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
      if (sender) sender.replaceTrack(audioTrack);
    });

    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    setLocalStream(new MediaStream(stream.getTracks()));
    broadcastMediaState(newMuted, isCameraOffRef.current, isScreenSharingRef.current);
  }, [broadcastMediaState]);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    let videoTrack = stream.getVideoTracks()[0];
    const newCameraOff = !isCameraOffRef.current;

    // If turning camera ON, and current track is our dummy black track, attempt real capture
    if (!newCameraOff && videoTrack === blackTrackRef.current) {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: "user",
          },
        });
        const realTrack = tempStream.getVideoTracks()[0];
        if (realTrack) {
          stream.removeTrack(videoTrack);
          // Note: we do not stop blackTrackRef.current as we might need it again if they toggle off!
          stream.addTrack(realTrack);
          videoTrack = realTrack;

          // Update cameras list
          const currentDevices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
          setCameras(currentDevices.filter((d) => d.kind === "videoinput"));
          const matched = currentDevices.find((d) => d.kind === "videoinput" && d.label === realTrack.label);
          setSelectedCameraId(matched?.deviceId || realTrack.getSettings().deviceId || "");
        }
      } catch (err) {
        console.warn("Could not capture real camera track on toggle:", err);
      }
    }

    if (!videoTrack) return;
    videoTrack.enabled = !newCameraOff;

    const trackToSend = newCameraOff ? blackTrackRef.current! : videoTrack;
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(trackToSend);
    });

    setIsCameraOff(newCameraOff);
    isCameraOffRef.current = newCameraOff;
    setLocalStream(new MediaStream(stream.getTracks()));
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
        audio: false,
      });
      screenStreamRef.current = stream;
      const screenTrack = stream.getVideoTracks()[0];

      screenTrack.addEventListener("ended", () => {
        stopScreenShareCleanup();
      });

      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      const combined = new MediaStream([
        screenTrack,
        ...(localStreamRef.current?.getAudioTracks() || []),
      ]);
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
    try {
      const oldTracks = localStreamRef.current.getVideoTracks();
      oldTracks.forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
      const newTrack = newStream.getVideoTracks()[0];
      newTrack.enabled = !isCameraOffRef.current;

      if (oldTracks.length > 0) {
        localStreamRef.current.removeTrack(oldTracks[0]);
      }
      localStreamRef.current.addTrack(newTrack);

      if (!isScreenSharingRef.current) {
        const trackToSend = isCameraOffRef.current ? blackTrackRef.current! : newTrack;
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(trackToSend);
        });
      }

      setSelectedCameraId(deviceId);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.error("Error setting camera device:", err);
      setError("Could not switch camera device.");
    }
  }, []);

  const setMicDevice = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;
    try {
      const oldTracks = localStreamRef.current.getAudioTracks();
      oldTracks.forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 },
        },
      });
      const newTrack = newStream.getAudioTracks()[0];
      newTrack.enabled = !isMutedRef.current;

      if (oldTracks.length > 0) {
        localStreamRef.current.removeTrack(oldTracks[0]);
      }
      localStreamRef.current.addTrack(newTrack);

      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender) sender.replaceTrack(newTrack);
      });

      setSelectedMicId(deviceId);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.error("Error setting microphone device:", err);
      setError("Could not switch microphone device.");
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
