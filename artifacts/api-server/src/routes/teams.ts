import { Router } from "express";
import crypto from "crypto";
import { Team, User, Invitation } from "@workspace/db";
import {
  CreateTeamBody,
  InviteTeamMemberBody,
  InviteToTeamBody,
  AcceptTeamInviteBody,
  RejectTeamInviteBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Use authentication for all team workspaces operations
router.use(requireAuth);

// GET /teams - List all teams user belongs to
router.get("/teams", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const teams = await Team.find({
      "members.user": req.user.id,
    })
      .populate("members.user", "name email role createdAt")
      .sort({ createdAt: -1 });

    const formatted = teams.map((team) => ({
      id: team._id.toString(),
      name: team.name,
      members: team.members.map((member: any) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString(),
        },
        role: member.role,
      })),
      createdAt: team.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    req.log.error({ error }, "Error fetching teams");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /teams - Create a new team workspace
router.post("/teams", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid team workspace data", details: parsed.error.format() });
    return;
  }

  try {
    const team = new Team({
      name: parsed.data.name,
      organizationId: req.body.organizationId || null,
      members: [
        {
          user: req.user.id,
          role: "Admin",
        },
      ],
    });

    await team.save();

    const populated = await Team.findById(team._id).populate("members.user", "name email role createdAt");
    if (!populated) {
      res.status(500).json({ error: "Failed to load created team" });
      return;
    }

    res.status(201).json({
      id: populated._id.toString(),
      name: populated.name,
      members: populated.members.map((member: any) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString(),
        },
        role: member.role,
      })),
      createdAt: populated.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error creating team");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /teams/:teamId/invite - Invite a user to a team by email (legacy)
router.post("/teams/:teamId/invite", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation data", details: parsed.error.format() });
    return;
  }

  const { email, role } = parsed.data;

  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Verify requesting user is Admin of the team
    const isRequesterAdmin = team.members.some(
      (m: any) => m.user.toString() === req.user?.id && m.role === "Admin"
    );
    if (!isRequesterAdmin && req.user.role !== "Admin") {
      res.status(403).json({ error: "Only team admins can invite members" });
      return;
    }

    // Find the target user by email
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({ error: `User with email ${email} not found` });
      return;
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some(
      (m: any) => m.user.toString() === targetUser._id.toString()
    );
    if (isAlreadyMember) {
      res.status(409).json({ error: "User is already a member of this team" });
      return;
    }

    // Add member
    team.members.push({
      user: targetUser._id as any,
      role: role as "Admin" | "Manager" | "Member",
    });

    await team.save();

    const populated = await Team.findById(team._id).populate("members.user", "name email role createdAt");
    if (!populated) {
      res.status(500).json({ error: "Failed to reload team after invitation" });
      return;
    }

    res.json({
      id: populated._id.toString(),
      name: populated.name,
      members: populated.members.map((member: any) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString(),
        },
        role: member.role,
      })),
      createdAt: populated.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error inviting team member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/team/invite - Invite a user by email to a team with confirmation workflow
router.post("/team/invite", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = InviteToTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation inputs", details: parsed.error.format() });
    return;
  }

  const { email, teamId, role } = parsed.data;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Verify requester has permission to invite (Admin/Manager role in the team, or global Admin)
    const requestingUserMembership = team.members.find(
      (m: any) => m.user.toString() === req.user?.id
    );

    const isAuthorized =
      req.user.role === "Admin" ||
      (requestingUserMembership &&
        (requestingUserMembership.role === "Admin" || requestingUserMembership.role === "Manager"));

    if (!isAuthorized) {
      res.status(403).json({ error: "Only team admins or managers can invite members" });
      return;
    }

    // Check if user is already a member
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser) {
      const isAlreadyMember = team.members.some(
        (m: any) => m.user.toString() === targetUser._id.toString()
      );
      if (isAlreadyMember) {
        res.status(409).json({ error: "User is already a member of this team" });
        return;
      }
    }

    // Check if a pending invite already exists
    const existingInvite = await Invitation.findOne({
      email: email.toLowerCase(),
      team: teamId,
      status: "Pending",
    });

    if (existingInvite) {
      res.status(409).json({ error: "An invitation is already pending for this email address" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = new Invitation({
      email: email.toLowerCase(),
      team: teamId,
      invitedBy: req.user.id,
      role: role || "Member",
      status: "Pending",
      token,
    });

    await invitation.save();

    const inviteLink = `${req.protocol}://${req.get("host")?.replace("5000", "5173")}/team/invite?token=${token}`;

    console.log(`
=========================================
[SMTP MOCK TRANSPORT] Team Invitation Mail
To: ${email}
Invited By: ${req.user.name} (${req.user.email})
Team Name: ${team.name}
Role Assigned: ${role}
Join Link: ${inviteLink}
=========================================
    `);

    res.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        teamId: invitation.team.toString(),
        invitedBy: invitation.invitedBy.toString(),
        role: invitation.role,
        status: invitation.status,
        token: invitation.token,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Error creating invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/team/accept - Accept a team invitation
router.post("/team/accept", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = AcceptTeamInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  const { token } = parsed.data;

  try {
    const invite = await Invitation.findOne({ token, status: "Pending" });
    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }

    const team = await Team.findById(invite.team);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Verify current user's email matches invitation email
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation was sent to a different email address" });
      return;
    }

    // Add member to team if not already present
    const isAlreadyMember = team.members.some(
      (m: any) => m.user.toString() === req.user?.id
    );

    if (!isAlreadyMember) {
      team.members.push({
        user: currentUser._id as any,
        role: invite.role as "Admin" | "Manager" | "Member",
      });
      await team.save();
    }

    invite.status = "Accepted";
    await invite.save();

    res.json({
      message: "Joined team successfully",
      teamId: team._id.toString(),
    });
  } catch (error) {
    req.log.error({ error }, "Error accepting invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/team/reject - Reject a team invitation
router.post("/team/reject", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = RejectTeamInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  const { token } = parsed.data;

  try {
    const invite = await Invitation.findOne({ token, status: "Pending" });
    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation belongs to a different user" });
      return;
    }

    invite.status = "Rejected";
    await invite.save();

    res.json({ message: "Invitation rejected successfully" });
  } catch (error) {
    req.log.error({ error }, "Error rejecting invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/team/invitation/:token - Inspect invitation details
router.get("/team/invitation/:token", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const invite = await Invitation.findOne({ token: req.params.token, status: "Pending" })
      .populate("team", "name")
      .populate("invitedBy", "name email");

    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation was sent to a different email address" });
      return;
    }

    res.json({
      id: invite._id.toString(),
      email: invite.email,
      team: {
        id: (invite.team as any)._id.toString(),
        name: (invite.team as any).name
      },
      invitedBy: {
        name: (invite.invitedBy as any).name,
        email: (invite.invitedBy as any).email
      },
      role: invite.role,
      status: invite.status,
      token: invite.token,
      createdAt: invite.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error fetching invitation details");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
