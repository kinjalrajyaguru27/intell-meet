import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Trash2,
  Paperclip,
  MessageSquare,
  Send,
  Check,
  CheckSquare,
  Loader2,
  Download,
  AlertCircle,
  X,
  Brain,
  FolderKanban,
  Users,
} from "lucide-react";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";
type TaskPriority = "Low" | "Medium" | "High" | "Critical";

interface TaskItem {
  id: string;
  _id: string;
  title: string;
  description?: string;
  status: "Backlog" | "Todo" | "In Progress" | "Review" | "Testing" | "Done";
  priority: TaskPriority;
  dueDate: string | null;
  assignee: any;
  reporter: any;
  projectId?: any;
  teamId?: any;
  totalChildren?: number;
  completedChildren?: number;
  subtaskProgress?: number;
}

interface ActionItem {
  id: string;
  meetingId: string;
  taskId: string | null;
  title: string;
  description: string;
  assignee: string | null;
  assigneeName: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: string;
}

export default function TodoManager() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  // Create Task form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPriority, setCreatePriority] = useState<TaskPriority>("Medium");
  const [createStatus, setCreateStatus] = useState<TaskStatus>("Todo");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createAssigneeId, setCreateAssigneeId] = useState("");
  const [createProjectId, setCreateProjectId] = useState("");
  const [createTeamId, setCreateTeamId] = useState("");

  // Edit Task detail modal state
  const [activeTaskDetail, setActiveTaskDetail] = useState<any | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Action Items modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState<string>("");
  const [importProjectId, setImportProjectId] = useState("");
  const [importTeamId, setImportTeamId] = useState("");
  const [importAssigneeId, setImportAssigneeId] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchTeams();
      fetchProjects();
      fetchActionItems();
    }
  }, [token]);

  const fetchTasks = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTeams(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActionItems = async () => {
    try {
      const res = await fetch("/api/ai/action-items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActionItems(await res.json());
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
        setActiveTaskDetail(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Coworkers selector
  const coworkers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string; email: string }>();
    if (user) {
      usersMap.set(user.id, { id: user.id, name: `${user.name} (Me)`, email: user.email });
    }
    teams.forEach((t: any) => {
      t.members?.forEach((m: any) => {
        if (m.user) {
          usersMap.set(m.user.id, m.user);
        }
      });
    });
    return Array.from(usersMap.values());
  }, [teams, user]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

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
        toast({ title: "Task status updated", description: `Task moved to ${targetStatus}` });
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createTitle,
          description: createDesc,
          status: createStatus,
          priority: createPriority,
          dueDate: createDueDate || undefined,
          assigneeId: createAssigneeId || undefined,
          projectId: createProjectId || undefined,
          teamId: createTeamId || undefined,
        }),
      });

      if (res.ok) {
        toast({ title: "Task Created", description: "Successfully created new task." });
        setCreateTitle("");
        setCreateDesc("");
        setCreateDueDate("");
        setCreateAssigneeId("");
        setCreateProjectId("");
        setCreateTeamId("");
        setIsCreateOpen(false);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskDetail = async (fields: any) => {
    if (!activeTaskDetail) return;
    try {
      const res = await fetch(`/api/tasks/${activeTaskDetail.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        toast({ title: "Task updated" });
        fetchTaskDetail(activeTaskDetail.id);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Task deleted" });
        if (activeTaskDetail?.id === taskId) {
          setActiveTaskDetail(null);
        }
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subtasks management
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
          teamId: activeTaskDetail.teamId,
          projectId: activeTaskDetail.projectId,
        }),
      });

      if (res.ok) {
        toast({ title: "Subtask added" });
        setSubtaskTitle("");
        fetchTaskDetail(activeTaskDetail.id);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (sub: any) => {
    const targetStatus = sub.status === "Done" ? "Todo" : "Done";
    try {
      const res = await fetch(`/api/tasks/${sub.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        fetchTaskDetail(activeTaskDetail.id);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // File attachments management
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !activeTaskDetail) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (uploadRes.ok) {
        const fileData = await uploadRes.json();
        const attachRes = await fetch(`/api/tasks/${activeTaskDetail.id}/attachments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            fileUrl: fileData.url,
          }),
        });

        if (attachRes.ok) {
          toast({ title: "File uploaded", description: `Attached ${file.name}` });
          fetchTaskDetail(activeTaskDetail.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Import action items
  const handleImportActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = actionItems.find((ai) => ai.id === selectedActionItemId);
    if (!item) return;

    try {
      // 1. Create a task based on action item
      const taskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          status: "Todo",
          priority: item.priority || "Medium",
          dueDate: item.dueDate || undefined,
          assigneeId: importAssigneeId || undefined,
          projectId: importProjectId || undefined,
          teamId: importTeamId || undefined,
        }),
      });

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        // 2. Link Action Item to task
        await fetch(`/api/ai/action-items/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId: taskData.id,
            status: "Todo",
            assignee: importAssigneeId || undefined,
            assigneeName: coworkers.find(c => c.id === importAssigneeId)?.name || item.assigneeName,
          }),
        });

        toast({ title: "Import Successful", description: `Created task "${item.title}" from Action Item.` });
        setSelectedActionItemId("");
        setImportProjectId("");
        setImportTeamId("");
        setImportAssigneeId("");
        setIsImportOpen(false);
        fetchTasks();
        fetchActionItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute Dashboard Widgets stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let todayTasks = 0;
    let upcomingDeadlines = 0;

    tasks.forEach((t) => {
      const isDone = t.status === "Done";
      if (isDone) {
        completed++;
      } else {
        pending++;
        if (t.dueDate && t.dueDate < todayStr) {
          overdue++;
        }
      }

      if (t.dueDate) {
        if (t.dueDate === todayStr) {
          todayTasks++;
        }
        if (t.dueDate >= todayStr && t.dueDate <= nextWeekStr) {
          upcomingDeadlines++;
        }
      }
    });

    const total = tasks.length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      pending,
      completed,
      overdue,
      progressPercent,
      todayTasks,
      upcomingDeadlines,
    };
  }, [tasks]);

  // Filters application
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search Query
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Priority Filter
      const matchesPriority = filterPriority === "all" ? true : t.priority === filterPriority;

      // 3. Assignee Filter
      const matchesAssignee =
        filterAssignee === "all"
          ? true
          : filterAssignee === "unassigned"
          ? !t.assignee
          : t.assignee?.id === filterAssignee || t.assignee?._id === filterAssignee;

      // 4. Project Filter
      const matchesProject =
        filterProject === "all" ? true : t.projectId === filterProject || t.projectId?.id === filterProject || t.projectId?._id === filterProject;

      return matchesSearch && matchesPriority && matchesAssignee && matchesProject;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee, filterProject]);

  // Columns partition
  const columnsData = useMemo(() => {
    const list: Record<TaskStatus, TaskItem[]> = {
      Todo: [],
      "In Progress": [],
      Review: [],
      Done: [],
    };

    filteredTasks.forEach((t) => {
      // Map other Backlog/Testing/etc to nearest Todo manager columns
      if (t.status === "Backlog" || t.status === "Todo") {
        list["Todo"].push(t);
      } else if (t.status === "In Progress") {
        list["In Progress"].push(t);
      } else if (t.status === "Review" || t.status === "Testing") {
        list["Review"].push(t);
      } else if (t.status === "Done") {
        list["Done"].push(t);
      }
    });

    return list;
  }, [filteredTasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-primary animate-pulse" />
          <h1 className="font-semibold text-lg text-white font-sans">Todo Manager</h1>
        </div>

        <div className="flex gap-2">
          {/* AI Import Trigger */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-4 text-xs font-bold gap-1.5 border-white/10 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
              >
                <Brain className="w-3.5 h-3.5" />
                Import AI Action Items
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  Import AI Action Items
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImportActionItem} className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label>Select Action Item</Label>
                  <Select
                    value={selectedActionItemId}
                    onValueChange={setSelectedActionItemId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI action item to tasks" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionItems
                        .filter((ai) => !ai.taskId)
                        .map((ai) => (
                          <SelectItem key={ai.id} value={ai.id}>
                            {ai.title} ({ai.assigneeName || "Unassigned"})
                          </SelectItem>
                        ))}
                      {actionItems.filter((ai) => !ai.taskId).length === 0 && (
                        <SelectItem value="none" disabled>
                          No pending action items found.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedActionItemId && (
                  <>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1 text-zinc-300">
                      <span className="font-bold text-white block">Description:</span>
                      <p>{actionItems.find(ai => ai.id === selectedActionItemId)?.description || "No details provided"}</p>
                    </div>

                    <div className="space-y-1">
                      <Label>Team</Label>
                      <Select value={importTeamId} onValueChange={setImportTeamId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign Workspace Team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Project Link</Label>
                      <Select value={importProjectId} onValueChange={setImportProjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Link Project Board (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects
                            .filter(p => !importTeamId || p.teamId === importTeamId)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Assignee</Label>
                      <Select value={importAssigneeId} onValueChange={setImportAssigneeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Task Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {coworkers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <DialogFooter className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={!selectedActionItemId}
                  >
                    Import as Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Task trigger */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-full px-4 text-xs font-bold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Workspace Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="t-title">Task Title</Label>
                  <Input
                    id="t-title"
                    placeholder="Enter task name..."
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-desc">Description</Label>
                  <Textarea
                    id="t-desc"
                    placeholder="Provide details..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select
                      value={createPriority}
                      onValueChange={(val: TaskPriority) => setCreatePriority(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Initial Status</Label>
                    <Select
                      value={createStatus}
                      onValueChange={(val: TaskStatus) => setCreateStatus(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todo">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="t-due">Due Date</Label>
                    <Input
                      id="t-due"
                      type="date"
                      value={createDueDate}
                      onChange={(e) => setCreateDueDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Assignee</Label>
                    <Select value={createAssigneeId} onValueChange={setCreateAssigneeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {coworkers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Team Link</Label>
                    <Select value={createTeamId} onValueChange={setCreateTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="No Team linked" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Project Link</Label>
                    <Select value={createProjectId} onValueChange={setCreateProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="No Project linked" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects
                          .filter(p => !createTeamId || p.teamId === createTeamId)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={!createTitle.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Dashboard Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Pending Tasks", value: stats.pending, sub: "Action required", color: "text-amber-400" },
          { label: "Completed Tasks", value: stats.completed, sub: "Tasks finished", color: "text-emerald-400" },
          { label: "Overdue Tasks", value: stats.overdue, sub: "Deadlines missed", color: "text-rose-500 font-bold animate-pulse" },
          { label: "Progress %", value: `${stats.progressPercent}%`, sub: "Overall completion", color: "text-sky-400" },
          { label: "Today's Tasks", value: stats.todayTasks, sub: "Due by midnight", color: "text-violet-400" },
          { label: "Upcoming", value: stats.upcomingDeadlines, sub: "Next 7 days", color: "text-zinc-400" },
        ].map((widget, i) => (
          <div key={i} className="bg-card border border-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
              {widget.label}
            </span>
            <span className={`text-2xl font-bold tabular-nums ${widget.color}`}>
              {widget.value}
            </span>
            <span className="text-[9px] text-zinc-500 leading-none">
              {widget.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Control filters bar */}
      <div className="bg-card border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search todo items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/40 border-white/10 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold whitespace-nowrap">Priority:</span>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32 bg-black/40 border-white/10 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold whitespace-nowrap">Assignee:</span>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-36 bg-black/40 border-white/10 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {coworkers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold whitespace-nowrap">Project:</span>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-36 bg-black/40 border-white/10 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Board Columns Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading tasks database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
          {([
            { title: "To Do", status: "Todo", color: "text-amber-400 border-amber-400/20 bg-amber-500/5" },
            { title: "In Progress", status: "In Progress", color: "text-sky-400 border-sky-400/20 bg-sky-500/5" },
            { title: "Review", status: "Review", color: "text-violet-400 border-violet-400/20 bg-violet-500/5" },
            { title: "Done", status: "Done", color: "text-emerald-400 border-emerald-400/20 bg-emerald-500/5" },
          ] as const).map((col) => {
            const colTasks = columnsData[col.status] || [];

            return (
              <div
                key={col.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`border border-white/5 rounded-2xl flex flex-col min-h-[500px] bg-[#09090b]/40 backdrop-blur-md`}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-white/5 flex items-center justify-between rounded-t-2xl bg-black/20`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      col.status === "Todo" ? "bg-amber-400" :
                      col.status === "In Progress" ? "bg-sky-400" :
                      col.status === "Review" ? "bg-violet-400" : "bg-emerald-400"
                    }`} />
                    <span className="text-xs font-bold text-white tracking-wide uppercase">{col.title}</span>
                  </div>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-bold bg-white/5 text-zinc-400 rounded-full">
                    {colTasks.length}
                  </Badge>
                </div>

                {/* Column Cards zone */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600/50">
                      <CheckSquare className="w-5 h-5 mb-1 opacity-20" />
                      <span className="text-[9px]">Drag tasks here</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityColor = {
                        Low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                        Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        Critical: "bg-red-500/10 text-red-400 border-red-500/20",
                      }[task.priority || "Medium"];

                      const isOverdue = !task.status.includes("Done") && task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => fetchTaskDetail(task.id)}
                          className="bg-black/50 border border-white/5 hover:border-white/15 rounded-xl p-3.5 space-y-2.5 transition-all shadow-md cursor-pointer group hover:scale-[1.01]"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-xs text-white leading-snug line-clamp-2">
                              {task.title}
                            </span>
                            <button
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 rounded transition-opacity shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Task details footer indicators */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-white/5 text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded border ${priorityColor} font-bold text-[8px]`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[8px] ${
                                  isOverdue ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse font-bold" : "bg-white/5 text-zinc-400 border-white/5"
                                }`}>
                                  <Clock className="w-2.5 h-2.5" />
                                  {task.dueDate}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-zinc-400 font-medium">
                              <User className="w-3 h-3 shrink-0 text-zinc-500" />
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

      {/* Task detail drawer/modal */}
      {activeTaskDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-card border-l border-white/10 h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary bg-primary/10 border-primary/20">
                      {activeTaskDetail.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-400">
                      Priority: {activeTaskDetail.priority}
                    </Badge>
                  </div>
                  <Input
                    className="text-base font-bold text-white bg-transparent border-transparent hover:border-white/10 focus-visible:ring-0 focus-visible:border-primary px-1 h-8 mt-1"
                    defaultValue={activeTaskDetail.title}
                    onBlur={(e) => handleUpdateTaskDetail({ title: e.target.value })}
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => setActiveTaskDetail(null)} className="rounded-full w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Assignee / Due Date grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="space-y-2">
                  <span className="text-zinc-400 font-semibold block">Assignee</span>
                  <Select
                    value={activeTaskDetail.assignee?.id || activeTaskDetail.assignee?._id || "unassigned"}
                    onValueChange={(val) => handleUpdateTaskDetail({ assigneeId: val === "unassigned" ? null : val })}
                  >
                    <SelectTrigger className="bg-black/25 border-white/5 h-8">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {coworkers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-zinc-400 font-semibold block">Due Date</span>
                  <Input
                    type="date"
                    className="bg-black/25 border-white/5 h-8 text-xs"
                    value={activeTaskDetail.dueDate || ""}
                    onChange={(e) => handleUpdateTaskDetail({ dueDate: e.target.value || null })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-xs">
                <span className="text-zinc-400 font-semibold">Description</span>
                <Textarea
                  className="text-white/90 leading-relaxed bg-black/25 border-white/5 text-xs p-3 focus-visible:ring-0"
                  defaultValue={activeTaskDetail.description || ""}
                  placeholder="Provide task description here..."
                  onBlur={(e) => handleUpdateTaskDetail({ description: e.target.value })}
                />
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
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

                <div className="space-y-1 divide-y divide-white/5">
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
                        <span className={`truncate ${sub.status === "Done" ? "line-through text-zinc-500" : "text-white"}`}>
                          {sub.title}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTask(sub.id)}
                        className="w-7 h-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                  <Paperclip className="w-4 h-4 text-sky-400" />
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
                        <span className="text-[9px] text-zinc-500 block">
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

              {/* Comments Section */}
              <div className="space-y-3">
                <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  Discussions ({activeTaskDetail.comments?.length || 0})
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

                <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
                  {activeTaskDetail.comments?.map((c: any) => (
                    <div key={c._id} className="flex gap-2.5 items-start text-xs text-left">
                      <div className="w-6 h-6 rounded-full bg-violet-600/25 flex items-center justify-center font-bold text-[10px] text-violet-400 shrink-0">
                        {c.userId?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-white">{c.userId?.name}</span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-white/80 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
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
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
