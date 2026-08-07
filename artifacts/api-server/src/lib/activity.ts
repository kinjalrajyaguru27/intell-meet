import { ActivityLog } from "@workspace/db";
import { logger } from "./logger";

export async function logActivity(
  userId: string,
  action: string,
  entityId: string,
  entityType: string,
  details: string
) {
  try {
    const log = new ActivityLog({
      userId,
      action,
      entityId,
      entityType,
      details,
      createdAt: new Date(),
    });
    await log.save();
    logger.info({ userId, action, entityId, entityType }, "Activity logged successfully");
  } catch (error) {
    logger.error({ error }, "Failed to save ActivityLog");
  }
}

export async function detectAndSendMentions(
  text: string,
  sender: { id: string; name?: string },
  link?: string
) {
  if (!text || !text.includes("@")) return;
  try {
    const { User } = await import("@workspace/db");
    const { pushNotificationToUser } = await import("../signaling");

    const matches = text.match(/@([a-zA-Z0-9._-]+)/g);
    if (!matches || matches.length === 0) return;

    const names = Array.from(new Set(matches.map((m) => m.substring(1).toLowerCase())));

    for (const nameQuery of names) {
      const users = await User.find({
        $or: [
          { name: { $regex: nameQuery, $options: "i" } },
          { email: { $regex: nameQuery, $options: "i" } }
        ]
      });

      for (const u of users) {
        const uId = u._id.toString();
        if (uId !== sender.id) {
          const senderName = sender.name || "Someone";
          const snippet = text.length > 80 ? text.substring(0, 80) + "..." : text;
          await pushNotificationToUser(
            uId,
            "mention",
            `Mentioned by ${senderName}`,
            `${senderName} mentioned you: "${snippet}"`,
            link || "/collaboration"
          );
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Error sending mention notifications");
  }
}
