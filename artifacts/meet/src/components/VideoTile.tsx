import { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";
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
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      // Always reassign — even if it's the "same" stream object,
      // its tracks may have changed (e.g. screen share replaceTrack)
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      // Ensure playback is running (some browsers pause on srcObject change)
      video.play().catch(() => {
        // Autoplay may be blocked; will play on first user interaction
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // When the video element remounts after isCameraOff toggle, re-attach stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  });

  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const showAvatar = isCameraOff && !isScreenSharing;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#1a1a1f] border border-border shadow-sm flex items-center justify-center transition-all ${
        isDominant ? "col-span-full aspect-video h-full max-h-[70vh] w-full" : "aspect-video"
      }`}
    >
      {/* Video element — always in DOM so srcObject is never lost, hidden when camera off */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${
          isLocal && !isScreenSharing ? "scale-x-[-1]" : ""
        } ${showAvatar ? "hidden" : "block"}`}
      />

      {/* Avatar shown when camera is off */}
      {showAvatar && (
        <div className="flex flex-col items-center justify-center space-y-4 w-full h-full">
          <Avatar className="h-24 w-24 border-2 border-border bg-muted">
            <AvatarFallback className="text-2xl text-muted-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{displayName}</span>
        </div>
      )}

      {/* Name + status bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-sm font-medium text-white flex items-center space-x-1.5 max-w-[70%] truncate">
          <span className="truncate">{displayName}</span>
          {isLocal && (
            <span className="text-white/50 text-xs shrink-0">(You)</span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {isMuted && (
            <div className="bg-red-600/90 backdrop-blur-md p-1.5 rounded-md">
              <MicOff className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {showAvatar && (
            <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-md">
              <VideoOff className="w-3.5 h-3.5 text-white/70" />
            </div>
          )}
        </div>
      </div>

      {/* Screen share label */}
      {isScreenSharing && !isLocal && (
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-md">
          Screen
        </div>
      )}
    </div>
  );
}
