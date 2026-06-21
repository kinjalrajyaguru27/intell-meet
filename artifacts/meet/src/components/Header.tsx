import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COLOR_MAP } from "@/pages/EditProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  LayoutGrid,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  User,
  Mail,
  Shield,
} from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  if (!isAuthenticated || !user) return null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  };

  // Check if current route is active
  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-md px-6 py-3 flex items-center justify-between shrink-0">
      {/* Brand Logo */}
      <div
        className="flex items-center space-x-3 cursor-pointer group"
        onClick={() => setLocation("/")}
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
          <Video className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Intell Meet
        </span>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        <button
          onClick={() => setLocation("/dashboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive("/dashboard")
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
              : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => setLocation("/kanban")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive("/kanban")
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
              : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Kanban Board
        </button>
        <button
          onClick={() => setLocation("/analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive("/analytics")
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
              : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Insights
        </button>
      </nav>

      {/* Right Actions Menu */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => setLocation("/")}
          className="hidden sm:flex gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-full px-4 text-xs font-semibold shadow-md shadow-primary/10 transition-transform duration-200 hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Meeting
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none focus:outline-none">
            <Avatar className="w-9 h-9 rounded-full border border-zinc-200 dark:border-white/10 hover:border-primary/50 transition-colors duration-200 cursor-pointer overflow-hidden flex items-center justify-center">
              {user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div 
                  className="w-full h-full text-white font-bold text-xs flex items-center justify-center"
                  style={{ background: COLOR_MAP[user.profileColor || "purple"] || COLOR_MAP.purple }}
                >
                  {getInitials(user.name)}
                </div>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-100 rounded-xl p-1.5 shadow-2xl backdrop-blur-lg"
          >
            {/* Profile Card Header */}
            <div className="px-2.5 py-3 flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[120px]">
                  {user.name}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize leading-none font-semibold ${
                    user.role === "Admin"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : user.role === "Manager"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                  }`}
                >
                  {user.role === "Member" ? "Team Member" : user.role}
                </Badge>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {user.email}
              </span>
            </div>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />

            {/* Navigation Options for Mobile */}
            <div className="md:hidden">
              <DropdownMenuItem
                onClick={() => setLocation("/dashboard")}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                  isActive("/dashboard") ? "text-primary bg-primary/10" : "text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/kanban")}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                  isActive("/kanban") ? "text-primary bg-primary/10" : "text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Settings className="w-4 h-4" />
                Kanban Board
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/analytics")}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                  isActive("/analytics") ? "text-primary bg-primary/10" : "text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Insights
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/")}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />
            </div>

            {/* General Actions */}
            <DropdownMenuItem
              onClick={() => setLocation("/profile")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Profile Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setLocation("/team/invite")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Team Invitations
            </DropdownMenuItem>

            {user.role === "Admin" && (
              <>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setLocation("/admin/users")}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  Admin Console
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />

            <DropdownMenuItem
              onClick={() => {
                logout();
                setLocation("/login");
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-450 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
