import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, Trash2, Mail, MessageSquare, Calendar, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotifFilter = "all" | "mentions" | "tasks" | "meetings" | "system";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "just now";
  };

  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      if (activeFilter === "all") return true;
      if (activeFilter === "mentions") return n.type === "mention";
      if (activeFilter === "tasks") return n.type === "task_assignment" || n.title?.toLowerCase().includes("task");
      if (activeFilter === "meetings") return n.type === "meeting" || n.title?.toLowerCase().includes("meet") || n.type === "message";
      if (activeFilter === "system") return !["mention", "task_assignment", "meeting", "message"].includes(n.type) && !n.title?.toLowerCase().includes("task") && !n.title?.toLowerCase().includes("meet");
      return true;
    });
  };

  const getIconForType = (type: string) => {
    if (type === "mention") return <MessageSquare className="w-4 h-4 text-violet-400" />;
    if (type === "task_assignment") return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
    if (type === "message") return <Mail className="w-4 h-4 text-blue-400" />;
    return <Bell className="w-4 h-4 text-zinc-400" />;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifs = getFilteredNotifications();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-white font-sans">Notifications Center</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full text-[10px] font-bold">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-full text-xs font-semibold border-white/10">
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs Selection row */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px">
        {([
          { value: "all", label: "All Alerts" },
          { value: "mentions", label: "Mentions" },
          { value: "tasks", label: "Tasks" },
          { value: "meetings", label: "Meetings" },
          { value: "system", label: "System Alerts" }
        ] as const).map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main notifications list */}
      <div className="flex-1 min-h-0">
        {filteredNotifs.length === 0 ? (
          <div className="py-20 text-center bg-card/20 border border-white/5 rounded-2xl flex flex-col items-center">
            <Bell className="w-12 h-12 text-muted-foreground/20 mb-4 animate-pulse" />
            <h3 className="font-semibold text-sm mb-1 text-white">All caught up!</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              No notifications logs found for category "{activeFilter}".
            </p>
          </div>
        ) : (
          <div className="bg-card border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {filteredNotifs.map(n => (
              <div
                key={n._id}
                className={`p-4 flex gap-4 transition-colors ${
                  !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5"
                }`}
              >
                {/* Left icon wrapper */}
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  {getIconForType(n.type)}
                </div>

                {/* Main details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <h4 className={`text-xs font-bold truncate ${!n.isRead ? "text-white" : "text-zinc-300"}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markRead(n._id)}
                      className="w-8 h-8 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteNotif(n._id)}
                    className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
