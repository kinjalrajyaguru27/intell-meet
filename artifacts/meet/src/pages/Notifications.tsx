import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, Trash2, MessageSquare, Calendar, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotifFilter = "all" | "mentions" | "tasks" | "meetings";

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
      const typeLower = (n.type || "").toLowerCase();
      const titleLower = (n.title || "").toLowerCase();
      const contentLower = (n.content || "").toLowerCase();

      if (activeFilter === "all") return true;

      if (activeFilter === "mentions") {
        return (
          typeLower === "mention" ||
          titleLower.includes("organization") ||
          titleLower.includes("project") ||
          titleLower.includes("mention") ||
          titleLower.includes("added") ||
          contentLower.includes("added") ||
          contentLower.includes("organization") ||
          contentLower.includes("project")
        );
      }

      if (activeFilter === "tasks") {
        return (
          typeLower === "task_assignment" ||
          typeLower === "task" ||
          titleLower.includes("task") ||
          contentLower.includes("task")
        );
      }

      if (activeFilter === "meetings") {
        return (
          typeLower === "meeting_reminder" ||
          typeLower === "meeting" ||
          titleLower.includes("meet") ||
          titleLower.includes("conference") ||
          contentLower.includes("meet")
        );
      }

      return false;
    });
  };

  const getIconForType = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "mention" || t.includes("mention") || t.includes("org") || t.includes("project")) {
      return <MessageSquare className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
    }
    if (t === "task_assignment" || t === "task" || t.includes("task")) {
      return <ShieldAlert className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    }
    if (t === "meeting_reminder" || t === "meeting" || t.includes("meet")) {
      return <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
    return <Bell className="w-4 h-4 text-slate-400" />;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifs = getFilteredNotifications();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Notifications Center</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full text-[10px] font-bold px-2.5 py-0.5">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs Selection row (Only 3 categories: Mentions, Tasks, Meetings + All Alerts) */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto pb-px">
        {([
          { value: "all", label: "All Alerts" },
          { value: "mentions", label: "Mentions" },
          { value: "tasks", label: "Tasks" },
          { value: "meetings", label: "Meetings" }
        ] as const).map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main notifications list */}
      <div className="flex-1 min-h-0">
        {filteredNotifs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center shadow-xs space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-2">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
              No notification logs found for category "{activeFilter}".
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800/80 overflow-hidden shadow-xs">
            {filteredNotifs.map(n => (
              <div
                key={n._id}
                className={`p-4 flex gap-4 items-start transition-colors ${
                  !n.isRead ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30" : "hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                }`}
              >
                {/* Left icon wrapper */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs">
                  {getIconForType(n.type)}
                </div>

                {/* Main details */}
                <div className="flex-1 min-w-0 space-y-1 text-left">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className={`text-xs font-bold truncate ${!n.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400"}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">{n.content}</p>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markRead(n._id)}
                      className="w-8 h-8 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteNotif(n._id)}
                    className="w-8 h-8 rounded-lg text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete notification"
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
