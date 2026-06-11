import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
  isDominant?: boolean;
}

export function VideoTile({
  stream,
  displayName,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
  isDominant = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center transition-all ${
        isDominant ? "col-span-full aspect-video h-full max-h-[70vh] w-full" : "aspect-video"
      }`}
    >
      {isCameraOff && !isScreenSharing ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-border bg-muted">
            <AvatarFallback className="text-2xl text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? "scale-x-[-1]" : ""}`}
        />
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-md text-sm font-medium text-foreground flex items-center space-x-2 border border-border/50">
          <span>{displayName}</span>
          {isLocal && <span className="text-muted-foreground text-xs">(You)</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          {isMuted && (
            <div className="bg-destructive/80 backdrop-blur-md p-1.5 rounded-md border border-destructive">
              <MicOff className="w-4 h-4 text-destructive-foreground" />
            </div>
          )}
          {isCameraOff && !isScreenSharing && (
            <div className="bg-background/80 backdrop-blur-md p-1.5 rounded-md border border-border/50">
              <VideoOff className="w-4 h-4 text-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
