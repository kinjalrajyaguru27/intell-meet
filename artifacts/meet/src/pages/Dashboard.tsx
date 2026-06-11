import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListMeetings,
  useGetDashboardStats,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Video,
  Clock,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  FileText,
  BarChart2,
  Square,
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
  const { data: meetings, isLoading } = useListMeetings();
  const { data: stats } = useGetDashboardStats();
  const [filter, setFilter] = useState<"all" | "with-notes" | "open-items">("all");

  const filtered = (meetings ?? []).filter((m) => {
    if (filter === "with-notes") return m.hasNotes;
    if (filter === "open-items") return m.openActionItemCount > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-semibold text-base">Meeting Dashboard</h1>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4"
          onClick={() => setLocation("/")}
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={<Video className="w-5 h-5 text-primary" />}
              label="Total Meetings"
              value={String(stats?.totalMeetings ?? 0)}
              sub={`${stats?.meetingsThisWeek ?? 0} this week`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-cyan-400" />}
              label="Time in Meetings"
              value={formatDuration(stats?.totalDurationSeconds ?? 0)}
              sub="total recorded time"
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
              label="Open Action Items"
              value={String(stats?.openActionItems ?? 0)}
              sub={`${stats?.completedActionItems ?? 0} completed`}
            />
            <StatCard
              icon={<CheckSquare className="w-5 h-5 text-emerald-400" />}
              label="Completion Rate"
              value={
                (stats?.openActionItems ?? 0) + (stats?.completedActionItems ?? 0) > 0
                  ? `${Math.round(((stats?.completedActionItems ?? 0) / ((stats?.openActionItems ?? 0) + (stats?.completedActionItems ?? 0))) * 100)}%`
                  : "—"
              }
              sub="action items done"
            />
          </div>

          {/* Meetings list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Meeting History
              </h2>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(["all", "with-notes", "open-items"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${
                      filter === f
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "All" : f === "with-notes" ? "Has Notes" : "Open Items"}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filter={filter} onNewMeeting={() => setLocation("/")} />
            ) : (
              <div className="space-y-3">
                {filtered.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => setLocation(`/dashboard/meeting/${meeting.id}`)}
                    className="w-full text-left bg-card border border-border hover:border-primary/40 hover:bg-card/80 rounded-xl px-5 py-4 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{meeting.name}</span>
                          {meeting.openActionItemCount > 0 && (
                            <span className="shrink-0 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              {meeting.openActionItemCount} open
                            </span>
                          )}
                          {meeting.hasNotes && (
                            <span className="shrink-0 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Notes
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {timeAgo(meeting.startedAt)}
                          </span>
                          {meeting.durationSeconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(meeting.durationSeconds)}
                            </span>
                          )}
                          {meeting.participantNames.length > 0 && (
                            <span className="flex items-center gap-1 truncate">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              {meeting.participantNames.slice(0, 3).join(", ")}
                              {meeting.participantNames.length > 3 && ` +${meeting.participantNames.length - 3}`}
                            </span>
                          )}
                          {meeting.actionItemCount > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5" />
                              {meeting.actionItemCount} action {meeting.actionItemCount === 1 ? "item" : "items"}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
    <div className="bg-card border border-border rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function EmptyState({
  filter,
  onNewMeeting,
}: {
  filter: string;
  onNewMeeting: () => void;
}) {
  if (filter !== "all") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm">No meetings match this filter.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Video className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No meetings yet</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Start a meeting and your history will appear here after the call ends.
      </p>
      <Button onClick={onNewMeeting} className="rounded-full px-6">
        <Plus className="w-4 h-4 mr-2" />
        Start a Meeting
      </Button>
    </div>
  );
}
