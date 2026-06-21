import { Router } from "express";
import { User } from "@workspace/db";
import { UpdateUserProfileBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { formatUserResponse } from "./auth";

const router = Router();

// Apply auth middleware to all user profile endpoints
router.use(requireAuth);

// GET /api/users/profile - Fetch authenticated user profile details
router.get("/profile", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    req.log.error({ error }, "Error fetching profile details");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile - Update authenticated user profile details
router.put("/profile", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile update parameters", details: parsed.error.format() });
    return;
  }

  const data = parsed.data;

  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || "";
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle || "";
    if (data.department !== undefined) updateData.department = data.department || "";
    if (data.bio !== undefined) updateData.bio = data.bio || "";
    if (data.timezone !== undefined) updateData.timezone = data.timezone || "UTC";
    if (data.avatar !== undefined) updateData.avatar = data.avatar || "";
    if (data.notificationSettings !== undefined) {
      updateData.notificationSettings = {
        email: data.notificationSettings.email ?? true,
        push: data.notificationSettings.push ?? true,
        sms: data.notificationSettings.sms ?? false,
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    req.log.error({ error }, "Error updating profile details");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
