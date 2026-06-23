import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  useListMeetings,
  useGetDashboardStats,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Clock,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  Calendar,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, token } = useAuth();

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  // REST stats and meetings
  const { data: meetings, isLoading: isMeetingsLoading } = useListMeetings();
  const { data: stats } = useGetDashboardStats();

  useEffect(() => {
    if (token && user) {
      // Fetch recent tasks assigned to me
      fetch(`/api/tasks?assignee=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setRecentTasks(data.slice(0, 5));
        })
        .catch((err) => console.error(err));

      // Fetch activity logs
      setIsLoadingActivities(true);
      fetch("/api/users/activity-logs", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setActivityLogs(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoadingActivities(false));
    }
  }, [token, user]);

  // Filters for upcoming meetings
  const upcomingMeetings = useMemo(() => {
    if (!meetings) return [];
    return meetings
      .filter((m: any) => {
        const startTime = new Date(m.startedAt).getTime();
        return startTime > Date.now() && !m.endedAt;
      })
      .slice(0, 4);
  }, [meetings]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">
            Welcome back, {user.name}!
          </h1>
          <p className="text-xs text-zinc-500">
            Here's a quick overview of your workspace meetings, tasks, and team activities.
          </p>
        </div>
      </div>

      {/* Quick Stats Dashboard Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Video className="w-5 h-5 text-primary" />}
          label="Total Meetings"
          value={String(stats?.totalMeetings ?? 0)}
          sub={`${stats?.meetingsThisWeek ?? 0} this week`}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
          label="Time in Meetings"
          value={formatDuration(stats?.totalDurationSeconds ?? 0)}
          sub="total recorded time"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Open Action Items"
          value={String(stats?.openActionItems ?? 0)}
          sub={`${stats?.completedActionItems ?? 0} completed`}
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Completion Rate"
          value={
            (stats?.openActionItems ?? 0) + (stats?.completedActionItems ?? 0) > 0
              ? `${Math.round(
                  ((stats?.completedActionItems ?? 0) /
                    ((stats?.openActionItems ?? 0) + (stats?.completedActionItems ?? 0))) *
                    100
                )}%`
              : "0%"
          }
          sub="action items done"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Upcoming Meetings & Recent Tasks) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Meetings */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Scheduled Meetings
              </h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-xs text-primary px-0 font-bold"
              >
                Go to Meetings Center <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {isMeetingsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50/50 dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl text-xs text-zinc-500 italic shadow-sm">
                  No upcoming meetings scheduled.
                </div>
              ) : (
                upcomingMeetings.map((meeting: any) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-card border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 transition-all px-5 py-4 rounded-xl cursor-pointer gap-4 shadow-sm"
                    onClick={() => setLocation(`/`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">
                          {meeting.title || meeting.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Starts {formatDate(meeting.startedAt)}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" className="h-8 rounded-full text-xs font-bold">
                      View details
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Task History
              </h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => setLocation("/todo-manager")}
                className="text-xs text-primary px-0 font-bold"
              >
                Go to Todo Manager <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50/50 dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl text-xs text-zinc-500 italic shadow-sm">
                  No task history found.
                </div>
              ) : (
                recentTasks.map((task) => {
                  const priorityColor = ( {
                    Low: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
                    Medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                    High: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    Critical: "bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20",
                  } as any )[task.priority || "Medium"];

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between bg-white dark:bg-card border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 px-4 py-3 rounded-xl cursor-pointer gap-4 transition-all shadow-sm"
                      onClick={() => setLocation("/todo-manager")}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate block mt-0.5">
                          {task.description || "No description"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[8px] font-bold ${priorityColor}`}>
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-[8px] font-bold bg-zinc-100 dark:bg-white/5 text-zinc-650 dark:text-zinc-400">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Recent Activity) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Recent Activity Log
          </h3>
          <Card className="bg-white dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl p-4 min-h-[350px] shadow-sm">
            <CardContent className="p-0 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
              {isLoadingActivities ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-zinc-100 dark:bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 italic">
                  No activity logs recorded.
                </div>
              ) : (
                activityLogs.slice(0, 8).map((log) => (
                  <div key={log._id} className="text-xs space-y-1">
                    <div className="flex justify-between items-start font-bold text-zinc-800 dark:text-white/95 leading-none">
                      <span className="truncate max-w-[130px]">{log.actionType?.replace(/_/g, " ").toUpperCase()}</span>
                      <span className="text-[8px] text-zinc-500 font-normal">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal">{log.details}</p>
                    <div className="h-px bg-zinc-100 dark:bg-white/5 pt-1" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 flex flex-col justify-between space-y-2 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white leading-none">{value}</p>
      <p className="text-[9px] text-zinc-500 leading-none">{sub}</p>
    </div>
  );
}
