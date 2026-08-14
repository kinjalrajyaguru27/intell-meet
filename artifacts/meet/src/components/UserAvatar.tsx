import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { COLOR_MAP } from "@/pages/EditProfile";

export interface UserAvatarProps {
  user: {
    name?: string;
    avatar?: string | null;
    profilePicture?: string | null;
    profileColor?: string | null;
  } | null | undefined;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
}

export function UserAvatar({
  user,
  className = "",
  sizeClassName = "w-8 h-8",
  textClassName = "text-xs",
  roundedClassName = "rounded-lg"
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const avatarSrc = user?.avatar || user?.profilePicture;

  // Reset error status if avatarSrc changes
  useEffect(() => {
    setImageError(false);
  }, [avatarSrc]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  };

  const hasValidSrc =
    !imageError &&
    typeof avatarSrc === "string" &&
    avatarSrc.trim().length > 0 &&
    (avatarSrc.startsWith("http") ||
      avatarSrc.startsWith("/") ||
      avatarSrc.startsWith("data:") ||
      avatarSrc.startsWith("blob:"));

  const bgGradient = COLOR_MAP[user?.profileColor || "purple"] || COLOR_MAP.purple;

  return (
    <Avatar className={`${sizeClassName} ${roundedClassName} shrink-0 overflow-hidden flex items-center justify-center border border-border/40 ${className}`}>
      {hasValidSrc ? (
        <img
          src={avatarSrc!}
          alt={user?.name || "User Photo"}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${roundedClassName}`}
        />
      ) : (
        <div
          className={`w-full h-full text-white font-bold ${textClassName} flex items-center justify-center ${roundedClassName} select-none`}
          style={{ background: bgGradient }}
        >
          {getInitials(user?.name || "")}
        </div>
      )}
    </Avatar>
  );
}
export default UserAvatar;
