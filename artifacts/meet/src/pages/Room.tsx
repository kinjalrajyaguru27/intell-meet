import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetRoom, useEndMeeting } from "@workspace/api-client-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useRecording } from "@/hooks/useRecording";
import { VideoTile } from "@/components/VideoTile";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Copy, Users, Activity, MessageSquare, Send, X, Circle, Square,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
  const endMeetingMutation = useEndMeeting();

  const { data: roomInfo, isLoading: isRoomLoading, error: roomError } = useGetRoom(roomId);

  const {
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error: rtcError,
    messages,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
  } = useWebRTC(roomId, userId, displayName);

  const {
    isRecording,
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

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLen = useRef(0);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      if (!isChatOpen) {
        setUnreadCount((c) => c + (messages.length - prevMessagesLen.current));
      }
    }
    prevMessagesLen.current = messages.length;
  }, [messages, isChatOpen]);

  // Auto-scroll to bottom when chat is open and new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Clear unread count when chat is opened
  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setUnreadCount(0);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      inputRef.current?.focus();
    }, 50);
  }, []);

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

  const handleLeave = useCallback(() => {
    if (isRecording) stopRecording();
    const durationSeconds = Math.round((Date.now() - joinedAt.current) / 1000);
    const allNames = [displayName, ...participantList.map((p) => p.displayName)];
    endMeetingMutation.mutate(
      { roomId, data: { participantNames: allNames, durationSeconds } },
      { onSettled: () => setLocation("/dashboard") },
    );
  }, [isRecording, stopRecording, displayName, participantList, endMeetingMutation, roomId, setLocation]);

  const screenSharingParticipantId = useMemo(() => {
    const sharingPeer = participantList.find((p) => p.isScreenSharing);
    if (sharingPeer) return sharingPeer.id;
    if (isScreenSharing) return userId;
    return null;
  }, [participantList, isScreenSharing, userId]);

  if (roomError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <p className="text-muted-foreground">This meeting might have ended or doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (isRoomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center space-x-3 text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Joining meeting...</span>
        </div>
      </div>
    );
  }

  const gridClass = screenSharingParticipantId
    ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
    : participantList.length === 0
      ? "grid-cols-1"
      : participantList.length === 1
        ? "grid-cols-2"
        : participantList.length <= 3
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
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </header>

      {/* Body: video grid + optional chat panel */}
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
            />
            {participantList.map((p) => (
              <VideoTile
                key={p.id}
                stream={remoteStreams[p.id] || null}
                displayName={p.displayName}
                isLocal={false}
                isMuted={p.isMuted}
                isCameraOff={p.isCameraOff}
                isScreenSharing={p.isScreenSharing}
                isDominant={screenSharingParticipantId === p.id}
              />
            ))}
          </div>
        </main>

        {/* Chat Panel */}
        {isChatOpen && (
          <aside className="w-80 shrink-0 flex flex-col border-l border-border bg-card">
            {/* Chat header */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">In-meeting chat</span>
              </div>
              <button
                data-testid="button-close-chat"
                onClick={() => setIsChatOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors rounded p-1 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
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

            {/* Input */}
            <div className="shrink-0 p-3 border-t border-border">
              <div className="flex items-center space-x-2 bg-muted rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  data-testid="input-chat-message"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message..."
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
            onClick={isRecording ? stopRecording : startRecording}
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
          <Button
            data-testid="button-toggle-mic"
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={toggleMic}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            data-testid="button-toggle-camera"
            variant={isCameraOff ? "destructive" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={toggleCamera}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          <div className="w-px h-8 bg-border mx-2 hidden sm:block" />

          <Button
            data-testid="button-toggle-screenshare"
            variant={isScreenSharing ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full hidden sm:flex"
            onClick={toggleScreenShare}
          >
            <MonitorUp className="w-6 h-6" />
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

        {/* Right side: chat toggle */}
        <div className="flex-1 flex justify-end">
          <div className="relative">
            <Button
              data-testid="button-toggle-chat"
              variant={isChatOpen ? "default" : "secondary"}
              size="icon"
              className="w-14 h-14 rounded-full"
              onClick={isChatOpen ? () => setIsChatOpen(false) : openChat}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
