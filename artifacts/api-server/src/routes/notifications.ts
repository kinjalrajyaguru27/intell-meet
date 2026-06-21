import { Router } from "express";
import { Notification } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all notification endpoints
router.use(requireAuth);

// GET /api/notifications - List all notifications for the authenticated user
router.get("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100); // return last 100 notifications

    res.json(notifications);
  } catch (error) {
    req.log.error({ error }, "Error fetching notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/read-all - Mark all notifications of the user as read
router.put("/read-all", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    req.log.error({ error }, "Error marking all notifications as read");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/:notificationId/read - Mark a single notification as read
router.put("/:notificationId/read", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { notificationId } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json(notification);
  } catch (error) {
    req.log.error({ error }, "Error marking notification as read");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notifications - Helper endpoint to create mock notification (useful for testing)
router.post("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { recipient, type, title, content, link } = req.body;

  if (!recipient || !type || !title || !content) {
    res.status(400).json({ error: "recipient, type, title, and content are required fields" });
    return;
  }

  try {
    const notification = new Notification({
      recipient,
      type,
      title,
      content,
      link: link || "",
      isRead: false,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    req.log.error({ error }, "Error creating notification");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/notifications/:notificationId - Delete a single notification
router.delete("/:notificationId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { notificationId } = req.params;

  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user.id
    });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    req.log.error({ error }, "Error deleting notification");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
