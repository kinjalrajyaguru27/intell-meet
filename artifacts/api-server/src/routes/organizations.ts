import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { Organization, Team, Project, Task, Member, ActivityLog } from "@workspace/db";
import { logActivity } from "../lib/activity";

const router = Router();
router.use(requireAuth);

// GET /organizations - List organizations for the user
router.get("/organizations", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Find organizations where the user is the owner or is a member
    const orgsAsOwner = await Organization.find({ owner: req.user.id });
    const memberships = await Member.find({ userId: req.user.id });
    const orgIds = memberships.map((m) => m.organizationId);

    const orgsAsMember = await Organization.find({
      _id: { $in: orgIds },
      owner: { $ne: req.user.id },
    });

    const results = [...orgsAsOwner, ...orgsAsMember];
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing organizations");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /organizations - Create organization
router.post("/organizations", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const org = new Organization({
      name,
      description: description || "",
      owner: req.user.id,
    });
    await org.save();

    // Automatically add the owner to the members collection with 'Owner' role
    const member = new Member({
      userId: req.user.id,
      organizationId: org._id,
      role: "Owner",
    });
    await member.save();

    await logActivity(req.user.id, "org_created", org._id.toString(), "Organization", `Created organization "${name}"`);

    res.status(201).json(org);
  } catch (error) {
    req.log.error({ error }, "Error creating organization");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /organizations/:id - Edit organization
router.put("/organizations/:id", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, description } = req.body;
  const { id } = req.params;

  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    // Verify user is Owner or Admin in the organization
    const member = await Member.findOne({ userId: req.user.id, organizationId: id });
    if (!member || (member.role !== "Owner" && member.role !== "Admin")) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }

    if (name !== undefined) org.name = name;
    if (description !== undefined) org.description = description;

    await org.save();
    await logActivity(req.user.id, "org_updated", id as string, "Organization", `Updated organization details for "${org.name}"`);
    res.json(org);
  } catch (error) {
    req.log.error({ error }, "Error updating organization");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /organizations/:id - Delete organization (cascades)
router.delete("/organizations/:id", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    // Only owner can delete the organization
    if (org.owner.toString() !== req.user.id) {
      res.status(403).json({ error: "Forbidden: Only the owner can delete the organization" });
      return;
    }

    // Cascade deletions:
    // 1. Delete all Teams belonging to the organization
    const teams = await Team.find({ organizationId: id });
    const teamIds = teams.map((t) => t._id);

    // 2. Delete all Projects belonging to those teams
    const projects = await Project.find({ teamId: { $in: teamIds } });
    const projectIds = projects.map((p) => p._id);

    // 3. Delete all Tasks belonging to those projects or teams
    await Task.deleteMany({
      $or: [{ projectId: { $in: projectIds } }, { teamId: { $in: teamIds } }],
    });

    // 4. Delete Projects, Teams, Members, and Organization
    await Project.deleteMany({ teamId: { $in: teamIds } });
    await Team.deleteMany({ organizationId: id });
    await Member.deleteMany({ organizationId: id });
    await Organization.findByIdAndDelete(id);
    await logActivity(req.user.id, "org_deleted", id as string, "Organization", `Deleted organization "${org.name}" and all sub-resources`);

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting organization");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /organizations/:id/settings - Organization settings
router.get("/organizations/:id/settings", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    // Verify caller belongs to the organization
    const callerMember = await Member.findOne({ userId: req.user!.id, organizationId: id });
    if (!callerMember && req.user!.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You do not have access to this organization" });
      return;
    }

    res.json({
      organizationId: org._id,
      name: org.name,
      description: org.description,
      owner: org.owner,
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: "Member",
        twoFactorRequired: false,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Error getting settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /organizations/:id/activity-logs - Fetch audit logs for organization
router.get("/organizations/:id/activity-logs", async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    // Verify caller belongs to the organization
    const callerMember = await Member.findOne({ userId: req.user!.id, organizationId: id });
    if (!callerMember && req.user!.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You do not have access to this organization" });
      return;
    }

    const teams = await Team.find({ organizationId: id });
    const teamIds = teams.map((t) => t._id);

    const projects = await Project.find({ teamId: { $in: teamIds } });
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({
      $or: [{ projectId: { $in: projectIds } }, { teamId: { $in: teamIds } }],
    });
    const taskIds = tasks.map((t) => t._id);

    // Fetch all logs associated with any of these entities
    const logs = await ActivityLog.find({
      userId: req.user!.id,
      $or: [
        { entityId: id, entityType: "Organization" },
        { entityId: { $in: teamIds }, entityType: "Team" },
        { entityId: { $in: projectIds }, entityType: "Project" },
        { entityId: { $in: taskIds }, entityType: "Task" },
      ],
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    req.log.error({ error }, "Error fetching activity logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
