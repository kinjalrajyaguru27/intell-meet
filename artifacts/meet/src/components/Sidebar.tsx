import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Video, LayoutGrid, FolderKanban, Brain, Users, Bell,
  User, Settings, LogOut, X, MessageSquare, FileText,
  CheckSquare, BarChart3
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { logout, user, token } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchNotificationsCount = async () => {
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter((n: any) => !n.isRead).length;
          setUnreadNotifications(unread);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    setIsOpen(false); // Close mobile drawer on navigation
  };

  const isLinkActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  const menuItems = [
    {
      key: "dashboard",
      title: "Dashboard",
      icon: LayoutGrid,
      path: "/dashboard",
    },
    {
      key: "meetings",
      title: "Meetings",
      icon: Video,
      path: "/",
    },
    {
      key: "ai",
      title: "AI Insights",
      icon: Brain,
      path: "/ai-insights",
    },
    {
      key: "collaboration",
      title: "Collaboration",
      icon: MessageSquare,
      path: "/collaboration",
    },
    {
      key: "post-meeting",
      title: "Post-Meeting Dashboard",
      icon: FileText,
      path: "/post-meeting",
    },
    {
      key: "team",
      title: "Team Management",
      icon: Users,
      path: "/team-management",
    },
    {
      key: "kanban",
      title: "Project Board",
      icon: FolderKanban,
      path: "/kanban",
    },
    {
      key: "analytics",
      title: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      key: "todo",
      title: "Todo Manager",
      icon: CheckSquare,
      path: "/todo-manager",
    },
    {
      key: "notifications",
      title: "Notifications",
      icon: Bell,
      path: "/notifications",
      badge: unreadNotifications,
    },
  ];

  const bottomItems = [
    {
      key: "profile",
      title: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      key: "settings",
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  if (!user) return null;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col bg-[#09090b]/95 border-r border-white/10 backdrop-blur-xl transition-all duration-300
    ${isCollapsed ? "w-16" : "w-64"}
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `;

  return (
    <>
      {/* Mobile Drawer Overlay Back-panel shadow */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-wider text-white uppercase whitespace-nowrap bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Intell Meet
              </span>
            )}
          </div>
          {/* Mobile close button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="md:hidden w-7 h-7 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Middle Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.path);

            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 relative
                  ${active 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"}
                `}
              >
                {/* Active Indicator on the Left */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-primary" : "text-zinc-400"}`} />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && item.badge > 0 ? (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                    {item.badge}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Menu Items & User Card */}
        <div className="px-2 py-3 border-t border-white/5 bg-black/10 space-y-1.5 shrink-0">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.path);

            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 relative
                  ${active 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"}
                `}
              >
                {/* Active Indicator on the Left */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-primary" : "text-zinc-400"}`} />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom User Card Profile Footer */}
        <div className="p-3 border-t border-white/5 bg-[#09090b]/80 shrink-0">
          <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/5 p-2 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-8 h-8 rounded-lg border border-white/10 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!isCollapsed && (
                <div className="min-w-0 flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white truncate leading-tight">{user.name}</span>
                  <span className="text-[9px] text-zinc-500 truncate leading-none capitalize mt-0.5">{user.role}</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  logout();
                  setLocation("/login");
                }}
                className="w-7 h-7 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg shrink-0"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
