import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Video,
  Search,
  Calendar,
  Clock,
  Users,
  Download,
  Trash2,
  FileText,
  Play,
  Brain,
  ListFilter,
  CheckCircle,
  Award,
  Loader2,
} from "lucide-react";

export default function PostMeeting() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "recordings" | "actions">("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Only completed meetings
        const ended = data.filter((m: any) => m.endedAt);
        setMeetings(ended);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this meeting record?")) return;

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Record Deleted", description: "The meeting logs were removed from history." });
        fetchMeetings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client-side report exporter
  const handleExportMeetingReport = async (meeting: any, format: "JSON" | "CSV") => {
    try {
      // Fetch summaries & decisions to compile
      const sumRes = await fetch(`/api/ai/summaries?meetingId=${meeting.id || meeting._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const decRes = await fetch(`/api/ai/decisions?meetingId=${meeting.id || meeting._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const summaries = sumRes.ok ? await sumRes.json() : [];
      const decisions = decRes.ok ? await decRes.json() : [];

      const summaryText = summaries.length > 0 ? summaries[0].shortSummary : "No summary";
      const keyPoints = summaries.length > 0 ? (summaries[0].keyPoints || []).join("; ") : "";
      const decisionsText = decisions.map((d: any) => d.decision).join("; ");

      let content = "";
      let filename = `${meeting.title || "meeting"}-report`;
      let mimeType = "";

      if (format === "JSON") {
        content = JSON.stringify({
          meeting: {
            title: meeting.title || meeting.name,
            startTime: meeting.startTime,
            durationSeconds: meeting.durationSeconds,
            participants: meeting.participantNames,
          },
          summary: summaries[0] || null,
          decisions,
        }, null, 2);
        filename += ".json";
        mimeType = "application/json";
      } else {
        // CSV format
        content = `"Meeting Title","Start Time","Duration (s)","Participants","AI Summary","Key Points","Decisions"\n`;
        content += `"${meeting.title || meeting.name}","${meeting.startTime}","${meeting.durationSeconds || 0}","${(meeting.participantNames || []).join(", ")}","${summaryText}","${keyPoints}","${decisionsText}"\n`;
        filename += ".csv";
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Report Exported", description: `Downloaded ${filename} successfully.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const filteredMeetings = meetings.filter((m) => {
    const title = m.title || m.name || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "recordings") return !!m.recordingId;
    if (filterType === "actions") return m.openActionItemCount > 0;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">Post-Meeting Dashboard</h1>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search past meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-xs h-9 text-foreground dark:text-white"
          />
        </div>

        <div className="flex bg-zinc-100 dark:bg-muted/20 border border-zinc-200 dark:border-white/5 rounded-lg p-1 text-xs w-fit">
          {([
            { value: "all", label: "All Sessions" },
            { value: "recordings", label: "Recordings Available" },
            { value: "actions", label: "With Action Items" },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
                filterType === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading session records...</span>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-card/20 border border-zinc-200 dark:border-white/5 rounded-2xl flex flex-col items-center shadow-sm">
          <Video className="w-12 h-12 text-zinc-400 dark:text-zinc-700/50 mb-4 animate-pulse" />
          <h3 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-white">No Post-Meetings Found</h3>
          <p className="text-xs text-zinc-500 max-w-xs">
            No past sessions matched the category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => {
            const title = meeting.title || meeting.name || "Workspace Sync";

            return (
              <Card
                key={meeting.id || meeting._id}
                onClick={() => setLocation(`/dashboard/meeting/${meeting.id || meeting._id}`)}
                className="bg-white dark:bg-card border border-zinc-200 dark:border-white/5 hover:border-zinc-350 dark:hover:border-white/15 transition-all p-5 flex flex-col justify-between cursor-pointer space-y-4 hover:scale-[1.01] shadow-sm hover:shadow-md group relative overflow-hidden"
              >
                {/* Header title */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-primary transition-colors truncate max-w-[80%]">
                      {title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteMeeting(meeting.id || meeting._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-500 rounded shrink-0 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{formatDate(meeting.startedAt)}</span>
                  </div>
                </div>

                {/* Details / Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {meeting.openActionItemCount > 0 && (
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2 py-0 font-semibold">
                      {meeting.openActionItemCount} Open Tasks
                    </Badge>
                  )}
                  {meeting.hasNotes && (
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0 font-semibold">
                      AI Summary Generated
                    </Badge>
                  )}
                  {meeting.recordingId && (
                    <Badge variant="outline" className="text-[9px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 px-2 py-0 font-semibold">
                      Recording Shared
                    </Badge>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {formatDuration(meeting.durationSeconds)}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px] px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      onClick={() => handleExportMeetingReport(meeting, "CSV")}
                    >
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px] px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      onClick={() => handleExportMeetingReport(meeting, "JSON")}
                    >
                      Export JSON
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
