import { Router } from "express";
import { Message, Channel, Team } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all messaging endpoints
router.use(requireAuth);

// GET /api/messages/dm/:userId - Fetch DM conversation history
router.get("/dm/:userId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id },
      ],
    })
      .populate("sender", "name email avatar")
      .populate("recipient", "name email avatar")
      .populate("file")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error fetching DM history");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/channel/:channelId - Fetch channel message history
router.get("/channel/:channelId", async (req: AuthenticatedRequest, res) => {
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

    // Verify user belongs to the channel's team (either owner or member)
    const team = await Team.findOne({
      _id: channel.teamId,
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
    });
    if (!team) {
      res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
      return;
    }

    const messages = await Message.find({ channel: channelId })
      .populate("sender", "name email avatar")
      .populate("file")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error fetching channel messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/search - Search text in user DMs and accessible channels
router.get("/search", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  try {
    const userTeams = await Team.find({
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
    });
    const teamIds = userTeams.map((t) => t._id);
    const userChannels = await Channel.find({ teamId: { $in: teamIds } });
    const channelIds = userChannels.map((c) => c._id);

    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
        { channel: { $in: channelIds } },
      ],
      text: { $regex: query, $options: "i" },
    })
      .populate("sender", "name email avatar")
      .populate("recipient", "name email avatar")
      .populate("channel", "name")
      .populate("file")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error searching messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages - Send a message via REST (alternative/compat to socket)
router.post("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { recipientId, channelId, text, fileId } = req.body;

  if (!text && !fileId) {
    res.status(400).json({ error: "Message text or fileId is required" });
    return;
  }

  try {
    const messageData: any = {
      sender: req.user.id,
      text: text || "",
    };

    if (recipientId) {
      messageData.recipient = recipientId;
    } else if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
      messageData.channel = channelId;
    } else {
      res.status(400).json({ error: "Either recipientId or channelId must be specified" });
      return;
    }

    if (fileId) {
      messageData.file = fileId;
    }

    const message = new Message(messageData);
    await message.save();

    const populated = await Message.findById(message._id)
      .populate("sender", "name email avatar")
      .populate("recipient", "name email avatar")
      .populate("file");

    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages/read - Mark messages as read by current user
router.post("/read", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { messageIds } = req.body;
  if (!messageIds || !Array.isArray(messageIds)) {
    res.status(400).json({ error: "messageIds must be an array of IDs" });
    return;
  }

  try {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ success: true });
  } catch (error) {
    req.log.error({ error }, "Error marking messages as read");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
