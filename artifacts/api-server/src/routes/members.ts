import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { Member, Organization, User, Team } from "@workspace/db";

const router = Router();
router.use(requireAuth);

// GET /organizations/:orgId/members - Get all members of an organization
router.get("/organizations/:orgId/members", async (req: AuthenticatedRequest, res) => {
  const { orgId } = req.params;

  try {
    const members = await Member.find({ organizationId: orgId }).populate("userId", "name email");
    res.json(members);
  } catch (error) {
    req.log.error({ error }, "Error fetching organization members");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /organizations/:orgId/members/invite - Invite a user to the organization
router.post("/organizations/:orgId/members/invite", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orgId } = req.params;
  const { email, role, teamId } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    // 1. Verify caller has admin/owner rights in organization
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || (callerMember.role !== "Owner" && callerMember.role !== "Admin")) {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can invite members" });
      return;
    }

    // 2. Find user by email (or create placeholder user)
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      user = new User({
        email: email.trim().toLowerCase(),
        name: email.split("@")[0],
        password: "TemporaryPassword123!", // Dummy password for placeholder account
      });
      await user.save();
    }

    // 3. Check if membership already exists
    const existing = await Member.findOne({
      userId: user._id,
      organizationId: orgId,
      teamId: teamId || null,
    });
    if (existing) {
      res.status(400).json({ error: "User is already a member" });
      return;
    }

    const member = new Member({
      userId: user._id,
      organizationId: orgId,
      teamId: teamId || null,
      role: role || "Member",
    });
    await member.save();

    // 4. Sync member details back to the matching Team model if teamId is provided
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team) {
        if (!team.members.some((m: any) => m.user.toString() === user!._id.toString())) {
          team.members.push({
            user: user._id,
            role: role === "Owner" || role === "Admin" ? "Admin" : (role === "Manager" ? "Manager" : "Member"),
          });
          await team.save();
        }
      }
    }

    res.status(201).json(member);
  } catch (error) {
    req.log.error({ error }, "Error inviting member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /organizations/:orgId/members/:userId/role - Change member role
router.put("/organizations/:orgId/members/:userId/role", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orgId, userId } = req.params;
  const { role } = req.body;

  if (!role) {
    res.status(400).json({ error: "Role is required" });
    return;
  }

  try {
    // 1. Verify caller has admin/owner rights in organization
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || (callerMember.role !== "Owner" && callerMember.role !== "Admin")) {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can update roles" });
      return;
    }

    // 2. Find membership
    const member = await Member.findOne({ userId, organizationId: orgId });
    if (!member) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }

    // Prevents demoting owner unless ownership is transferred
    if (member.role === "Owner" && role !== "Owner") {
      res.status(400).json({ error: "Cannot demote organization Owner. Transfer ownership first." });
      return;
    }

    member.role = role;
    await member.save();

    res.json(member);
  } catch (error) {
    req.log.error({ error }, "Error updating role");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /organizations/:orgId/members/:userId - Remove member
router.delete("/organizations/:orgId/members/:userId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orgId, userId } = req.params;

  try {
    // 1. Verify caller has admin/owner rights in organization
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || (callerMember.role !== "Owner" && callerMember.role !== "Admin")) {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can remove members" });
      return;
    }

    // 2. Prevent removing the owner
    const memberToRemove = await Member.findOne({ userId, organizationId: orgId });
    if (!memberToRemove) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    if (memberToRemove.role === "Owner") {
      res.status(400).json({ error: "Cannot remove organization Owner" });
      return;
    }

    // 3. Delete matching Member doc and pull from all Teams in this org
    await Member.deleteMany({ userId, organizationId: orgId });
    const teams = await Team.find({ organizationId: orgId });
    for (const team of teams) {
      team.members = team.members.filter((m: any) => m.user.toString() !== userId);
      await team.save();
    }

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error removing member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /organizations/:orgId/transfer-ownership - Transfer Owner privileges
router.post("/organizations/:orgId/transfer-ownership", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orgId } = req.params;
  const { newOwnerUserId } = req.body;

  if (!newOwnerUserId) {
    res.status(400).json({ error: "newOwnerUserId is required" });
    return;
  }

  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    // 1. Verify caller is current owner
    if (org.owner.toString() !== req.user.id) {
      res.status(403).json({ error: "Forbidden: Only the owner can transfer ownership" });
      return;
    }

    // 2. Find target member in organization
    const targetMember = await Member.findOne({ userId: newOwnerUserId, organizationId: orgId });
    if (!targetMember) {
      res.status(400).json({ error: "New owner must be a member of the organization" });
      return;
    }

    // 3. Perform transfer: Update Organization owner field
    org.owner = newOwnerUserId;
    await org.save();

    // 4. Update Member roles: Demote old owner to 'Admin', promote new owner to 'Owner'
    await Member.findOneAndUpdate({ userId: req.user.id, organizationId: orgId }, { role: "Admin" });
    await Member.findOneAndUpdate({ userId: newOwnerUserId, organizationId: orgId }, { role: "Owner" });

    res.json({ message: "Ownership transferred successfully" });
  } catch (error) {
    req.log.error({ error }, "Error transferring ownership");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
