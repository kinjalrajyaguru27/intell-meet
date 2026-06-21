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
