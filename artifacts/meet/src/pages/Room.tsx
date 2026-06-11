import React, { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetRoom } from "@workspace/api-client-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoTile } from "@/components/VideoTile";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Copy, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 9);
}

function generateDisplayName() {
  const adjectives = ["Clever", "Swift", "Sharp", "Brave", "Quiet", "Bright"];
  const animals = ["Fox", "Hawk", "Owl", "Wolf", "Bear", "Lynx"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
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

  const { data: roomInfo, isLoading: isRoomLoading, error: roomError } = useGetRoom(roomId);

  const {
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error: rtcError,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  } = useWebRTC(roomId, userId, displayName);

  useEffect(() => {
    if (rtcError) {
      toast({
        title: "Connection Error",
        description: rtcError,
        variant: "destructive",
      });
    }
  }, [rtcError, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Meeting link copied to clipboard.",
    });
  };

  const handleLeave = () => {
    setLocation("/");
  };

  const participantList = useMemo(() => {
    const list = Object.values(participants);
    return list;
  }, [participants]);

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
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{participantList.length + 1}</span>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </header>

      {/* Video Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col relative">
        <div className={`grid gap-4 w-full h-full max-h-full content-center ${gridClass}`}>
          
          {/* Local User */}
          <VideoTile
            stream={localStream}
            displayName={`${displayName}`}
            isLocal={true}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            isDominant={screenSharingParticipantId === userId}
          />

          {/* Remote Users */}
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

      {/* Control Bar */}
      <footer className="h-24 shrink-0 bg-card border-t border-border flex items-center justify-center px-6 z-10 pb-safe">
        <div className="flex items-center space-x-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={toggleMic}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            variant={isCameraOff ? "destructive" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={toggleCamera}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>

          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="icon"
            className="w-14 h-14 rounded-full hidden sm:flex"
            onClick={toggleScreenShare}
          >
            <MonitorUp className="w-6 h-6" />
          </Button>

          <div className="w-px h-8 bg-border mx-2"></div>

          <Button
            variant="destructive"
            size="lg"
            className="h-14 px-8 rounded-full font-semibold"
            onClick={handleLeave}
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            Leave
          </Button>
        </div>
      </footer>
    </div>
  );
}
