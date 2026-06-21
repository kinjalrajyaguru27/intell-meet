import { Router } from "express";
import { Channel, Team } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all channel endpoints
router.use(requireAuth);

// GET /api/channels - List all channels the user has access to (all channels of the teams they belong to)
router.get("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const userTeams = await Team.find({ "members.user": req.user.id });
    const teamIds = userTeams.map((t) => t._id);
    const channels = await Channel.find({ teamId: { $in: teamIds } }).sort({ name: 1 });
    res.json(channels);
  } catch (error) {
    req.log.error({ error }, "Error fetching channels");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/channels/team/:teamId - List all channels in a specific team
router.get("/team/:teamId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { teamId } = req.params;

  try {
    const team = await Team.findOne({ _id: teamId, "members.user": req.user.id });
    if (!team) {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }

    const channels = await Channel.find({ teamId }).sort({ name: 1 });
    res.json(channels);
  } catch (error) {
    req.log.error({ error }, "Error fetching team channels");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/channels - Create a new channel
router.post("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, description, isPrivate, teamId } = req.body;

  if (!name || !teamId) {
    res.status(400).json({ error: "name and teamId are required fields" });
    return;
  }

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Verify requesting user is a member of the team
    const member = team.members.find((m: any) => m.user.toString() === req.user?.id);
    if (!member && req.user?.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }

    const channel = new Channel({
      name,
      description: description || "",
      isPrivate: !!isPrivate,
      teamId,
    });

    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    req.log.error({ error }, "Error creating channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/channels/:channelId - Delete a channel
router.delete("/:channelId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { channelId } = req.params;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    const team = await Team.findById(channel.teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Verify user is Admin or Manager of the team, or global Admin
    const member = team.members.find((m: any) => m.user.toString() === req.user?.id);
    const isAuthorized =
      req.user.role === "Admin" ||
      (member && (member.role === "Admin" || member.role === "Manager"));

    if (!isAuthorized) {
      res.status(403).json({ error: "Forbidden: Only team Admin/Manager can delete channels" });
      return;
    }

    await Channel.findByIdAndDelete(channelId);
    res.json({ message: "Channel deleted successfully" });
  } catch (error) {
    req.log.error({ error }, "Error deleting channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
