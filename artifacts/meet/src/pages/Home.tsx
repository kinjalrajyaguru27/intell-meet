import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateRoom, useListMeetings, useCreateMeeting } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Video, Keyboard, Plus, Activity, Calendar, Clock,
  Users, Trash2, ShieldAlert, MonitorPlay, Search, ChevronRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type MeetingFilter = "all" | "active" | "scheduled" | "ended" | "recordings";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Schedule Meeting states
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);

  const createRoom = useCreateRoom();
  const createMeetingMutation = useCreateMeeting();
  const { data: meetings, isLoading, refetch: refetchMeetings } = useListMeetings();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated || !user) return null;

  const joinForm = useForm({
    defaultValues: {
      roomId: "",
    },
  });

  const handleCreateRoom = () => {
    createRoom.mutate(
      { data: { name: "Instant Meeting" } },
      {
        onSuccess: (room) => {
          toast({ title: "Meeting Created", description: "Entering your instant video room..." });
          setLocation(`/room/${room.id}`);
        },
      }
    );
  };

  const handleScheduleMeeting = () => {
    if (!scheduleTitle.trim() || !scheduleTime) {
      toast({ title: "Validation Error", description: "Please enter a meeting title and date/time.", variant: "destructive" });
      return;
    }

    createMeetingMutation.mutate(
      {
        data: {
          title: scheduleTitle,
          description: scheduleDesc,
          startTime: new Date(scheduleTime).toISOString(),
          waitingRoomEnabled,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Video conference scheduled and loaded." });
          setIsScheduleOpen(false);
          setScheduleTitle("");
          setScheduleDesc("");
          setScheduleTime("");
          refetchMeetings();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to schedule meeting.", variant: "destructive" });
        }
      }
    );
  };

  const onJoin = (data: { roomId: string }) => {
    if (data.roomId.trim()) {
      setLocation(`/room/${data.roomId.trim()}`);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Record Deleted", description: "The meeting logs were removed from history." });
        refetchMeetings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper date formatting functions
  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "just now";
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Filter meetings list
  const getFilteredMeetings = () => {
    if (!meetings) return [];
    return meetings.filter((meeting: any) => {
      const title = meeting.title || meeting.name || "";
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const st = new Date(meeting.startedAt);
      const isUpcoming = st.getTime() > Date.now();
      const isPast = !!meeting.endedAt;

      if (meetingFilter === "active") return !isPast && !isUpcoming;
      if (meetingFilter === "scheduled") return isUpcoming;
      if (meetingFilter === "ended") return isPast;
      if (meetingFilter === "recordings") return isPast && meeting.recordingId; // Mapped when recording exists
      return true;
    });
  };

  const filteredMeetings = getFilteredMeetings();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">Meetings Center</h1>
        </div>
      </div>

      {/* Hero Control Panel (Quick actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">Instant Video Conference</h2>
            <p className="text-xs text-muted-foreground">Start an immediate workspace sync or join an ongoing call.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCreateRoom}
              className="rounded-full px-6 h-11 text-xs font-bold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shrink-0"
              disabled={createRoom.isPending}
            >
              {createRoom.isPending ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Start Instant Meeting
                </>
              )}
            </Button>

            <form onSubmit={joinForm.handleSubmit(onJoin)} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  {...joinForm.register("roomId")}
                  placeholder="Enter room code"
                  className="pl-9 h-11 bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-full text-xs placeholder:text-zinc-500 text-foreground dark:text-white w-full"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-11 rounded-full px-5 text-xs font-semibold shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                Join Call
              </Button>
            </form>
          </div>
        </div>

        {/* Schedule Dialog Launcher */}
        <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-white/5 pt-6 lg:pt-0 lg:pl-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">Schedule Upcoming Meeting</h2>
            <p className="text-xs text-muted-foreground">Pre-arrange conferences, enable lobbies, and send calendars invitations.</p>
          </div>

          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full h-11 text-xs font-bold gap-2 border-zinc-250 dark:border-white/10 text-foreground dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-white/5 w-fit">
                <Calendar className="w-4 h-4" />
                Schedule Video Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Video Conference</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Sprint Sync, Demo Review"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Input
                    id="desc"
                    placeholder="Provide agenda details"
                    value={scheduleDesc}
                    onChange={(e) => setScheduleDesc(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="time">Date & Time</Label>
                    <Input
                      id="time"
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="waiting-room" className="text-xs cursor-pointer text-zinc-300">Enable Lobbies</Label>
                      <Switch
                        id="waiting-room"
                        checked={waitingRoomEnabled}
                        onCheckedChange={setWaitingRoomEnabled}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleScheduleMeeting} className="rounded-full font-bold px-6 text-xs" disabled={createMeetingMutation.isPending}>
                    Schedule Session
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* sub-tabs and search row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-2">
        <div className="flex bg-zinc-100/80 dark:bg-muted/20 border border-zinc-200 dark:border-white/5 rounded-lg p-1 text-xs w-fit">
          {([
            { value: "all", label: "All Logs" },
            { value: "active", label: "Ongoing" },
            { value: "scheduled", label: "Scheduled" },
            { value: "ended", label: "Past Calls" },
            { value: "recordings", label: "Recordings Only" }
          ] as const).map(tab => (
            <button
              key={tab.value}
              onClick={() => setMeetingFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md transition-colors font-semibold ${
                meetingFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search meetings by agenda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-lg placeholder-zinc-500 text-foreground dark:text-white focus-visible:ring-primary focus-visible:ring-offset-0 h-8.5"
          />
        </div>
      </div>

      {/* Meetings rendering list */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-card border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl flex flex-col items-center shadow-sm">
            <Video className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-white font-sans">No Meetings Found</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              No matches found for category "{meetingFilter}".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting: any) => {
              const title = meeting.title || meeting.name || "Untitled Sync";
              const st = new Date(meeting.startedAt);
              const isUpcoming = st.getTime() > Date.now();
              const isPast = !!meeting.endedAt;

              return (
                <div
                  key={meeting.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 hover:border-zinc-300 dark:hover:border-primary/30 transition-all gap-4 group shadow-sm"
                >
                  <div
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setLocation(`/dashboard/meeting/${meeting.id}`)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5 ${
                      isPast ? "bg-zinc-100 dark:bg-white/5 text-zinc-500" : "bg-primary/10 text-primary"
                    }`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold truncate text-sm text-zinc-900 dark:text-white">{title}</span>
                        {meeting.openActionItemCount > 0 && (
                          <Badge variant="outline" className="shrink-0 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold px-2 py-0">
                            {meeting.openActionItemCount} Tasks
                          </Badge>
                        )}
                        {meeting.hasNotes && (
                          <Badge variant="outline" className="shrink-0 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold px-2 py-0">
                            Notes
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          {isUpcoming ? formatDate(meeting.startedAt) : timeAgo(meeting.startedAt)}
                        </span>
                        {meeting.durationSeconds && (
                          <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                            {formatDuration(meeting.durationSeconds)}
                          </span>
                        )}
                        {meeting.participantNames && meeting.participantNames.length > 0 && (
                          <span className="flex items-center gap-1 truncate max-w-[200px] text-zinc-500 dark:text-zinc-400">
                            <Users className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                            {meeting.participantNames.slice(0, 2).join(", ")}
                            {meeting.participantNames.length > 2 && ` +${meeting.participantNames.length - 2}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="flex gap-2 items-center justify-end shrink-0">
                    {!isPast && (
                      <Button
                        size="sm"
                        className="rounded-full px-5 text-xs h-8 font-bold"
                        onClick={() => setLocation(`/room/${meeting.roomId}`)}
                      >
                        Join Room
                      </Button>
                    )}
                    {isPast && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                        onClick={() => setLocation(`/dashboard/meeting/${meeting.id}`)}
                      >
                        View Summary
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 rounded-full text-rose-500 hover:bg-rose-500/10"
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
