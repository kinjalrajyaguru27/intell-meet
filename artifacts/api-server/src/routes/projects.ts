import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { Project, Task, Team } from "@workspace/db";
import { logActivity } from "../lib/activity";
import { canAccessProject } from "../lib/authHelpers";

const router = Router();
router.use(requireAuth);

// GET /projects - List all projects
router.get("/projects", async (req: AuthenticatedRequest, res) => {
  const { teamId, status, priority } = req.query;

  try {
    const userTeams = await Team.find({
      $or: [
        { owner: req.user!.id },
        { "members.user": req.user!.id }
      ]
    }).select("_id");
    const teamIds = userTeams.map((t) => t._id);

    const filter: any = {
      $and: [
        {
          $or: [
            { owner: req.user!.id },
            { teamId: { $in: teamIds } }
          ]
        }
      ]
    };

    if (teamId) filter.$and.push({ teamId });
    if (status) filter.$and.push({ status });
    if (priority) filter.$and.push({ priority });

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    // Inject tasks counts and calculate progressPercent for each project dynamically
    const results = [];
    for (const p of projects) {
      const totalTasks = await Task.countDocuments({ projectId: p._id });
      const completedTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      results.push({
        ...p.toObject(),
        id: p._id.toString(),
        totalTasks,
        completedTasks,
        progressPercent,
      });
    }

    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/:id - Get project by ID
router.get("/projects/:id", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const hasAccess = await canAccessProject(id as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to access this project" });
      return;
    }

    const p = await Project.findById(id);
    if (!p) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const totalTasks = await Task.countDocuments({ projectId: p._id });
    const completedTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...p.toObject(),
      id: p._id.toString(),
      totalTasks,
      completedTasks,
      progressPercent,
    });
  } catch (error) {
    req.log.error({ error }, "Error getting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /projects - Create a new project
router.post("/projects", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, description, teamId, dueDate, status, priority } = req.body;

  if (!name || !teamId) {
    res.status(400).json({ error: "Name and teamId are required" });
    return;
  }

  try {
    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const isMember = team.owner?.toString() === req.user!.id || team.members.some((m: any) => m.user && m.user.toString() === req.user!.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied: You are not a member of this team" });
      return;
    }

    const project = new Project({
      name,
      description: description || "",
      teamId,
      owner: req.user!.id,
      dueDate: dueDate || null,
      status: status || "Planning",
      priority: priority || "Medium",
    });

    await project.save();
    await logActivity(req.user!.id, "project_created", project._id.toString(), "Project", `Created project "${name}"`);
    res.status(201).json({
      ...project.toObject(),
      id: project._id.toString(),
      totalTasks: 0,
      completedTasks: 0,
      progressPercent: 0,
    });
  } catch (error) {
    req.log.error({ error }, "Error creating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/projects/:id", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const { name, description, dueDate, status, priority } = req.body;

  try {
    const hasAccess = await canAccessProject(id as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify this project" });
      return;
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;

    await project.save();
    await logActivity(req.user.id, "project_updated", id as string, "Project", `Updated details for project "${project.name}"`);

    const totalTasks = await Task.countDocuments({ projectId: project._id });
    const completedTasks = await Task.countDocuments({ projectId: project._id, status: "Done" });
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...project.toObject(),
      id: project._id.toString(),
      totalTasks,
      completedTasks,
      progressPercent,
    });
  } catch (error) {
    req.log.error({ error }, "Error updating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;

  try {
    const hasAccess = await canAccessProject(id as string, req.user!.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to delete this project" });
      return;
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Delete tasks belonging to this project
    await Task.deleteMany({ projectId: id });

    // Delete project
    await Project.findByIdAndDelete(id);
    await logActivity(req.user!.id, "project_deleted", id as string, "Project", `Deleted project "${project.name}"`);

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
