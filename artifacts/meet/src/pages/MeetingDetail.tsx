import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetMeeting,
  useUpsertNotes,
  useCreateActionItem,
  useUpdateActionItem,
  useDeleteActionItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
        queryClient.invalidateQueries({ queryKey: ["getMeeting", meetingId] });
        setEditing(false);
      },
    },
  });
  const deleteMutation = useDeleteActionItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getMeeting", meetingId] });
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
  const [, params] = useRoute("/dashboard/meeting/:meetingId");
  const [, setLocation] = useLocation();
  const meetingId = params?.meetingId ?? "";
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useGetMeeting(meetingId);

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newItemAssignee, setNewItemAssignee] = useState("");
  const [newItemDue, setNewItemDue] = useState("");
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  useEffect(() => {
    if (meeting?.notes != null && !notesDirty) {
      setNotes(meeting.notes ?? "");
    }
  }, [meeting?.notes, notesDirty]);

  const upsertNotesMutation = useUpsertNotes({
    mutation: {
      onSuccess: () => {
        setNotesDirty(false);
        queryClient.invalidateQueries({ queryKey: ["getMeeting", meetingId] });
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
        queryClient.invalidateQueries({ queryKey: ["getMeeting", meetingId] });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Meeting not found.</p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const openItems = meeting.actionItems.filter((i) => !i.isDone);
  const doneItems = meeting.actionItems.filter((i) => i.isDone);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-semibold text-base truncate max-w-xs">{meeting.name}</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Meeting meta */}
          <div className="bg-card border border-border rounded-xl px-6 py-5">
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
            {meeting.participantNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {meeting.participantNames.map((name) => (
                  <span
                    key={name}
                    className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Meeting Notes
              </h2>
              {notesDirty && (
                <Button
                  size="sm"
                  className="h-8 px-4 rounded-full text-xs gap-1.5"
                  onClick={saveNotes}
                  disabled={upsertNotesMutation.isPending}
                >
                  {upsertNotesMutation.isPending ? (
                    <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Notes
                </Button>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
              onBlur={() => { if (notesDirty) saveNotes(); }}
              rows={6}
              placeholder="Add meeting notes, key decisions, and summaries here…"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/60 resize-y transition-colors placeholder:text-muted-foreground/50"
            />
          </section>

          {/* Action items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Action Items
                {meeting.actionItems.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    {doneItems.length}/{meeting.actionItems.length} done
                  </span>
                )}
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-4 rounded-full text-xs gap-1.5"
                onClick={() => setShowNewItemForm(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            {showNewItemForm && (
              <div className="bg-card border border-primary/40 rounded-xl px-4 py-3 mb-3 space-y-3">
                <input
                  autoFocus
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setShowNewItemForm(false); }}
                  className="w-full bg-transparent text-sm font-medium outline-none border-b border-border pb-1"
                  placeholder="Describe the action item…"
                />
                <div className="flex items-center gap-3">
                  <input
                    value={newItemAssignee}
                    onChange={(e) => setNewItemAssignee(e.target.value)}
                    className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground"
                    placeholder="Assignee (optional)"
                  />
                  <input
                    type="date"
                    value={newItemDue}
                    onChange={(e) => setNewItemDue(e.target.value)}
                    className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none text-muted-foreground"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs"
                    onClick={() => { setShowNewItemForm(false); setNewItemText(""); }}
                  >
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={addItem}
                    disabled={!newItemText.trim() || createItemMutation.isPending}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}

            {meeting.actionItems.length === 0 && !showNewItemForm ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl">
                <CheckSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No action items yet.</p>
                <button
                  onClick={() => setShowNewItemForm(true)}
                  className="text-primary text-sm mt-2 hover:underline"
                >
                  Add the first one
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {openItems.map((item) => (
                  <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
                ))}
                {doneItems.length > 0 && (
                  <details className="group">
                    <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none py-2 hover:text-foreground transition-colors list-none">
                      <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                      {doneItems.length} completed item{doneItems.length !== 1 ? "s" : ""}
                    </summary>
                    <div className="space-y-2 mt-2">
                      {doneItems.map((item) => (
                        <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
