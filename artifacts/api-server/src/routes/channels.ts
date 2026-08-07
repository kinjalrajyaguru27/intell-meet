import { Router } from "express";
import { Channel, Team, Message, Participant, User } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { ioInstance } from "../signaling";

const router = Router();

// Apply auth middleware to all channel endpoints
router.use(requireAuth);

// Helper to broadcast socket events
const broadcastChannelEvent = (eventName: string, payload: any, targetUserIds?: string[]) => {
  if (!ioInstance) return;
  if (targetUserIds && targetUserIds.length > 0) {
    targetUserIds.forEach((uid) => {
      ioInstance?.to(`user:${uid}`).emit(eventName, payload);
    });
  } else {
    ioInstance.emit(eventName, payload);
  }
};

// GET /api/channels/meeting-attendees - Get attendees from past meetings to easily add as channel members
router.get("/meeting-attendees", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // 1. Fetch participants recorded in meetings
    const participants = await Participant.find().populate("user", "name email avatar");
    const registeredUsers = await User.find({ _id: { $ne: req.user.id } }).select("name email avatar role");

    const userMap = new Map<string, any>();

    // Add registered workspace users first
    registeredUsers.forEach((u) => {
      userMap.set(u._id.toString(), {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatar: u.avatar || "",
        isRegistered: true,
        source: "Workspace User",
      });
    });

    // Merge meeting participants
    participants.forEach((p: any) => {
      if (p.user && p.user._id.toString() !== req.user?.id) {
        userMap.set(p.user._id.toString(), {
          id: p.user._id.toString(),
          name: p.user.name || p.displayName,
          email: p.user.email || "",
          avatar: p.user.avatar || "",
          isRegistered: true,
          source: `Meeting Participant (${p.displayName})`,
        });
      }
    });

    const attendees = Array.from(userMap.values());
    res.json(attendees);
  } catch (error) {
    req.log.error({ error }, "Error fetching meeting attendees");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/channels - List all channels accessible to user
router.get("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const userTeams = await Team.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    });
    const teamIds = userTeams.map((t) => t._id);

    // Channels where user is creator, explicit member, or in public team channel
    const channels = await Channel.find({
      teamId: { $in: teamIds },
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id },
        { isPrivate: false, members: { $exists: true, $size: 0 } },
        { createdBy: { $exists: false } }
      ]
    })
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ name: 1 });

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
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    });
    if (!team) {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }

    const channels = await Channel.find({ teamId })
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ name: 1 });

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

  const { name, description, isPrivate, teamId, initialMembers } = req.body;

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

    const member = team.members.find((m: any) => m.user.toString() === req.user?.id);
    const isOwner = team.owner?.toString() === req.user?.id;
    if (!member && !isOwner && req.user?.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }

    const memberIds = Array.from(new Set([req.user.id, ...(initialMembers || [])]));

    const channel = new Channel({
      name,
      description: description || "",
      isPrivate: !!isPrivate,
      teamId,
      createdBy: req.user.id,
      members: memberIds,
    });

    await channel.save();
    const populated = await Channel.findById(channel._id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    // Real-time Socket sync: notify all channel members
    broadcastChannelEvent("channel-created", populated, memberIds);

    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/channels/:channelId - Permanently delete a channel (Only host/creator)
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
    const isHost = channel.createdBy ? channel.createdBy.toString() === req.user.id : false;
    const isTeamOwner = team ? team.owner?.toString() === req.user.id : false;
    const isGlobalAdmin = req.user.role === "Admin";

    if (!isHost && !isTeamOwner && !isGlobalAdmin) {
      res.status(403).json({ error: "Forbidden: Only the host (channel creator) can delete this collaboration channel." });
      return;
    }

    const allMemberIds = (channel.members || []).map((m: any) => m.toString());

    // Purge channel & all associated messages
    await Message.deleteMany({ channel: channelId });
    await Channel.findByIdAndDelete(channelId);

    // Real-time socket sync: broadcast deletion to all members and channel room
    if (ioInstance) {
      ioInstance.to(channelId).emit("channel-deleted", { channelId });
      ioInstance.emit("channel-deleted", { channelId });
    }

    res.json({ message: "Channel and all associated messages permanently deleted." });
  } catch (error) {
    req.log.error({ error }, "Error deleting channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/channels/:channelId/leave - Leave a collaboration channel
router.post("/:channelId/leave", async (req: AuthenticatedRequest, res) => {
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

    const isHost = channel.createdBy ? channel.createdBy.toString() === req.user.id : false;
    if (isHost) {
      res.status(400).json({ error: "Host cannot leave the channel. Please delete the channel or transfer host permissions." });
      return;
    }

    channel.members = (channel.members || []).filter((m: any) => m.toString() !== req.user?.id);
    await channel.save();

    const updated = await Channel.findById(channelId)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    // Real-time sync
    if (ioInstance) {
      ioInstance.to(`user:${req.user.id}`).emit("channel-removed", { channelId });
      ioInstance.to(channelId).emit("channel-updated", updated);
    }

    res.json({ message: "Successfully left channel", channel: updated });
  } catch (error) {
    req.log.error({ error }, "Error leaving channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/channels/:channelId/members - Add members to channel (Host only)
router.post("/:channelId/members", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { channelId } = req.params;
  const { userIds } = req.body; // string[]

  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({ error: "userIds array is required" });
    return;
  }

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    const team = await Team.findById(channel.teamId);
    const isHost = channel.createdBy ? channel.createdBy.toString() === req.user.id : false;
    const isTeamOwner = team ? team.owner?.toString() === req.user.id : false;

    if (!isHost && !isTeamOwner && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Only the channel host can manage channel members." });
      return;
    }

    const currentMemberIds = (channel.members || []).map((m: any) => m.toString());
    const newMemberIds = Array.from(new Set([...currentMemberIds, ...userIds]));

    channel.members = newMemberIds;
    await channel.save();

    const updated = await Channel.findById(channelId)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    // Broadcast sync to updated members
    broadcastChannelEvent("channel-updated", updated);
    broadcastChannelEvent("channel-created", updated, userIds);

    res.json(updated);
  } catch (error) {
    req.log.error({ error }, "Error adding members to channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/channels/:channelId/members/:memberId - Remove a member from channel (Host only)
router.delete("/:channelId/members/:memberId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { channelId, memberId } = req.params;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    const isHost = channel.createdBy ? channel.createdBy.toString() === req.user.id : false;
    if (!isHost && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Only the host can remove members." });
      return;
    }

    if (channel.createdBy && channel.createdBy.toString() === memberId) {
      res.status(400).json({ error: "Cannot remove the channel host/creator." });
      return;
    }

    channel.members = (channel.members || []).filter((m: any) => m.toString() !== memberId);
    await channel.save();

    const updated = await Channel.findById(channelId)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    if (ioInstance) {
      ioInstance.to(`user:${memberId}`).emit("channel-removed", { channelId });
      ioInstance.to(channelId).emit("channel-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    req.log.error({ error }, "Error removing member from channel");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
