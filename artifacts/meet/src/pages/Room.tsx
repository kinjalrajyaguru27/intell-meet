import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetRoom,
  useEndMeeting,
  useGetActiveMeeting,
  useUpsertNotes,
  useCreateActionItem,
  useUpdateActionItem,
  useJoinMeeting,
  useStartRecording,
  useStopRecording,
} from "@workspace/api-client-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useRecording } from "@/hooks/useRecording";
import { useSpeechTranscript } from "@/hooks/useSpeechTranscript";
import { useAuth } from "@/hooks/useAuth";
import { VideoTile } from "@/components/VideoTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Copy, Users, Activity, MessageSquare, Send, X, Circle, Square,
  ChevronUp, FileText, CheckSquare, Calendar, User, Clock, Check,
  Shield, ShieldAlert, Key, HelpCircle, Hand, Trash2, ShieldOff,
  Brain, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 9);
}

function generateDisplayName() {
  const adjectives = ["Clever", "Swift", "Sharp", "Brave", "Quiet", "Bright"];
  const animals = ["Fox", "Hawk", "Owl", "Wolf", "Bear", "Lynx"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Room() {
  const [, params] = useRoute("/room/:roomId");
  const roomId = params?.roomId || "";
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  // States for Lobby and Password Check
  const [hasJoined, setHasJoined] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState("");

  const [userId] = useState(() => {
    const saved = localStorage.getItem("intell_meet_uid");
    if (saved) return saved;
    const newId = generateUserId();
    localStorage.setItem("intell_meet_uid", newId);
    return newId;
  });

  const [displayName] = useState(() => {
    const saved = localStorage.getItem("intell_meet_name");
    if (saved) return saved;
    const newName = generateDisplayName();
    localStorage.setItem("intell_meet_name", newName);
    return newName;
  });

  const joinedAt = useRef(Date.now());
  const hasEndedRef = useRef(false);
  const endMeetingMutation = useEndMeeting();
  const joinMeetingMutation = useJoinMeeting();

  // Query details of meeting/room
  const { data: rawRoomInfo, isLoading: isRoomLoading, error: roomError } = useGetRoom(roomId);
  const roomInfo = rawRoomInfo as any;

  // Hook WebRTC Sockets & Peers
  const {
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isHandRaised,
    error: rtcError,
    messages,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    socket,
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
    // Waiting room & Host controls
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
  } = useWebRTC(roomId, userId, displayName, hasJoined, token);

  const [isTranscriptionPaused, setIsTranscriptionPaused] = useState(false);

  const {
    transcript,
    transcriptRef,
  } = useSpeechTranscript({
    roomId,
    displayName,
    socket,
    isMuted,
    isTranscriptionPaused,
  });

  const {
    isRecording,
    duration,
    durationLabel,
    startRecording,
    stopRecording,
  } = useRecording({
    localStream,
    remoteStreams,
    displayName,
    participants,
    roomName: roomInfo?.name,
  });

  // Start & Stop recording metadata mutations
  const startRecMutation = useStartRecording();
  const stopRecMutation = useStopRecording();

  const handleStartRecording = () => {
    startRecording();
    startRecMutation.mutate({
      data: { meetingId: roomId, title: `Recording - ${roomInfo?.name || "Meeting"}` },
    });
  };

  const handleStopRecording = () => {
    stopRecording();
    // Approximate sizes:
    const approxSizeBytes = duration * 312500; // ~2.5Mbps (312.5 KB/s)
    stopRecMutation.mutate({
      data: { meetingId: roomId, durationSeconds: duration, sizeBytes: approxSizeBytes },
    });
  };

  // Sidebar controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "participants" | "notes" | "tasks" | "transcript">("chat");
  const [unreadCount, setUnreadCount] = useState(0);

  // Active meeting context for real-time collaboration
  const { data: activeMeeting, refetch: refetchActiveMeeting } = useGetActiveMeeting(roomId);
  const activeMeetingId = activeMeeting?.id || "";

  // Shared notes state
  const [sharedNotes, setSharedNotes] = useState("");
  const sharedNotesRef = useRef("");
  const saveTimeoutRef = useRef<any>(null);
  const upsertNotesMutation = useUpsertNotes();

  // Determine if active user is host
  const isHost = useMemo(() => {
    if (!roomInfo) return false;
    // Check if the current user ID matches the host defined in room metadata or host transfers
    return roomInfo.host === userId || roomHostId === userId;
  }, [roomInfo, userId, roomHostId]);

  // Sync initial notes when activeMeeting loads
  useEffect(() => {
    if (activeMeeting?.notes != null && !sharedNotesRef.current) {
      setSharedNotes(activeMeeting.notes);
      sharedNotesRef.current = activeMeeting.notes;
    }
  }, [activeMeeting?.notes]);

  // Listen for socket updates of notes
  useEffect(() => {
    if (!socket) return;
    const handleNotesUpdate = (data: { notes: string }) => {
      setSharedNotes(data.notes);
      sharedNotesRef.current = data.notes;
    };
    socket.on("shared-notes-update", handleNotesUpdate);
    return () => {
      socket.off("shared-notes-update", handleNotesUpdate);
    };
  }, [socket]);

  // Listen for meeting-ended event
  useEffect(() => {
    if (!socket) return;
    const handleMeetingEnded = () => {
      toast({
        title: "Meeting Ended",
        description: "The host has ended this meeting.",
        variant: "default",
      });
      hasEndedRef.current = true;
      setLocation("/dashboard");
    };
    socket.on("meeting-ended", handleMeetingEnded);
    return () => {
      socket.off("meeting-ended", handleMeetingEnded);
    };
  }, [socket, setLocation, toast]);

  // Debounced auto-save notes to DB
  const debouncedSaveNotes = (newNotes: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (activeMeetingId) {
        upsertNotesMutation.mutate({ meetingId: activeMeetingId, data: { content: newNotes } });
      }
    }, 2000);
  };

  const handleNotesChange = (newNotes: string) => {
    setSharedNotes(newNotes);
    sharedNotesRef.current = newNotes;
    if (socket && socket.connected) {
      socket.emit("shared-notes-update", { notes: newNotes });
    }
    debouncedSaveNotes(newNotes);
  };

  // Shared tasks mutations and listeners
  const createActionItemMutation = useCreateActionItem({
    mutation: {
      onSuccess: () => {
        refetchActiveMeeting();
        socket?.emit("task-changed");
      },
    },
  });

  const updateActionItemMutation = useUpdateActionItem({
    mutation: {
      onSuccess: () => {
        refetchActiveMeeting();
        socket?.emit("task-changed");
      },
    },
  });

  const handleCreateTask = (text: string, assigneeName: string | null, dueDate: string | null) => {
    if (!activeMeetingId) return;
    createActionItemMutation.mutate({
      meetingId: activeMeetingId,
      data: {
        text,
        assigneeName: assigneeName || null,
        dueDate: dueDate || null,
      },
    });
  };

  const handleToggleTask = (actionItemId: string, isDone: boolean) => {
    updateActionItemMutation.mutate({
      actionItemId,
      data: { isDone },
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleTaskChanged = () => {
      refetchActiveMeeting();
    };
    socket.on("task-changed", handleTaskChanged);
    return () => {
      socket.off("task-changed", handleTaskChanged);
    };
  }, [socket, refetchActiveMeeting]);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLen = useRef(0);

  // Listen for socket notifications from administrative commands
  useEffect(() => {
    if (!socket) return;

    const handleForceMute = () => {
      toast({
        title: "Muted by Host",
        description: "The host has muted your microphone.",
        variant: "destructive",
      });
    };

    const handleForceDisableVideo = () => {
      toast({
        title: "Video Disabled by Host",
        description: "The host has disabled your camera feed.",
        variant: "destructive",
      });
    };

    socket.on("force-mute", handleForceMute);
    socket.on("force-disable-video", handleForceDisableVideo);

    return () => {
      socket.off("force-mute", handleForceMute);
      socket.off("force-disable-video", handleForceDisableVideo);
    };
  }, [socket, toast]);

  // Track unread messages when chat is closed or active tab is not chat
  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      if (!isSidebarOpen || sidebarTab !== "chat") {
        setUnreadCount((c) => c + (messages.length - prevMessagesLen.current));
      }
    }
    prevMessagesLen.current = messages.length;
  }, [messages, isSidebarOpen, sidebarTab]);

  // Auto-scroll to bottom when chat is open and new messages arrive
  useEffect(() => {
    if (isSidebarOpen && sidebarTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSidebarOpen, sidebarTab]);

  // Auto-scroll to bottom when transcript is open and new transcript lines arrive
  useEffect(() => {
    if (isSidebarOpen && sidebarTab === "transcript") {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, isSidebarOpen, sidebarTab]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
    inputRef.current?.focus();
  }, [inputText, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  useEffect(() => {
    if (rtcError) {
      toast({ title: "Connection Error", description: rtcError, variant: "destructive" });
    }
  }, [rtcError, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Meeting link copied to clipboard." });
  };

  const participantList = useMemo(() => Object.values(participants), [participants]);

  const offlineParticipantNames = useMemo(() => {
    if (!activeMeeting?.participantNames) return [];
    const activeNames = new Set([
      displayName,
      ...participantList.map((p) => p.displayName),
    ]);
    return activeMeeting.participantNames.filter((name: string) => !activeNames.has(name));
  }, [activeMeeting?.participantNames, displayName, participantList]);

  // Priority grid selection
  const activeGridParticipants = useMemo(() => {
    const screenSharer = participantList.find((p) => p.isScreenSharing);
    const speakers = participantList.filter((p) => speakingUsers[p.id] && p.id !== screenSharer?.id);
    const others = participantList.filter((p) => !speakingUsers[p.id] && p.id !== screenSharer?.id);

    const prioritised = [];
    if (screenSharer) prioritised.push(screenSharer);
    prioritised.push(...speakers);
    prioritised.push(...others);

    return prioritised.slice(0, 11); // Allow up to 11 remote participants (12 total with local user)
  }, [participantList, speakingUsers]);

  // Identify participants whose video tiles are not active on the screen but still need their audio played
  const hiddenParticipants = useMemo(() => {
    const activeIds = new Set(activeGridParticipants.map((p) => p.id));
    return participantList.filter((p) => !activeIds.has(p.id));
  }, [participantList, activeGridParticipants]);

  const handleLeave = useCallback(() => {
    hasEndedRef.current = true;
    if (isRecording) stopRecording();
    
    if (isHost) {
      const durationSeconds = Math.round((Date.now() - joinedAt.current) / 1000);
      const allNames = [displayName, ...participantList.map((p) => p.displayName)];
      endMeetingMutation.mutate(
        { roomId, data: { participantNames: allNames, durationSeconds, transcript: transcriptRef.current } },
        { onSettled: () => setLocation("/dashboard") }
      );
    } else {
      setLocation("/dashboard");
    }
  }, [isRecording, stopRecording, displayName, participantList, endMeetingMutation, roomId, setLocation, transcriptRef, isHost]);

  // Keep refs of values needed in the unmount effect to avoid stale closures
  const isRecordingRef = useRef(isRecording);
  const participantListRef = useRef(participantList);
  const displayNameRef = useRef(displayName);
  const tokenRef = useRef(token);
  const hasJoinedRef = useRef(hasJoined);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { participantListRef.current = participantList; }, [participantList]);
  useEffect(() => { displayNameRef.current = displayName; }, [displayName]);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { hasJoinedRef.current = hasJoined; }, [hasJoined]);

  useEffect(() => {
    return () => {
      if (hasJoinedRef.current && !hasEndedRef.current) {
        hasEndedRef.current = true;
        
        // Stop recording if active
        if (isRecordingRef.current) {
          try {
            stopRecording();
          } catch (e) {}
        }

        const durationSeconds = Math.round((Date.now() - joinedAt.current) / 1000);
        const allNames = [displayNameRef.current, ...participantListRef.current.map((p) => p.displayName)];
        
        if (isHost && tokenRef.current) {
          fetch(`/api/rooms/${roomId}/end`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenRef.current}`
            },
            body: JSON.stringify({
              participantNames: allNames,
              durationSeconds,
              transcript: transcriptRef.current
            }),
            keepalive: true
          }).catch(err => console.error("Auto-end meeting failed:", err));
        }
      }
    };
  }, [roomId, isHost]);

  const screenSharingParticipantId = useMemo(() => {
    const sharingPeer = participantList.find((p) => p.isScreenSharing);
    if (sharingPeer) return sharingPeer.id;
    if (isScreenSharing) return userId;
    return null;
  }, [participantList, isScreenSharing, userId]);

  // Join meeting action (triggers credentials check)
  const handleJoinMeeting = () => {
    joinMeetingMutation.mutate(
      { data: { meetingId: roomId, password: meetingPassword } },
      {
        onSuccess: () => {
          setHasJoined(true);
        },
        onError: (err: any) => {
          toast({
            title: "Join Failed",
            description: err.message || "Invalid meeting code or password.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (roomError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <p className="text-muted-foreground">This meeting might have ended or doesn't exist.</p>
          <Button onClick={() => setLocation("/dashboard")}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (isRoomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center space-x-3 text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Fetching room details...</span>
        </div>
      </div>
    );
  }

  // 1. PRE-JOIN LOBBY
  if (!hasJoined) {
    const showAvatar = isCameraOff;
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/30 backdrop-blur-md z-10">
          <span className="font-semibold text-lg tracking-tight">IntellMeet Pre-Join Lobby</span>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </header>

        {/* Lobby Content */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-10 max-w-5xl mx-auto w-full">
          {/* Left: Video Preview */}
          <div className="flex-1 w-full max-w-xl aspect-video rounded-2xl overflow-hidden bg-[#121214] border border-border/80 shadow-2xl relative flex items-center justify-center">
            {showAvatar ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                  <VideoOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">Your camera is off</p>
              </div>
            ) : (
              <video
                ref={(el) => {
                  if (el && localStream && el.srcObject !== localStream) {
                    el.srcObject = localStream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Video Overlaid toggles */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full hover:bg-white/10 transition-colors ${
                  isMuted ? "text-red-500" : "text-white"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full hover:bg-white/10 transition-colors ${
                  isCameraOff ? "text-red-500" : "text-white"
                }`}
                title={isCameraOff ? "Start Camera" : "Stop Camera"}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Right: Meeting Info and Credentials Form */}
          <div className="w-full lg:max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{roomInfo?.name || "Ready to Join?"}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Room Code: <span className="font-mono font-bold text-foreground">{roomId}</span>
              </p>
            </div>

            {/* Device Selectors */}
            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Select Camera</Label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setCameraDevice(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {cameras.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                  {cameras.length === 0 && <option value="">No cameras found</option>}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Select Microphone</Label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setMicDevice(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                  {microphones.length === 0 && <option value="">No microphones found</option>}
                </select>
              </div>
            </div>

            {/* Password check (if required) */}
            {roomInfo?.password && (
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Meeting is Password Protected
                </Label>
                <Input
                  type="password"
                  placeholder="Enter meeting password"
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  className="bg-muted/40 border-border/60 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 border-t border-border pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-full h-11 text-sm font-semibold"
                onClick={() => setLocation("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full h-11 text-sm font-semibold gap-2"
                onClick={handleJoinMeeting}
                disabled={joinMeetingMutation.isPending}
              >
                {joinMeetingMutation.isPending ? "Verifying..." : "Join Now"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. WAITING ROOM SCREEN
  if (waitingStatus === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="max-w-md w-full mx-auto p-6 bg-card border border-border rounded-2xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20 text-amber-500 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Waiting Room</h2>
            <p className="text-sm text-muted-foreground">
              Please wait, the meeting host will admit you shortly.
            </p>
          </div>
          <div className="pt-4 border-t border-border flex justify-center">
            <Button variant="destructive" className="rounded-full px-6" onClick={() => setLocation("/dashboard")}>
              Cancel & Leave
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. IN-CALL VIEW GRID CALCULATION
  const gridClass = screenSharingParticipantId
    ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
    : activeGridParticipants.length === 0
      ? "grid-cols-1"
      : activeGridParticipants.length === 1
        ? "grid-cols-2"
        : activeGridParticipants.length <= 3
          ? "grid-cols-2"
          : "grid-cols-3 lg:grid-cols-4";

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-lg tracking-tight truncate max-w-[200px] sm:max-w-md">
            {roomInfo?.name || "Meeting"}
          </span>
          <div className="hidden sm:flex items-center space-x-2 bg-muted px-2 py-1 rounded-md text-xs font-mono text-muted-foreground">
            <span>{roomId}</span>
          </div>
          {isRoomLocked && (
            <span className="flex items-center gap-1 bg-red-600/15 border border-red-600/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <ShieldAlert className="w-3 h-3" />
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {isRecording && (
            <div className="flex items-center space-x-2 bg-red-600/20 border border-red-600/40 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-mono font-semibold tracking-wider">
                REC {durationLabel}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span data-testid="participant-count">{participantList.length + 1}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-muted px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected" ? "bg-emerald-500" :
              connectionStatus === "connecting" ? "bg-amber-500 animate-pulse" :
              "bg-red-500"
            }`} />
            <span className="capitalize text-muted-foreground">{connectionStatus}</span>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </header>

      {/* Body: video grid + optional side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col relative min-w-0">
          <div className={`grid gap-4 w-full h-full max-h-full content-center ${gridClass}`}>
            <VideoTile
              stream={localStream}
              displayName={`${displayName}`}
              isLocal={true}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              isScreenSharing={isScreenSharing}
              isDominant={screenSharingParticipantId === userId}
              isSpeaking={!!speakingUsers["__local__"]}
              isRaisedHand={isHandRaised}
              isHost={isHost}
            />
            {activeGridParticipants.map((p) => {
              const isParticipantHost = p.id === roomHostId || (roomInfo?.host === p.id && roomHostId === "");
              return (
                <VideoTile
                  key={p.id}
                  stream={remoteStreams[p.id] || null}
                  displayName={p.displayName}
                  isLocal={false}
                  isMuted={p.isMuted}
                  isCameraOff={p.isCameraOff}
                  isScreenSharing={p.isScreenSharing}
                  isDominant={screenSharingParticipantId === p.id}
                  isSpeaking={!!speakingUsers[p.id]}
                  isRaisedHand={p.isRaisedHand}
                  isHost={isParticipantHost}
                />
              );
            })}
          </div>

          {/* Hidden audio/video elements for participants not in the grid to ensure we still hear/process their streams */}
          <div className="hidden" aria-hidden="true">
            {hiddenParticipants.map((p) => {
              const stream = remoteStreams[p.id];
              if (!stream) return null;
              return (
                <video
                  key={p.id}
                  ref={(el) => {
                    if (el && el.srcObject !== stream) {
                      el.srcObject = stream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted={false}
                />
              );
            })}
          </div>

          {/* Captions Overlay */}
          {transcript.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/85 px-5 py-2.5 rounded-xl border border-white/10 max-w-xl text-center shadow-lg">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                {transcript[transcript.length - 1].speaker}
              </p>
              <p className="text-sm text-white font-medium">
                "{transcript[transcript.length - 1].text}"
              </p>
            </div>
          )}
        </main>

        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <aside className="w-80 shrink-0 flex flex-col border-l border-border bg-card">
            {/* Tabs header */}
            <div className="h-14 shrink-0 flex border-b border-border bg-muted/20">
              <button
                onClick={() => setSidebarTab("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[10px] sm:text-[11px] transition-all ${
                  sidebarTab === "chat"
                    ? "border-primary text-primary bg-card/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => setSidebarTab("participants")}
                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[10px] sm:text-[11px] transition-all ${
                  sidebarTab === "participants"
                    ? "border-primary text-primary bg-card/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                People
              </button>
              <button
                onClick={() => setSidebarTab("notes")}
                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[10px] sm:text-[11px] transition-all ${
                  sidebarTab === "notes"
                    ? "border-primary text-primary bg-card/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Notes
              </button>
              <button
                onClick={() => setSidebarTab("tasks")}
                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[10px] sm:text-[11px] transition-all ${
                  sidebarTab === "tasks"
                    ? "border-primary text-primary bg-card/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Tasks
              </button>
              <button
                onClick={() => setSidebarTab("transcript")}
                className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 font-medium text-[10px] sm:text-[11px] transition-all ${
                  sidebarTab === "transcript"
                    ? "border-primary text-primary bg-card/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Speech
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="px-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            {sidebarTab === "chat" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 py-8">
                      <MessageSquare className="w-8 h-8 opacity-30" />
                      <p className="text-sm">No messages yet.</p>
                      <p className="text-xs opacity-60">Be the first to say something.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.userId === userId;
                      return (
                        <div
                          key={msg.id}
                          data-testid={`chat-message-${msg.id}`}
                          className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                        >
                          {!isOwn && (
                            <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                              {msg.displayName}
                            </span>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Emoji tray */}
                <div className="flex items-center justify-around py-1.5 border-t border-border bg-muted/10 shrink-0">
                  {["👍", "😂", "🎉", "❤️", "😮", "😢"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setInputText((prev) => prev + emoji)}
                      className="text-lg hover:scale-125 transition-transform duration-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="shrink-0 p-3 border-t border-border bg-card">
                  <div className="flex items-center space-x-2 bg-muted rounded-xl px-3 py-2">
                    <input
                      ref={inputRef}
                      data-testid="input-chat-message"
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send a message... (Use @ for mentions)"
                      maxLength={2000}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                    />
                    <button
                      data-testid="button-send-chat"
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="text-primary disabled:text-muted-foreground transition-colors hover:text-primary/80 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : sidebarTab === "participants" ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 1. Host controls: Locked meeting */}
                {isHost && (
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-3 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      Host Controls
                    </span>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Lock Meeting Room</span>
                      <button
                        onClick={() => lockMeeting(!isRoomLocked)}
                        className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                          isRoomLocked
                            ? "bg-red-600/10 border-red-600/30 text-red-400"
                            : "bg-muted border-border hover:bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {isRoomLocked ? "Unlock Meeting" : "Lock Meeting"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Host controls: Admit / Reject Queue */}
                {isHost && waitingUsersList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                      Pending Requests ({waitingUsersList.length})
                    </div>
                    <div className="space-y-1.5">
                      {waitingUsersList.map((userObj) => (
                        <div
                          key={userObj.userId}
                          className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-xs"
                        >
                          <span className="font-semibold truncate max-w-[120px]">{userObj.displayName}</span>
                          <div className="flex gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] h-7 px-2 rounded-lg"
                              onClick={() => rejectUser(userObj.userId)}
                            >
                              Deny
                            </Button>
                            <Button
                              size="sm"
                              className="text-[10px] h-7 px-2.5 rounded-lg font-bold"
                              onClick={() => admitUser(userObj.userId)}
                            >
                              Admit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Participants Directory
                </div>
                <div className="space-y-2">
                  {/* Local participant row */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 relative ${
                        speakingUsers["__local__"] ? "ring-2 ring-emerald-500 animate-pulse" : ""
                      }`}>
                        {displayName.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" title="Online" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">{displayName} (You)</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {isHost ? "Host / Organizer" : "Participant"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isHandRaised && (
                        <span className="text-xs animate-bounce" title="Hand Raised">✋</span>
                      )}
                      {isMuted ? (
                        <span title="Muted"><MicOff className="w-3.5 h-3.5 text-red-500" /></span>
                      ) : (
                        <span title="Microphone On"><Mic className="w-3.5 h-3.5 text-emerald-500" /></span>
                      )}
                      {isCameraOff ? (
                        <span title="Camera Off"><VideoOff className="w-3.5 h-3.5 text-red-500" /></span>
                      ) : (
                        <span title="Camera On"><Video className="w-3.5 h-3.5 text-emerald-500" /></span>
                      )}
                    </div>
                  </div>

                  {/* Remote & Mock participants list */}
                  {participantList.map((p) => {
                    const isSpk = !!speakingUsers[p.id];
                    const isParticipantHost = p.id === roomHostId || (roomInfo?.host === p.id && roomHostId === "");
                    return (
                      <div key={p.id} className="flex flex-col p-2 rounded-lg hover:bg-muted/10 border border-transparent hover:border-border/30 transition-all gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 relative ${
                              isSpk ? "ring-2 ring-emerald-500 animate-pulse" : ""
                            }`}>
                              {(p.displayName || "?").charAt(0).toUpperCase()}
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" title="Online" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">{p.displayName}</span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {isParticipantHost ? "Host" : "Participant"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.isRaisedHand && (
                              <span className="text-xs animate-bounce" title="Hand Raised">✋</span>
                            )}
                            {p.isMuted ? (
                              <span title="Muted"><MicOff className="w-3.5 h-3.5 text-red-500" /></span>
                            ) : (
                              <span title="Microphone On"><Mic className="w-3.5 h-3.5 text-emerald-500" /></span>
                            )}
                            {p.isCameraOff ? (
                              <span title="Camera Off"><VideoOff className="w-3.5 h-3.5 text-red-500" /></span>
                            ) : (
                              <span title="Camera On"><Video className="w-3.5 h-3.5 text-emerald-500" /></span>
                            )}
                          </div>
                        </div>

                        {/* Host Tools Grid for target participant */}
                        {isHost && p.id !== userId && (
                          <div className="flex gap-1.5 pt-1.5 border-t border-border/20 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[9px] h-6 px-1.5"
                              onClick={() => muteUser(p.id)}
                            >
                              Mute
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[9px] h-6 px-1.5"
                              onClick={() => disableVideoUser(p.id)}
                            >
                              Kill Cam
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[9px] h-6 px-1.5 text-primary hover:text-primary-foreground"
                              onClick={() => transferHost(p.id)}
                            >
                              Make Host
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[9px] h-6 px-1.5 text-red-400 hover:bg-red-500/10 border-red-500/10"
                              onClick={() => removeUser(p.id)}
                            >
                              Kick
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Offline participants list */}
                  {offlineParticipantNames.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-4 pb-1">
                        Offline ({offlineParticipantNames.length})
                      </div>
                      {offlineParticipantNames.map((name) => (
                        <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-transparent opacity-60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 relative">
                              {name.charAt(0).toUpperCase()}
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-500 border-2 border-background rounded-full" title="Offline" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">{name}</span>
                              <span className="text-[10px] text-muted-foreground">Offline</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : sidebarTab === "notes" ? (
              <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Collaborative Notes
                </div>
                <textarea
                  value={sharedNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Collaborative notes go here... Edits are synced in real-time."
                  className="flex-1 bg-muted/40 border border-border/60 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
                />
                <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                  Auto-saves to database every 2 seconds.
                </p>
              </div>
            ) : sidebarTab === "tasks" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Task form */}
                <div className="p-4 border-b border-border space-y-3 bg-muted/10">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    New Action Item
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const text = formData.get("text") as string;
                    const assignee = formData.get("assignee") as string;
                    const dueDate = formData.get("dueDate") as string;
                    if (!text.trim()) return;
                    handleCreateTask(text, assignee || null, dueDate || null);
                    e.currentTarget.reset();
                  }} className="space-y-2.5">
                    <input
                      name="text"
                      type="text"
                      placeholder="Task description..."
                      required
                      className="w-full bg-muted/40 border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        name="assignee"
                        className="bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      >
                        <option value="">Assignee...</option>
                        <option value={displayName}>{displayName} (You)</option>
                        {participantList.map(p => (
                          <option key={p.id} value={p.displayName}>{p.displayName}</option>
                        ))}
                      </select>
                      <input
                        name="dueDate"
                        type="date"
                        className="bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full text-xs h-8">
                      Add Task
                    </Button>
                  </form>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Meeting Tasks
                  </div>
                  {(!activeMeeting?.actionItems || activeMeeting.actionItems.length === 0) ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No action items created yet.
                    </div>
                  ) : (
                    activeMeeting.actionItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleToggleTask(item.id, !item.isDone)}
                          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                        >
                          {item.isDone ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium ${item.isDone ? "line-through text-muted-foreground font-normal" : "text-foreground"}`}>
                            {item.text}
                          </p>
                          {(item.assigneeName || item.dueDate) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.assigneeName && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                  <User className="w-2.5 h-2.5" />
                                  {item.assigneeName}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(item.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border space-y-1 bg-muted/10">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Live AI Transcript
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Speech-to-text transcript generated in real-time.
                  </p>
                </div>

                {/* Transcript list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {transcript.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 py-8">
                      <Sparkles className="w-8 h-8 opacity-30 text-violet-400 animate-pulse" />
                      <p className="text-sm">No transcript yet.</p>
                      <p className="text-xs opacity-60">Speak to see speech transcription.</p>
                    </div>
                  ) : (
                    transcript.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col space-y-1 bg-muted/20 border border-border/30 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-400">
                            {line.speaker}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {formatTime(line.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed break-words">
                          "{line.text}"
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Control Bar */}
      <footer className="h-24 shrink-0 bg-card border-t border-border flex items-center justify-between px-6 z-10">
        {/* Left side: record button */}
        <div className="flex-1 flex justify-start">
          <Button
            data-testid="button-toggle-recording"
            variant={isRecording ? "destructive" : "secondary"}
            size="sm"
            className="h-10 px-4 rounded-full font-medium gap-2"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                Record
              </>
            )}
          </Button>
        </div>

        {/* Center controls */}
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center">
            <Button
              data-testid="button-toggle-mic"
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="w-14 h-14 rounded-full rounded-r-none border-r border-background/20"
              onClick={toggleMic}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="w-6 h-14 rounded-full rounded-l-none px-1 flex items-center justify-center"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#09090b] border-border text-foreground">
                <DropdownMenuLabel className="text-muted-foreground text-xs">Select Microphone</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={selectedMicId} onValueChange={setMicDevice}>
                  {microphones.map((mic) => (
                    <DropdownMenuRadioItem key={mic.deviceId} value={mic.deviceId} className="text-xs">
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}
                    </DropdownMenuRadioItem>
                  ))}
                  {microphones.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No microphones found</div>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative flex items-center">
            <Button
              data-testid="button-toggle-camera"
              variant={isCameraOff ? "destructive" : "secondary"}
              size="icon"
              className="w-14 h-14 rounded-full rounded-r-none border-r border-background/20"
              onClick={toggleCamera}
            >
              {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isCameraOff ? "destructive" : "secondary"}
                  size="icon"
                  className="w-6 h-14 rounded-full rounded-l-none px-1 flex items-center justify-center"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#09090b] border-border text-foreground">
                <DropdownMenuLabel className="text-muted-foreground text-xs">Select Camera</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={selectedCameraId} onValueChange={setCameraDevice}>
                  {cameras.map((cam) => (
                    <DropdownMenuRadioItem key={cam.deviceId} value={cam.deviceId} className="text-xs">
                      {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                    </DropdownMenuRadioItem>
                  ))}
                  {cameras.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No cameras found</div>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-8 bg-border mx-2 hidden sm:block" />

          {/* Raise Hand Toggle */}
          <Button
            variant={isHandRaised ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => raiseHand(!isHandRaised)}
            title="Raise Hand"
          >
            <Hand className={`w-6 h-6 ${isHandRaised ? "fill-current" : ""}`} />
          </Button>

          <Button
            data-testid="button-toggle-screenshare"
            variant={isScreenSharing ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full hidden sm:flex"
            onClick={toggleScreenShare}
          >
            <MonitorUp className="w-6 h-6" />
          </Button>

          {/* Pause / Resume Transcription */}
          <Button
            variant={isTranscriptionPaused ? "destructive" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => setIsTranscriptionPaused(!isTranscriptionPaused)}
            title={isTranscriptionPaused ? "Resume Live AI Transcription" : "Pause Live AI Transcription"}
          >
            <Brain className={`w-6 h-6 ${isTranscriptionPaused ? "text-red-400" : "text-violet-400 animate-pulse"}`} />
          </Button>

          <div className="w-px h-8 bg-border mx-2" />

          <Button
            data-testid="button-leave"
            variant="destructive"
            size="lg"
            className="h-14 px-8 rounded-full font-semibold"
            onClick={handleLeave}
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            Leave
          </Button>
        </div>

        {/* Right side: side panel toggles */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {/* Participants Toggle */}
          <Button
            variant={isSidebarOpen && sidebarTab === "participants" ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full relative"
            onClick={() => {
              if (isSidebarOpen && sidebarTab === "participants") {
                setIsSidebarOpen(false);
              } else {
                setIsSidebarOpen(true);
                setSidebarTab("participants");
              }
            }}
            title="Participants"
          >
            <Users className="w-6 h-6" />
            <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-background">
              {participantList.length + 1}
            </span>
          </Button>

          {/* Chat Toggle */}
          <div className="relative">
            <Button
              data-testid="button-toggle-chat"
              variant={isSidebarOpen && sidebarTab === "chat" ? "default" : "secondary"}
              size="icon"
              className="w-14 h-14 rounded-full"
              onClick={() => {
                if (isSidebarOpen && sidebarTab === "chat") {
                  setIsSidebarOpen(false);
                } else {
                  setIsSidebarOpen(true);
                  setSidebarTab("chat");
                  setUnreadCount(0);
                }
              }}
              title="Chat"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {/* Notes Toggle */}
          <Button
            data-testid="button-toggle-notes"
            variant={isSidebarOpen && sidebarTab === "notes" ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => {
              if (isSidebarOpen && sidebarTab === "notes") {
                setIsSidebarOpen(false);
              } else {
                setIsSidebarOpen(true);
                setSidebarTab("notes");
              }
            }}
            title="Notes"
          >
            <FileText className="w-6 h-6" />
          </Button>

          {/* Tasks Toggle */}
          <Button
            data-testid="button-toggle-tasks"
            variant={isSidebarOpen && sidebarTab === "tasks" ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => {
              if (isSidebarOpen && sidebarTab === "tasks") {
                setIsSidebarOpen(false);
              } else {
                setIsSidebarOpen(true);
                setSidebarTab("tasks");
              }
            }}
            title="Tasks"
          >
            <CheckSquare className="w-6 h-6" />
          </Button>

          {/* Transcript Toggle */}
          <Button
            data-testid="button-toggle-transcript"
            variant={isSidebarOpen && sidebarTab === "transcript" ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => {
              if (isSidebarOpen && sidebarTab === "transcript") {
                setIsSidebarOpen(false);
              } else {
                setIsSidebarOpen(true);
                setSidebarTab("transcript");
              }
            }}
            title="AI Transcript History"
          >
            <Sparkles className="w-6 h-6 text-violet-400" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
