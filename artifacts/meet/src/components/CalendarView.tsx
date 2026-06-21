import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Video, CheckSquare, Flag, Users } from "lucide-react";

interface CalendarViewProps {
  token: string | null;
  selectedProjectId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  type: "meeting" | "task" | "milestone";
  color: string;
  original: any;
}

export default function CalendarView({ token, selectedProjectId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [selectedProjectId, currentDate]);

  const fetchEvents = async () => {
    if (!token) return;

    try {
      const fetchedEvents: CalendarEvent[] = [];

      // 1. Fetch meetings
      const meetingsRes = await fetch("/api/meetings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meetingsRes.ok) {
        const meetings = await meetingsRes.json();
        meetings.forEach((m: any) => {
          const dateStr = m.startedAt.split("T")[0];
          fetchedEvents.push({
            id: `m-${m.id}`,
            title: m.title || m.name,
            dateStr,
            type: "meeting",
            color: "bg-blue-500/15 border-blue-500/30 text-blue-400",
            original: m
          });
        });
      }

      // 2. Fetch tasks
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
                color: "bg-amber-500/15 border-amber-500/30 text-amber-400",
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
            const dateStr = ms.dueDate.split("T")[0];
            fetchedEvents.push({
              id: `ms-${ms.id || ms._id}`,
              title: ms.title,
              dateStr,
              type: "milestone",
              color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
              original: ms
            });
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

  // Helper to generate monthly days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Days count

    // Days array
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
    const formatted = date.toISOString().split("T")[0];
    setSelectedDayStr(date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    setSelectedDayEvents(dayEvents);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar Grid side */}
      <Card className="lg:col-span-3 bg-card/25 border-white/5 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-white/5">
          <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
            {currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
          <div className="flex gap-1.5">
            <Button size="icon" variant="outline" onClick={prevMonth} className="w-8 h-8 rounded-lg border-white/10">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={nextMonth} className="w-8 h-8 rounded-lg border-white/10">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-white/5 text-center py-2.5 font-bold text-[10px] text-muted-foreground uppercase tracking-wider bg-black/30">
            {weekdays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
            {calendarDays.map((slot, index) => {
              const dayStr = slot.date.toISOString().split("T")[0];
              const dayEvents = events.filter((e) => e.dateStr === dayStr);
              
              const isToday = slot.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(slot.date, dayEvents)}
                  className={`min-h-[90px] p-2 flex flex-col justify-between transition-colors hover:bg-white/5 cursor-pointer relative ${
                    slot.isCurrentMonth ? "" : "opacity-35"
                  } ${isToday ? "bg-primary/5" : ""}`}
                >
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-black font-bold" : "text-white/80"
                    }`}>
                      {slot.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event list preview */}
                  <div className="flex-1 overflow-hidden space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded truncate leading-none ${e.color}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-muted-foreground font-semibold pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Side details panel */}
      <Card className="bg-card/25 border-white/5 backdrop-blur-md">
        <CardHeader className="py-4 border-b border-white/5">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
            Day Events Detail
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          {selectedDayEvents === null ? (
            <div className="text-center py-12 text-xs text-muted-foreground italic">
              Click on a day in the calendar grid to inspect detailed tasks & meetings
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-xs font-bold text-white block">{selectedDayStr}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">No activities planned</span>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="border-b border-white/5 pb-2">
                <span className="text-xs font-extrabold text-white">{selectedDayStr}</span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedDayEvents.map((e) => {
                  const icons = {
                    meeting: <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
                    task: <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
                    milestone: <Flag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  };

                  const typeLabel = {
                    meeting: "Meeting",
                    task: "Task Issue",
                    milestone: "Milestone"
                  };

                  return (
                    <div key={e.id} className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        {icons[e.type]}
                        <Badge variant="outline" className="text-[9px] uppercase font-bold px-1 py-0 border-white/5">
                          {typeLabel[e.type]}
                        </Badge>
                      </div>
                      <span className="font-semibold text-xs text-white block leading-snug">
                        {e.title}
                      </span>
                      {e.type === "meeting" && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>{e.original.participantNames?.length || 0} participants</span>
                        </div>
                      )}
                      {e.type === "task" && (
                        <div className="flex gap-2 text-[9px] text-muted-foreground">
                          <span>Priority: {e.original.priority}</span>
                          <span>Assignee: {e.original.assignee?.name || "Unassigned"}</span>
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
    </div>
  );
}
