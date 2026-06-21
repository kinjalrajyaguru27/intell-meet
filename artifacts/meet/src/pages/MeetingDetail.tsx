import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetMeeting,
  useListMeetings,
  useUpsertNotes,
  useCreateActionItem,
  useUpdateActionItem,
  useDeleteActionItem,
  useGenerateAISummary,
  useListAISummaries,
  useListAIDecisions,
  useListAIActionItems,
  useGetAiInsights,
  useAiSummarize,
  useAiExtractActionItems,
  useAiGenerateInsights,
  getListAISummariesQueryKey,
  getListAIActionItemsQueryKey,
  getGetAiInsightsQueryKey,
  getListAIDecisionsQueryKey,
  getGetMeetingQueryKey,
  getListMeetingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIInsightsDashboard } from "@/components/AIInsightsDashboard";
import { DecisionTimeline } from "@/components/DecisionTimeline";
import { FollowUpGenerator } from "@/components/FollowUpGenerator";
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  FileText,
  Video,
  Save,
  Pencil,
  Check,
  X,
  ChevronDown,
  Sparkles,
  Search,
  Brain,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Download,
  Copy,
  History,
  Play,
  RotateCcw,
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
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ActionItemRowProps {
  item: {
    id: string;
    meetingId: string;
    text: string;
    assigneeName: string | null;
    dueDate: string | null;
    isDone: boolean;
    createdAt: string;
  };
  meetingId: string;
}

function ActionItemRow({ item, meetingId }: ActionItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [editAssignee, setEditAssignee] = useState(item.assigneeName ?? "");
  const [editDue, setEditDue] = useState(item.dueDate ?? "");
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdateActionItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
        setEditing(false);
      },
    },
  });
  const deleteMutation = useDeleteActionItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
      },
    },
  });

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const toggle = () => {
    updateMutation.mutate({
      actionItemId: item.id,
      data: { isDone: !item.isDone },
    });
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateMutation.mutate({
      actionItemId: item.id,
      data: {
        text: editText.trim(),
        assigneeName: editAssignee.trim() || null,
        dueDate: editDue || null,
      },
    });
  };

  const cancelEdit = () => {
    setEditText(item.text);
    setEditAssignee(item.assigneeName ?? "");
    setEditDue(item.dueDate ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card border border-primary/40 rounded-xl px-4 py-3 space-y-3">
        <input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
          className="w-full bg-transparent text-sm font-medium outline-none border-b border-border pb-1"
          placeholder="Action item…"
        />
        <div className="flex items-center gap-3">
          <input
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value)}
            className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground"
            placeholder="Assignee (optional)"
          />
          <input
            type="date"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={cancelEdit}>
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs" onClick={saveEdit} disabled={!editText.trim()}>
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
      item.isDone ? "bg-muted/20 border-border/50 opacity-60" : "bg-card border-border"
    }`}>
      <button
        onClick={toggle}
        disabled={updateMutation.isPending}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {item.isDone ? (
          <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
        ) : (
          <Square className="w-4.5 h-4.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${item.isDone ? "line-through text-muted-foreground" : ""}`}>
          {item.text}
        </p>
        {(item.assigneeName || item.dueDate) && (
          <div className="flex items-center gap-3 mt-1">
            {item.assigneeName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {item.assigneeName}
              </span>
            )}
            {item.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {item.dueDate}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => deleteMutation.mutate({ actionItemId: item.id })}
          disabled={deleteMutation.isPending}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  const meetingId = params?.meetingId ?? "";
  const queryClient = useQueryClient();

  const isRecent = meetingId === "recent";

  // If ID is recent, query the list of meetings to find the newest one
  const { data: meetings, isLoading: isListLoading } = useListMeetings({
    query: {
      queryKey: getListMeetingsQueryKey(),
      enabled: isRecent && !!token,
    },
  });

  const { data: meeting, isLoading: isMeetingLoading } = useGetMeeting(
    isRecent ? "" : meetingId,
    {
      query: {
        queryKey: getGetMeetingQueryKey(isRecent ? "" : meetingId),
        enabled: !isRecent && !!meetingId && !!token,
      },
    }
  );

  const isLoading = isRecent ? isListLoading : isMeetingLoading;

  // Sync activeTab state with URL query parameters
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam) {
      if (["summary", "actions", "insights", "decisions", "followup", "transcript"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [window.location.search]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    window.history.pushState(null, "", newUrl);
  };

  // Redirect recent meeting to the actual latest meeting ID
  useEffect(() => {
    if (isRecent && meetings && meetings.length > 0) {
      const sorted = [...meetings].sort(
        (a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      const latest = sorted[0];
      const targetId = latest.id;
      if (targetId) {
        setLocation(`/dashboard/meeting/${targetId}`);
      }
    } else if (isRecent && meetings && meetings.length === 0) {
      setLocation("/dashboard");
    }
  }, [isRecent, meetings, setLocation]);

  if (!isAuthenticated) return null;

  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newItemAssignee, setNewItemAssignee] = useState("");
  const [newItemDue, setNewItemDue] = useState("");
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSummaryType, setSelectedSummaryType] = useState<"Short" | "Detailed" | "Management" | "Client">("Detailed");

  // Version History states
  const [notesVersions, setNotesVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // Recordings playback states
  const [recordings, setRecordings] = useState<any[]>([]);

  // Fetch AI Intelligence Module resources
  const summariesQuery = useListAISummaries({ meetingId });
  const decisionsQuery = useListAIDecisions({ meetingId });
  const aiActionItemsQuery = useListAIActionItems({ meetingId });
  const insightsQuery = useGetAiInsights({ meetingId }, {
    query: {
      queryKey: getGetAiInsightsQueryKey({ meetingId }),
      retry: false,
    }
  });

  // AI mutations
  const summarizeMutation = useAiSummarize({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAISummariesQueryKey({ meetingId }) });
      }
    }
  });

  const extractActionsMutation = useAiExtractActionItems({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAIActionItemsQueryKey({ meetingId }) });
      }
    }
  });

  const generateInsightsMutation = useAiGenerateInsights({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAiInsightsQueryKey({ meetingId }) });
        queryClient.invalidateQueries({ queryKey: getListAIDecisionsQueryKey({ meetingId }) });
      }
    }
  });

  const generateAISummaryMutation = useGenerateAISummary({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
      }
    }
  });

  const isGeneratingAI =
    generateAISummaryMutation.isPending ||
    summarizeMutation.isPending ||
    extractActionsMutation.isPending ||
    generateInsightsMutation.isPending;

  // Notes version history fetcher
  const fetchNotesVersions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotesVersions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Recordings fetcher
  const fetchRecordings = async () => {
    if (!token || !meeting?.roomId) return;
    try {
      const res = await fetch("/api/recordings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((r: any) => r.meetingId === meeting?.roomId);
        setRecordings(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotesVersions();
    }
  }, [token, meetingId]);

  useEffect(() => {
    if (token && meeting?.roomId) {
      fetchRecordings();
    }
  }, [token, meeting?.roomId]);

  const handleRestoreVersion = async (vId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ versionId: vId })
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.content);
        setNotesDirty(false);
        toast({ title: "Notes reverted", description: "Successfully rolled back meeting notes." });
        fetchNotesVersions();
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = async () => {
    try {
      await generateAISummaryMutation.mutateAsync({ meetingId });
      await summarizeMutation.mutateAsync({ data: { meetingId, summaryType: "Detailed" } });
      await summarizeMutation.mutateAsync({ data: { meetingId, summaryType: "Short" } });
      await generateInsightsMutation.mutateAsync({ data: { meetingId } });
      await extractActionsMutation.mutateAsync({ data: { meetingId } });

      toast({
        title: "AI Synthesis Complete",
        description: "All summaries, decisions, action items, and insights have been successfully compiled.",
      });

      queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
      queryClient.invalidateQueries({ queryKey: getListAISummariesQueryKey({ meetingId }) });
      queryClient.invalidateQueries({ queryKey: getListAIDecisionsQueryKey({ meetingId }) });
      queryClient.invalidateQueries({ queryKey: getListAIActionItemsQueryKey({ meetingId }) });
      queryClient.invalidateQueries({ queryKey: getGetAiInsightsQueryKey({ meetingId }) });
    } catch (err: any) {
      toast({
        title: "AI Compilation Failed",
        description: err?.message || "An error occurred during AI intelligence execution.",
        variant: "destructive",
      });
    }
  };

  const handleExportMarkdown = () => {
    if (!meeting) return;

    let mdContent = `# Meeting Report: ${meeting.name}\n\n`;
    mdContent += `## Metadata\n`;
    mdContent += `- **Date:** ${formatDate(meeting.startedAt)}\n`;
    if (meeting.durationSeconds) {
      mdContent += `- **Duration:** ${formatDuration(meeting.durationSeconds)}\n`;
    }
    mdContent += `- **Participants:** ${meeting.participantNames.join(", ") || "None"}\n\n`;

    mdContent += `## Summary & Notes\n`;
    mdContent += `${meeting.notes || "No notes available for this meeting."}\n\n`;

    mdContent += `## Action Items\n`;
    if (meeting.actionItems.length === 0) {
      mdContent += `*No action items recorded.*\n\n`;
    } else {
      meeting.actionItems.forEach((item) => {
        const status = item.isDone ? "[x]" : "[ ]";
        const assignee = item.assigneeName ? ` (Assignee: ${item.assigneeName})` : "";
        const due = item.dueDate ? ` (Due: ${item.dueDate})` : "";
        mdContent += `- ${status} ${item.text}${assignee}${due}\n`;
      });
      mdContent += `\n`;
    }

    mdContent += `## Chronological Transcript\n`;
    if (!meeting.transcript || meeting.transcript.length === 0) {
      mdContent += `*No transcription logs available.*\n`;
    } else {
      meeting.transcript.forEach((line) => {
        const timeStr = new Date(line.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        mdContent += `**[${timeStr}] ${line.speaker}:** _"${line.text}"_\n\n`;
      });
    }

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedFilename = meeting.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.href = url;
    link.setAttribute("download", `meeting_report_${sanitizedFilename}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Report Exported", description: "Meeting details successfully exported as a Markdown document." });
  };

  const handleExportCSVReport = () => {
    if (!meeting) return;
    let csv = "Meeting Name,Date,Duration,Participants\n";
    csv += `"${meeting.name}","${formatDate(meeting.startedAt)}","${formatDuration(meeting.durationSeconds)}","${meeting.participantNames.join(", ")}"\n\n`;
    csv += "Notes/Summary\n";
    csv += `"${(meeting.notes || "").replace(/"/g, '""')}"\n\n`;
    csv += "Kanban Action Items\n";
    csv += "Title,Priority,Assignee,Due Date,Status\n";
    (aiActionItemsQuery.data || []).forEach(item => {
      csv += `"${item.title.replace(/"/g, '""')}","${item.priority}","${item.assigneeName || ""}","${item.dueDate || ""}","${item.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `meeting_report_${meeting.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported", description: "CSV summary exported successfully." });
  };

  // Transcript Operations
  const handleCopyTranscript = () => {
    if (!meeting || !meeting.transcript || meeting.transcript.length === 0) return;
    const text = meeting.transcript.map(line => `[${new Date(line.timestamp).toLocaleTimeString()}] ${line.speaker}: "${line.text}"`).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Transcript copied to clipboard." });
  };

  const handleDownloadTxt = () => {
    if (!meeting || !meeting.transcript || meeting.transcript.length === 0) return;
    const text = meeting.transcript.map(line => `[${new Date(line.timestamp).toLocaleTimeString()}] ${line.speaker}: "${line.text}"`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transcript_${meeting.name.replace(/\s+/g, "_")}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCsvTranscript = () => {
    if (!meeting || !meeting.transcript || meeting.transcript.length === 0) return;
    let csv = "Timestamp,Speaker,Text\n";
    meeting.transcript.forEach(line => {
      const time = new Date(line.timestamp).toLocaleTimeString();
      const speaker = `"${line.speaker.replace(/"/g, '""')}"`;
      const text = `"${line.text.replace(/"/g, '""')}"`;
      csv += `${time},${speaker},${text}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transcript_${meeting.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (meeting?.notes != null && !notesDirty) {
      setNotes(meeting.notes ?? "");
    }
  }, [meeting?.notes, notesDirty]);

  const upsertNotesMutation = useUpsertNotes({
    mutation: {
      onSuccess: () => {
        setNotesDirty(false);
        fetchNotesVersions();
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
      },
    },
  });

  const createItemMutation = useCreateActionItem({
    mutation: {
      onSuccess: () => {
        setNewItemText("");
        setNewItemAssignee("");
        setNewItemDue("");
        setShowNewItemForm(false);
        queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(meetingId) });
      },
    },
  });

  const saveNotes = () => {
    upsertNotesMutation.mutate({ meetingId, data: { content: notes } });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    createItemMutation.mutate({
      meetingId,
      data: {
        text: newItemText.trim(),
        assigneeName: newItemAssignee.trim() || null,
        dueDate: newItemDue || null,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Meeting not found.</p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const openItems = meeting.actionItems.filter((i) => !i.isDone);
  const doneItems = meeting.actionItems.filter((i) => i.isDone);

  const filteredTranscript = (meeting.transcript ?? []).filter(
    (line) =>
      line.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
          
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} className="w-8 h-8 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-semibold text-lg text-zinc-900 dark:text-white truncate max-w-xs md:max-w-md">{meeting.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportMarkdown}
                variant="outline"
                className="h-8 px-4 rounded-full text-xs font-semibold gap-1.5 border-border hover:bg-muted"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </Button>
              <Button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || (meeting.transcript ?? []).length === 0}
                className={`h-8 px-4 rounded-full text-xs font-semibold gap-1.5 transition-all shadow-md ${
                  (meeting.transcript ?? []).length === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isGeneratingAI ? (
                  <>
                    <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                    <span>Compiling AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Generate AI Summary</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {(meeting.transcript ?? []).length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl px-4 py-3 text-xs flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>No speech transcript is available for this meeting. Voice transcription must be active during the call to generate AI summary notes.</span>
            </div>
          )}

          {/* Meeting metadata card */}
          <div className="bg-card border border-border rounded-xl px-6 py-5 mb-6">
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.startedAt)}
              </span>
              {meeting.durationSeconds && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDuration(meeting.durationSeconds)}
                </span>
              )}
              {meeting.participantNames.length > 0 && (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {meeting.participantNames.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Recording Player and Actions (If recorded) */}
          {recordings.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pl-1 flex items-center gap-2">
                <Video className="w-4.5 h-4.5 text-primary" />
                Meeting Recording Playback
              </h2>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-border/80 flex items-center justify-center max-w-2xl mx-auto">
                {/* Embedded HTML5 video player for mp4 file preview */}
                <video
                  src={recordings[0].fileUrl}
                  controls
                  className="w-full h-full object-cover"
                  poster="/static/video-placeholder.png"
                />
              </div>
              <div className="flex justify-between items-center bg-muted/40 p-3 rounded-xl max-w-2xl mx-auto text-xs">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{recordings[0].title}</p>
                  <p className="text-muted-foreground text-[10px]">
                    Size: {recordings[0].sizeBytes ? `${(recordings[0].sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "—"} | Duration: {formatDuration(recordings[0].durationSeconds)}
                  </p>
                </div>
                <a
                  href={recordings[0].fileUrl}
                  download
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4
                </a>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8 bg-muted/30 p-1.5 rounded-xl border border-border/40">
              <TabsTrigger
                value="summary"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <FileText className="w-4 h-4" />
                Summary & Notes
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <CheckSquare className="w-4 h-4" />
                Action Items
                {meeting.actionItems.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {meeting.actionItems.filter(i => !i.isDone).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <Brain className="w-4 h-4" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger
                value="decisions"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Decisions
              </TabsTrigger>
              <TabsTrigger
                value="followup"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <Save className="w-4 h-4" />
                Follow-up & Exports
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="py-2.5 rounded-lg text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all"
              >
                <Users className="w-4 h-4" />
                Original Transcript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Manual/shared notes and version history side-by-side layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Notes Textarea */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2 text-base">
                      <Brain className="w-5 h-5 text-primary animate-pulse" />
                      Meeting Notes
                    </h2>
                    {notesDirty && (
                      <Button
                        size="sm"
                        className="h-8 px-4 rounded-full text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                        onClick={saveNotes}
                        disabled={upsertNotesMutation.isPending}
                      >
                        {upsertNotesMutation.isPending ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save Changes
                      </Button>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesDirty(true);
                    }}
                    onBlur={() => {
                      if (notesDirty) saveNotes();
                    }}
                    rows={12}
                    placeholder="No notes generated yet. Click 'Generate AI Summary' to synthesize transcription logs."
                    className="w-full bg-muted/20 border border-border/80 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/60 focus:bg-card resize-y transition-all placeholder:text-muted-foreground/40 leading-relaxed font-mono"
                  />
                </div>

                {/* Notes Restore History Timeline Checkpoints */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-violet-400" />
                    Version Timeline
                  </h3>
                  <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1">
                    {notesVersions.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic pl-1">No version checkpoints logged</p>
                    ) : (
                      notesVersions.map((v) => (
                        <div
                          key={v._id}
                          onClick={() => setSelectedVersion(v)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            selectedVersion?._id === v._id
                              ? "bg-primary/10 border-primary"
                              : "bg-muted/30 border-border/60 hover:border-zinc-350 dark:hover:border-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-start text-[10px] mb-1">
                            <span className="font-semibold text-zinc-900 dark:text-white">{v.author?.name || "Editor"}</span>
                            <span className="text-muted-foreground font-mono">{new Date(v.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground font-mono truncate">{v.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected version rollback action preview */}
                  {selectedVersion && (
                    <div className="border-t border-border pt-3 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-900 dark:text-white">
                        <span>Preview Selection</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedVersion(null)}
                          className="h-5 px-2 text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/90 font-mono bg-muted/50 p-2 rounded-lg max-h-24 overflow-y-auto leading-normal">
                        {selectedVersion.content}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleRestoreVersion(selectedVersion._id)}
                        className="w-full h-8 text-[11px] rounded-lg gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore to Selected
                      </Button>
                    </div>
                  )}
                </div>

              </div>

              {/* AI Summary Profiles Section */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2 text-base text-zinc-900 dark:text-white">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                      AI Summary Profiles
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Toggle between target summaries compiled by AI</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 bg-muted/20 p-1 rounded-xl border border-border/60">
                    {(["Short", "Detailed", "Management", "Client"] as const).map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={selectedSummaryType === type ? "default" : "ghost"}
                        className={`h-7 rounded-lg text-xs font-semibold px-3 transition-all ${
                          selectedSummaryType === type
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setSelectedSummaryType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const activeSummary = (summariesQuery.data || []).find(
                    (s) => s.summaryType === selectedSummaryType
                  );

                  if (summariesQuery.isLoading || summarizeMutation.isPending) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-xs text-muted-foreground">Compiling summary...</span>
                      </div>
                    );
                  }

                  if (!activeSummary) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/80 rounded-xl bg-card/25">
                        <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm font-medium">
                          No {selectedSummaryType} summary generated yet.
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1 mb-4">
                          Synthesize this meeting into a specialized summary structure.
                        </p>
                        <Button
                          size="sm"
                          className="h-8 rounded-full text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white border-0"
                          onClick={() =>
                            summarizeMutation.mutate({
                              data: { meetingId, summaryType: selectedSummaryType },
                            })
                          }
                        >
                          Generate {selectedSummaryType} Summary
                        </Button>
                      </div>
                    );
                  }

                  const displayMainSummary =
                    selectedSummaryType === "Short"
                      ? activeSummary.shortSummary
                      : selectedSummaryType === "Management"
                      ? activeSummary.executiveSummary
                      : activeSummary.detailedSummary;

                  return (
                    <div className="space-y-6">
                      <div className="prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-foreground/80 leading-relaxed bg-zinc-50 dark:bg-muted/10 p-5 rounded-xl border border-zinc-200 dark:border-white/5 whitespace-pre-wrap">
                        {displayMainSummary}
                      </div>

                      {activeSummary.keyPoints && activeSummary.keyPoints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider pl-1">
                            Key Takeaways & Points
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeSummary.keyPoints.map((pt, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 bg-zinc-50/50 dark:bg-muted/15 p-3 rounded-xl border border-zinc-200 dark:border-white/5 text-xs text-zinc-900 dark:text-white"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Risks */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold uppercase text-red-400 tracking-wider flex items-center gap-1.5 pl-1">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Identified Risks & Blockers
                          </h4>
                          <div className="space-y-2">
                            {activeSummary.risks && activeSummary.risks.length > 0 ? (
                              activeSummary.risks.map((risk, i) => (
                                <div
                                  key={i}
                                  className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-xs text-red-200/90 leading-relaxed"
                                >
                                  {risk}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No major risks identified.</p>
                            )}
                          </div>
                        </div>

                        {/* Opportunities */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 pl-1">
                            <Lightbulb className="w-4 h-4 text-emerald-400" />
                            Growth & Optimization Opportunities
                          </h4>
                          <div className="space-y-2">
                            {activeSummary.opportunities && activeSummary.opportunities.length > 0 ? (
                              activeSummary.opportunities.map((opp, i) => (
                                <div
                                  key={i}
                                  className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-xs text-emerald-200/90 leading-relaxed"
                                >
                                  {opp}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No opportunities extracted.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full text-xs font-semibold text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
                          onClick={() =>
                            summarizeMutation.mutate({
                              data: { meetingId, summaryType: selectedSummaryType },
                            })
                          }
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-400" />
                          Regenerate {selectedSummaryType} Profile
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </section>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              {/* Action items */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold flex items-center gap-2 text-base">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Manual Action Items
                    {meeting.actionItems.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal ml-1 bg-muted px-2 py-0.5 rounded-full">
                        {doneItems.length}/{meeting.actionItems.length} done
                      </span>
                    )}
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 rounded-full text-xs gap-1.5 border-border hover:bg-muted"
                    onClick={() => setShowNewItemForm(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </Button>
                </div>

                {showNewItemForm && (
                  <div className="bg-card border border-primary/30 rounded-xl px-4 py-3 mb-4 space-y-3 shadow-inner">
                    <input
                      autoFocus
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addItem();
                        if (e.key === "Escape") setShowNewItemForm(false);
                      }}
                      className="w-full bg-transparent text-sm font-medium outline-none border-b border-border pb-1"
                      placeholder="Describe the action item…"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        value={newItemAssignee}
                        onChange={(e) => setNewItemAssignee(e.target.value)}
                        className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground border border-transparent focus:border-border"
                        placeholder="Assignee (optional)"
                      />
                      <input
                        type="date"
                        value={newItemDue}
                        onChange={(e) => setNewItemDue(e.target.value)}
                        className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground border border-transparent focus:border-border"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-3 text-xs"
                        onClick={() => {
                          setShowNewItemForm(false);
                          setNewItemText("");
                        }}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={addItem}
                        disabled={!newItemText.trim() || createItemMutation.isPending}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}

                {meeting.actionItems.length === 0 && !showNewItemForm ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/80 rounded-xl">
                    <CheckSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">No action items recorded.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add tasks manually or run AI synthesis above.</p>
                    <button
                      onClick={() => setShowNewItemForm(true)}
                      className="text-primary text-sm mt-3 hover:underline font-semibold"
                    >
                      Add the first task
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openItems.map((item) => (
                      <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
                    ))}
                    {doneItems.length > 0 && (
                      <details className="group mt-4">
                        <summary className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none py-2 hover:text-foreground transition-colors list-none">
                          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                          {doneItems.length} Completed Task{doneItems.length !== 1 ? "s" : ""}
                        </summary>
                        <div className="space-y-2 mt-2 pl-1">
                          {doneItems.map((item) => (
                            <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </section>

              {/* AI-Extracted Action Items (Kanban Synced) */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-4">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2 text-base text-zinc-900 dark:text-white">
                      <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                      AI Action Items (Kanban Board Synced)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically extracted tasks synced live with the platform's Kanban board
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 rounded-full text-xs gap-1.5 border-border hover:bg-muted"
                    onClick={() => extractActionsMutation.mutate({ data: { meetingId } })}
                    disabled={extractActionsMutation.isPending}
                  >
                    {extractActionsMutation.isPending ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Re-extract Tasks
                  </Button>
                </div>

                {aiActionItemsQuery.isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : !aiActionItemsQuery.data || aiActionItemsQuery.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/80 rounded-xl bg-card/25">
                    <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">No Kanban synced action items found.</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Run the AI Meeting Intelligence processor to extract tasks.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiActionItemsQuery.data.map((item) => (
                      <div
                        key={item.id}
                        className="bg-zinc-50/50 dark:bg-muted/10 border border-zinc-200 dark:border-border/60 hover:border-zinc-300 dark:hover:border-white/10 transition-colors p-4 rounded-xl space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">{item.title}</h3>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                              item.priority === "High"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : item.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-3 text-xs flex-wrap gap-2">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            {item.assigneeName && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-violet-400" />
                                {item.assigneeName}
                              </span>
                            )}
                            {item.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {item.dueDate}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                              item.status === "Done"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : item.status === "In Progress"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-neutral-500/15 text-neutral-400 border-neutral-500/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <AIInsightsDashboard insight={insightsQuery.data || null} />
            </TabsContent>

            <TabsContent value="decisions" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="border-b border-border/40 pb-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2 text-base text-zinc-900 dark:text-white">
                      <TrendingUp className="w-5 h-5 text-violet-400" />
                      Critical Decisions Tracker
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Chronological log of critical path choices resolved during call dialogue
                    </p>
                  </div>
                </div>
                <DecisionTimeline decisions={decisionsQuery.data || []} />
              </div>
            </TabsContent>

            <TabsContent value="followup" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="border-b border-border/40 pb-4 flex items-center justify-between items-center flex-wrap gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2 text-base text-zinc-900 dark:text-white">
                      <Save className="w-5 h-5 text-violet-400" />
                      Follow-up recaps & exports
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate recaps and download document formats for external distribution
                    </p>
                  </div>
                  {/* Export Center Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportCSVReport}
                      className="text-xs h-8 rounded-full border-border hover:bg-muted"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Export CSV Summary
                    </Button>
                  </div>
                </div>
                {meeting && (
                  <FollowUpGenerator
                    meeting={{
                      name: meeting.name,
                      startedAt: meeting.startedAt,
                      durationSeconds: meeting.durationSeconds,
                      participantNames: meeting.participantNames,
                      notes: meeting.notes,
                      actionItems: (aiActionItemsQuery.data || []).map(i => ({
                        text: i.title,
                        assigneeName: i.assigneeName,
                        dueDate: i.dueDate ?? null,
                        isDone: i.status === "Done"
                      }))
                    }}
                    decisions={decisionsQuery.data || []}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-6">
              {/* Transcript Search and Bubbles */}
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2 text-base">
                      <Users className="w-5 h-5 text-primary" />
                      Meeting Transcription Logs
                    </h2>
                  </div>
                  
                  {/* Copy and Export action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyTranscript}
                      className="text-xs gap-1 h-8 rounded-full border-border hover:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Dialogue</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadTxt}
                      className="text-xs gap-1 h-8 rounded-full border-border hover:bg-muted"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>TXT</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadCsvTranscript}
                      className="text-xs gap-1 h-8 rounded-full border-border hover:bg-muted"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </Button>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transcript by speaker or dialogue keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:bg-card transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                {filteredTranscript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/80 rounded-xl">
                    <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">
                      {searchTerm ? "No matching dialogues found." : "No speech records available."}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {searchTerm ? "Try searching for a different word or speaker." : "Speech recognition must be running during the room call to capture logs."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredTranscript.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20">
                          {line.speaker.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-bold text-foreground/90">{line.speaker}</span>
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-2 py-0.5 rounded">
                              {new Date(line.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/85 leading-relaxed font-sans italic">
                            "{line.text}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
    </div>
  );
}
