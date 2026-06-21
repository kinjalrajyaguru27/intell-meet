import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { Task, Subtask, Comment, Attachment, User, Project } from "@workspace/db";
import { pushNotificationToUser } from "../signaling";
import { logActivity } from "../lib/activity";

const router = Router();
router.use(requireAuth);

// GET /tasks - List tasks
router.get("/tasks", async (req: AuthenticatedRequest, res) => {
  const { teamId, projectId, assignee, status, priority, parentTaskId } = req.query;

  try {
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    if (projectId) filter.projectId = projectId;
    if (assignee) filter.assignee = assignee;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (parentTaskId === "null") {
      filter.parentTaskId = null;
    } else if (parentTaskId) {
      filter.parentTaskId = parentTaskId;
    }

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    const results = [];
    for (const t of tasks) {
      // Calculate subtask progress
      const children = await Task.find({ parentTaskId: t._id });
      const totalChildren = children.length;
      const completedChildren = children.filter((c) => c.status === "Done").length;
      const subtaskProgress = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0;

      results.push({
        ...t.toObject(),
        id: t._id.toString(),
        totalChildren,
        completedChildren,
        subtaskProgress,
      });
    }

    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/:id - Get task detail
router.get("/tasks/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id)
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const children = await Task.find({ parentTaskId: task._id }).populate("assignee", "name email");
    const comments = await Comment.find({ taskId: task._id }).populate("userId", "name email").sort({ createdAt: 1 });
    const attachments = await Attachment.find({ taskId: task._id }).populate("uploadedBy", "name email");

    const totalChildren = children.length;
    const completedChildren = children.filter((c) => c.status === "Done").length;
    const subtaskProgress = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0;

    res.json({
      ...task.toObject(),
      id: task._id.toString(),
      subtasks: children.map((c) => ({ ...c.toObject(), id: c._id.toString() })),
      comments,
      attachments,
      totalChildren,
      completedChildren,
      subtaskProgress,
    });
  } catch (error) {
    req.log.error({ error }, "Error getting task details");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks - Create a task (or subtask)
router.post("/tasks", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title, description, assigneeId, status, priority, dueDate, projectId, teamId, parentTaskId } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  try {
    const task = new Task({
      title,
      description: description || "",
      status: status || "Todo",
      assignee: assigneeId || null,
      reporter: req.user.id,
      dueDate: dueDate || null,
      priority: priority || "Medium",
      projectId: projectId || null,
      teamId: teamId || null,
      parentTaskId: parentTaskId || null,
    });

    await task.save();
    await logActivity(req.user.id, parentTaskId ? "subtask_created" : "task_created", task._id.toString(), "Task", `${parentTaskId ? "Created subtask" : "Created task"} "${title}"`);

    // If it's a subtask, save to Subtask collection for relationship validation
    if (parentTaskId) {
      const sub = new Subtask({
        parentTaskId,
        childTaskId: task._id,
      });
      await sub.save();
    }

    // Trigger Notification for Assignee
    if (assigneeId && assigneeId !== req.user.id) {
      await pushNotificationToUser(
        assigneeId,
        "task_assignment",
        "New Task Assigned",
        `You have been assigned the task: "${title}"`,
        `/dashboard?tab=kanban`
      );
    }

    res.status(201).json({
      ...task.toObject(),
      id: task._id.toString(),
      totalChildren: 0,
      completedChildren: 0,
      subtaskProgress: 0,
    });
  } catch (error) {
    req.log.error({ error }, "Error creating task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /tasks/:id - Update task (e.g. status Drag & Drop)
router.put("/tasks/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, status, assigneeId, priority, dueDate, projectId, teamId, parentTaskId } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const oldAssignee = task.assignee?.toString();

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (projectId !== undefined) task.projectId = projectId || null;
    if (teamId !== undefined) task.teamId = teamId || null;
    if (parentTaskId !== undefined) task.parentTaskId = parentTaskId || null;

    await task.save();
    await logActivity(req.user!.id, "task_updated", id as string, "Task", `Updated task "${task.title}" (Status: ${task.status})`);

    // Trigger assignment notification if assignee changed
    if (assigneeId && assigneeId !== req.user!.id && assigneeId !== oldAssignee) {
      await pushNotificationToUser(
        assigneeId,
        "task_assignment",
        "New Task Assigned",
        `You have been assigned the task: "${task.title}"`,
        `/dashboard?tab=kanban`
      );
    }

    res.json({
      ...task.toObject(),
      id: task._id.toString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error updating task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /tasks/:id - Delete task (cascades subtasks, comments, attachments)
router.delete("/tasks/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Cascade deletions
    await Subtask.deleteMany({ $or: [{ parentTaskId: id }, { childTaskId: id }] });
    await Task.deleteMany({ parentTaskId: id }); // Delete child tasks
    await Comment.deleteMany({ taskId: id });
    await Attachment.deleteMany({ taskId: id });
    await Task.findByIdAndDelete(id);
    await logActivity(req.user!.id, "task_deleted", id as string, "Task", `Deleted task "${task.title}"`);

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks/:id/comments - Add task comment
router.post("/tasks/:id/comments", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { text, parentCommentId } = req.body;

  if (!text) {
    res.status(400).json({ error: "Comment text is required" });
    return;
  }

  try {
    const comment = new Comment({
      taskId: id,
      userId: req.user.id,
      text,
      parentCommentId: parentCommentId || null,
    });
    await comment.save();

    // Log comment activity
    const tDoc = await Task.findById(id);
    if (tDoc) {
      await logActivity(req.user.id, "task_commented", id as string, "Task", `Commented on task "${tDoc.title}": "${text.substring(0, 30)}..."`);
    }

    // Check for @mentions in comments (e.g. "@User Name") and trigger notification
    const mentions = text.match(/@\[([^\]]+)\]|@([a-zA-Z0-9_]+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.replace(/[@\[\]]/g, "");
        const user = await User.findOne({ name: new RegExp(`^${username}$`, "i") });
        if (user && user._id.toString() !== req.user.id) {
          await pushNotificationToUser(
            user._id.toString(),
            "mention",
            "Mentioned in Task Comment",
            `${req.user.name} mentioned you: "${text.substring(0, 50)}"`,
            `/dashboard?tab=kanban`
          );
        }
      }
    }

    const populated = await Comment.findById(comment._id).populate("userId", "name email");
    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks/:id/attachments - Add attachment
router.post("/tasks/:id/attachments", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { filename, mimeType, sizeBytes, fileUrl } = req.body;

  if (!filename || !fileUrl) {
    res.status(400).json({ error: "filename and fileUrl are required" });
    return;
  }

  try {
    const attachment = new Attachment({
      taskId: id,
      filename,
      mimeType,
      sizeBytes,
      fileUrl,
      uploadedBy: req.user.id,
    });
    await attachment.save();
    const tDoc = await Task.findById(id);
    if (tDoc) {
      await logActivity(req.user.id, "task_attached", id as string, "Task", `Added attachment "${filename}" to task "${tDoc.title}"`);
    }

    const populated = await Attachment.findById(attachment._id).populate("uploadedBy", "name email");
    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating attachment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
