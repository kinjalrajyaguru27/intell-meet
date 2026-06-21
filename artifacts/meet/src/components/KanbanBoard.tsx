import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Plus, CheckSquare, Clock, User, Calendar, Trash2,
  Paperclip, MessageSquare, Send, Check, Loader2, Download, AlertCircle, X
} from "lucide-react";
import { Socket } from "socket.io-client";

interface KanbanBoardProps {
  token: string | null;
  socket: Socket | null;
  selectedProjectId: string;
  selectedTeamId: string;
}

type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Review" | "Testing" | "Done";
type TaskPriority = "Low" | "Medium" | "High" | "Critical";

interface TaskItem {
  id: string;
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: any;
  reporter?: any;
  totalChildren?: number;
  completedChildren?: number;
  subtaskProgress?: number;
}

export default function KanbanBoard({ token, socket, selectedProjectId, selectedTeamId }: KanbanBoardProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTaskDetail, setActiveTaskDetail] = useState<any | null>(null);

  // Form states for new task
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newStatus, setNewStatus] = useState<TaskStatus>("Todo");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Task Details Sub-states
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns: { title: string; status: TaskStatus; color: string; bg: string }[] = [
    { title: "Backlog", status: "Backlog", color: "text-zinc-400", bg: "bg-zinc-500/5" },
    { title: "Todo", status: "Todo", color: "text-amber-400", bg: "bg-amber-500/5" },
    { title: "In Progress", status: "In Progress", color: "text-sky-400", bg: "bg-sky-500/5" },
    { title: "Review", status: "Review", color: "text-violet-400", bg: "bg-violet-500/5" },
    { title: "Testing", status: "Testing", color: "text-rose-400", bg: "bg-rose-500/5" },
    { title: "Done", status: "Done", color: "text-emerald-400", bg: "bg-emerald-500/5" },
  ];

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedTeamId && token) {
      fetchTeamMembers();
    }
  }, [selectedTeamId]);

  // Socket sync
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (data: any) => {
      if (data.projectId === selectedProjectId) {
        fetchTasks();
        // If the task detail is open, refetch its detail
        if (activeTaskDetail && activeTaskDetail.id === data.taskId) {
          fetchTaskDetail(data.taskId);
        }
      }
    };

    socket.on("kanban-task-updated", handleTaskUpdated);
    return () => {
      socket.off("kanban-task-updated", handleTaskUpdated);
    };
  }, [socket, selectedProjectId, activeTaskDetail]);

  const fetchTasks = async () => {
    if (!token || !selectedProjectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?projectId=${selectedProjectId}&parentTaskId=null`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const list = await res.json();
        const teamObj = list.find((t: any) => t.id === selectedTeamId);
        if (teamObj) {
          setTeamMembers(teamObj.members || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTaskDetail = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTaskDetail(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          status: newStatus,
          dueDate: newDueDate || undefined,
          assigneeId: newAssigneeId || undefined,
          projectId: selectedProjectId,
          teamId: selectedTeamId,
        }),
      });

      if (res.ok) {
        const task = await res.json();
        toast({ title: "Task created", description: "Successfully created Kanban task" });
        setNewTitle("");
        setNewDesc("");
        setNewDueDate("");
        setNewAssigneeId("");
        setShowAddForm(false);
        fetchTasks();
        
        // Emit socket update
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId: task.id });
        socket?.emit("analytics-updated", { projectId: selectedProjectId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveStatus = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
        );
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId });
        socket?.emit("analytics-updated", { projectId: selectedProjectId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      handleMoveStatus(taskId, targetStatus);
    }
  };

  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Task successfully deleted." });
        if (activeTaskDetail?.id === taskId) {
          setActiveTaskDetail(null);
        }
        fetchTasks();
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Subtask management
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !activeTaskDetail) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: subtaskTitle,
          parentTaskId: activeTaskDetail.id,
          projectId: selectedProjectId,
          teamId: selectedTeamId,
        }),
      });

      if (res.ok) {
        setSubtaskTitle("");
        fetchTaskDetail(activeTaskDetail.id);
        fetchTasks();
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId: activeTaskDetail.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtask: any) => {
    const nextStatus = subtask.status === "Done" ? "Todo" : "Done";
    try {
      const res = await fetch(`/api/tasks/${subtask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchTaskDetail(activeTaskDetail.id);
        fetchTasks();
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId: activeTaskDetail.id });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Comment management
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTaskDetail) return;

    try {
      const res = await fetch(`/api/tasks/${activeTaskDetail.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        setCommentText("");
        fetchTaskDetail(activeTaskDetail.id);
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId: activeTaskDetail.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attachment upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTaskDetail) return;

    setIsUploading(true);
    try {
      // 1. Post binary to uploads endpoint
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${token}`);
      headers.append("Content-Type", file.type);
      headers.append("x-filename", file.name);

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        headers,
        body: file,
      });

      if (!uploadRes.ok) throw new Error("File upload failed");

      const fileObj = await uploadRes.json();

      // 2. Link file metadata as task attachment
      const linkRes = await fetch(`/api/tasks/${activeTaskDetail.id}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          fileUrl: fileObj.fileUrl,
        }),
      });

      if (linkRes.ok) {
        toast({ title: "Attached", description: `Uploaded ${file.name}` });
        fetchTaskDetail(activeTaskDetail.id);
        socket?.emit("kanban-task-updated", { projectId: selectedProjectId, taskId: activeTaskDetail.id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Renders a beautiful SVG progress ring
  const renderProgressRing = (percentage: number) => {
    const radius = 12;
    const stroke = 3;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(255,255,255,0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="hsl(var(--primary))"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Project Kanban Board</h2>
          <p className="text-xs text-muted-foreground">Manage issues, backlog streams, and progress parameters</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="rounded-full px-4 text-xs font-semibold gap-1">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form overlay */}
      {showAddForm && (
        <Card className="bg-card/60 border border-white/10 backdrop-blur-md p-6 max-w-xl mx-auto">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white">Create Issue</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white">Title</Label>
              <Input
                placeholder="Issue title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-black/40 border-white/10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white">Description</Label>
              <Textarea
                placeholder="Issue description detail..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white">Status</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 h-10 rounded-md px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Testing">Testing</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white">Priority</Label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 h-10 rounded-md px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white">Assignee</Label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 h-10 rounded-md px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.user.id || m.user._id} value={m.user.id || m.user._id}>
                      {m.user.name || m.user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white">Due Date</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-black/40 border-white/10 h-10 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Create Task</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Kanban Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-card/20 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`bg-card/15 border border-white/5 ${col.bg} rounded-2xl p-4 flex flex-col space-y-4 min-w-[200px] select-none`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full bg-current ${col.color} shrink-0`} />
                    <h3 className="font-bold text-[11px] text-white uppercase tracking-wider truncate">{col.title}</h3>
                  </div>
                  <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[400px] overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/30">
                      <CheckSquare className="w-6 h-6 mb-1 opacity-20" />
                      <span className="text-[9px]">Drag issue here</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityColor = {
                        Low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                        Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        Critical: "bg-red-500/10 text-red-400 border-red-500/20",
                      }[task.priority || "Medium"];

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => fetchTaskDetail(task.id)}
                          className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-3 hover:border-white/20 transition-all shadow-lg cursor-pointer group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-xs text-white leading-snug line-clamp-2">
                              {task.title}
                            </span>
                            <button
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-400 rounded transition-opacity shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-white/5 text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded border ${priorityColor}`}>
                                {task.priority}
                              </span>
                              {task.totalChildren ? (
                                <div className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  {renderProgressRing(task.subtaskProgress || 0)}
                                  <span>{task.completedChildren}/{task.totalChildren}</span>
                                </div>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[60px]">
                                {task.assignee?.name || "Unassigned"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Drawer/Modal */}
      {activeTaskDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-card border-l border-white/10 h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary bg-primary/10 border-primary/20">
                    {activeTaskDetail.status}
                  </Badge>
                  <h3 className="text-base font-bold text-white">{activeTaskDetail.title}</h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setActiveTaskDetail(null)} className="rounded-full w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Assignee / Due Date grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Assignee</span>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                      {activeTaskDetail.assignee?.name?.charAt(0) || "?"}
                    </div>
                    <span>{activeTaskDetail.assignee?.name || "Unassigned"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Due Date</span>
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{activeTaskDetail.dueDate || "No deadline"}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {activeTaskDetail.description && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-muted-foreground font-semibold">Description</span>
                  <p className="text-white/90 leading-relaxed bg-black/25 p-3 rounded-lg border border-white/5">
                    {activeTaskDetail.description}
                  </p>
                </div>
              )}

              {/* Subtasks Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    Subtasks Checklist ({activeTaskDetail.completedChildren || 0}/{activeTaskDetail.totalChildren || 0})
                  </span>
                  {activeTaskDetail.subtaskProgress ? (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {activeTaskDetail.subtaskProgress}% done
                    </span>
                  ) : null}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    className="bg-black/40 border-white/10 h-8 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-8">Add</Button>
                </form>

                <div className="space-y-1.5 divide-y divide-white/5">
                  {activeTaskDetail.subtasks?.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(sub)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            sub.status === "Done"
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-white/20 hover:border-primary/50"
                          }`}
                        >
                          {sub.status === "Done" && <Check className="w-3 h-3" />}
                        </button>
                        <span className={`truncate ${sub.status === "Done" ? "line-through text-muted-foreground" : "text-white"}`}>
                          {sub.title}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTask(sub.id)}
                        className="w-7 h-7 text-red-500 hover:bg-red-500/10 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  Files & Attachments ({activeTaskDetail.attachments?.length || 0})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-8 text-xs border-white/10"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                    Upload File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {activeTaskDetail.attachments?.map((att: any) => (
                    <div key={att._id} className="bg-black/30 border border-white/5 p-2 rounded-xl flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <span className="font-semibold truncate block text-white">{att.filename}</span>
                        <span className="text-[9px] text-muted-foreground block">
                          {(att.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <a
                        href={att.fileUrl}
                        download
                        target="_blank"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Discussion Section */}
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  Activity Discussions ({activeTaskDetail.comments?.length || 0})
                </span>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="bg-black/40 border-white/10 h-9 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-9">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>

                <div className="space-y-3.5 pt-2 max-h-48 overflow-y-auto pr-1">
                  {activeTaskDetail.comments?.map((c: any) => (
                    <div key={c._id} className="flex gap-2.5 items-start text-xs text-left">
                      <div className="w-6 h-6 rounded-full bg-violet-600/25 flex items-center justify-center font-bold text-[10px] text-violet-400 shrink-0">
                        {c.userId?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-white">{c.userId?.name}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-white/85 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 pt-4 flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setActiveTaskDetail(null)}>Close</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(activeTaskDetail.id)}>
                Delete Issue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
