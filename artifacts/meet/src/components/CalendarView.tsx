import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, Video, CheckSquare, Flag, Users,
  Calendar as CalendarIcon, Clock, Sparkles, Building2, FolderKanban,
  Copy, ExternalLink, User, Check, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarViewProps {
  token: string | null;
  selectedOrgId?: string;
  selectedProjectId?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  type: "meeting" | "task" | "milestone";
  colorStyle: string;
  original: any;
}

export default function CalendarView({ token, selectedOrgId, selectedProjectId }: CalendarViewProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");

  // Modal details state for inspecting a clicked meeting
  const [activeMeetingModal, setActiveMeetingModal] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [selectedOrgId, selectedProjectId, currentDate]);

  const fetchEvents = async () => {
    if (!token) return;

    try {
      const fetchedEvents: CalendarEvent[] = [];

      // 1. Fetch meetings filtered by org/project scope
      const params = new URLSearchParams();
      if (selectedOrgId) params.append("organizationId", selectedOrgId);
      if (selectedProjectId) params.append("projectId", selectedProjectId);

      const meetingsUrl = params.toString() ? `/api/meetings?${params.toString()}` : "/api/meetings";
      const meetingsRes = await fetch(meetingsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meetingsRes.ok) {
        const meetings = await meetingsRes.json();
        meetings.forEach((m: any) => {
          const rawDate = m.startTime || m.startedAt;
          if (rawDate) {
            const dateStr = rawDate.split("T")[0];
            fetchedEvents.push({
              id: `m-${m.id || m._id}`,
              title: m.title || m.name,
              dateStr,
              type: "meeting",
              colorStyle: "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer",
              original: m
            });
          }
        });
      }

      // 2. Fetch tasks for current project scope
      if (selectedProjectId) {
        const tasksRes = await fetch(`/api/tasks?projectId=${selectedProjectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          tasks.forEach((t: any) => {
            if (t.dueDate) {
              const dateStr = t.dueDate;
              fetchedEvents.push({
                id: `t-${t.id}`,
                title: t.title,
                dateStr,
                type: "task",
                colorStyle: "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
                original: t
              });
            }
          });
        }

        // 3. Fetch milestones
        const milestonesRes = await fetch(`/api/projects/${selectedProjectId}/milestones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (milestonesRes.ok) {
          const milestones = await milestonesRes.json();
          milestones.forEach((ms: any) => {
            if (ms.dueDate) {
              const dateStr = ms.dueDate.split("T")[0];
              fetchedEvents.push({
                id: `ms-${ms.id || ms._id}`,
                title: ms.title,
                dateStr,
                type: "milestone",
                colorStyle: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
                original: ms
              });
            }
          });
        }
      }

      setEvents(fetchedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to generate monthly days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Days count

    const days = [];
    
    // Fill previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Fill next month padding
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = getDaysInMonth();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDayStr(date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    setSelectedDayEvents(dayEvents);
  };

  const handleEventClick = (e: React.MouseEvent, calendarEvent: CalendarEvent) => {
    e.stopPropagation();
    if (calendarEvent.type === "meeting") {
      setActiveMeetingModal(calendarEvent.original);
    }
  };

  const copyMeetingLink = (roomId: string) => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({ title: "Link Copied", description: "Meeting room link copied to clipboard!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoinMeeting = (roomId: string) => {
    setActiveMeetingModal(null);
    setLocation(`/room/${roomId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Calendar Grid Card */}
      <Card className="lg:col-span-3 bg-white dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary shrink-0" />
              {currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            
            <Button
              size="sm"
              variant="outline"
              onClick={resetToToday}
              className="h-7 px-2.5 text-[11px] font-bold border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Type Filter Badges Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Meetings
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Tasks
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Milestones
              </div>
            </div>

            <div className="flex gap-1.5">
              <Button size="icon" variant="outline" onClick={prevMonth} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={nextMonth} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 text-center py-3 font-bold text-[11px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-100/70 dark:bg-zinc-900/90">
            {weekdays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900/40">
            {calendarDays.map((slot, index) => {
              const dayStr = slot.date.toISOString().split("T")[0];
              const dayEvents = events.filter((e) => e.dateStr === dayStr);
              
              const isToday = slot.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(slot.date, dayEvents)}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer relative group ${
                    slot.isCurrentMonth ? "bg-white dark:bg-zinc-900/40" : "bg-slate-50/50 dark:bg-zinc-950/40 opacity-40"
                  } ${isToday ? "bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-primary/40 ring-inset" : ""}`}
                >
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white"
                    }`}>
                      {slot.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-full font-bold shadow-2xs border border-slate-200 dark:border-zinc-700">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List */}
                  <div className="flex-1 overflow-hidden space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        onClick={(ev) => handleEventClick(ev, e)}
                        className={`text-[10px] font-semibold border px-2 py-0.5 rounded-md truncate leading-tight flex items-center gap-1.5 shadow-2xs ${e.colorStyle}`}
                        title={`${e.title} (Click to inspect details)`}
                      >
                        {e.type === "meeting" && <Video className="w-3 h-3 shrink-0" />}
                        {e.type === "task" && <CheckSquare className="w-3 h-3 shrink-0" />}
                        {e.type === "milestone" && <Flag className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold pl-1">
                        +{dayEvents.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Side Details Panel */}
      <Card className="bg-white dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
          <CardTitle className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Day Schedule & Inspector
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 flex-1 space-y-4">
          {selectedDayEvents === null ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 dark:text-zinc-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                <CalendarIcon className="w-6 h-6 text-slate-400 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Date Selected</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                  Click on any day in the calendar grid to inspect tasks and scheduled meetings.
                </p>
              </div>
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Badge variant="outline" className="text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-3 py-1 border-slate-200 dark:border-zinc-700">
                {selectedDayStr}
              </Badge>
              <div className="text-slate-400 dark:text-zinc-500 text-xs font-medium pt-4">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-zinc-600" />
                No meetings or tasks scheduled for this day.
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-2.5 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">{selectedDayStr}</span>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {selectedDayEvents.length} Items
                </span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {selectedDayEvents.map((e) => {
                  const icons = {
                    meeting: <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
                    task: <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
                    milestone: <Flag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  };

                  const typeLabel = {
                    meeting: "Meeting",
                    task: "Task Issue",
                    milestone: "Milestone"
                  };

                  const badgeStyles = {
                    meeting: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
                    task: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
                    milestone: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  };

                  return (
                    <div
                      key={e.id}
                      onClick={(ev) => handleEventClick(ev, e)}
                      className={`p-3.5 bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 rounded-xl space-y-2 text-left hover:border-slate-300 dark:hover:border-zinc-600 transition-all shadow-2xs ${
                        e.type === "meeting" ? "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {icons[e.type]}
                          <Badge variant="outline" className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md ${badgeStyles[e.type]}`}>
                            {typeLabel[e.type]}
                          </Badge>
                        </div>
                        {e.type === "meeting" && (
                          <span className="text-[10px] text-primary font-bold hover:underline">
                            Details &rarr;
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                        {e.title}
                      </h4>

                      {e.type === "meeting" && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between gap-1.5 font-medium pt-1 border-t border-slate-200/60 dark:border-zinc-700/50">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{e.original.participantNames?.length || 0} participants</span>
                          </div>
                          {e.original.status && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                              {e.original.status}
                            </span>
                          )}
                        </div>
                      )}

                      {e.type === "task" && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold pt-1 border-t border-slate-200/60 dark:border-zinc-700/50">
                          <span>Priority: <span className="text-slate-800 dark:text-zinc-200">{e.original.priority || "Normal"}</span></span>
                          <span>Assignee: <span className="text-slate-800 dark:text-zinc-200">{e.original.assignee?.name || "Unassigned"}</span></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Full Details Modal */}
      {activeMeetingModal && (
        <Dialog open={!!activeMeetingModal} onOpenChange={(open) => !open && setActiveMeetingModal(null)}>
          <DialogContent className="sm:max-w-[540px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
            <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md">
                  Meeting Conference
                </Badge>
                {activeMeetingModal.status && (
                  <Badge variant="outline" className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md ${
                    activeMeetingModal.status === "active"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                      : activeMeetingModal.status === "ended"
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                  }`}>
                    {activeMeetingModal.status}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                {activeMeetingModal.title || activeMeetingModal.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                Scheduled room details, participants & access controls
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Room Code & Copy Pill */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Room ID Code</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {activeMeetingModal.roomId || activeMeetingModal.meetingId}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyMeetingLink(activeMeetingModal.roomId || activeMeetingModal.meetingId)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copied" : "Copy Link"}
                </Button>
              </div>

              {/* Time & Host Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> Start Date & Time
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    {new Date(activeMeetingModal.startTime || activeMeetingModal.startedAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                    })}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" /> Organizer / Host
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                    {activeMeetingModal.host?.name || "Workspace Host"}
                  </span>
                </div>
              </div>

              {/* Description / Agenda */}
              {activeMeetingModal.description && (
                <div className="space-y-1 bg-slate-50/60 dark:bg-zinc-800/30 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Agenda & Notes</span>
                  <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {activeMeetingModal.description}
                  </p>
                </div>
              )}

              {/* Participants */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Users className="w-3 h-3 text-primary" /> Participants ({activeMeetingModal.participantNames?.length || 0})
                </span>
                {activeMeetingModal.participantNames && activeMeetingModal.participantNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeMeetingModal.participantNames.map((pName: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        {pName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">No attendees recorded yet.</p>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex justify-between items-center">
              <Button variant="ghost" onClick={() => setActiveMeetingModal(null)} className="rounded-xl text-xs">
                Close
              </Button>

              <Button
                onClick={() => handleJoinMeeting(activeMeetingModal.roomId || activeMeetingModal.meetingId)}
                className="rounded-xl font-bold px-5 text-xs gap-1.5 shadow-sm"
              >
                <Video className="w-4 h-4" />
                Join Video Conference
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
