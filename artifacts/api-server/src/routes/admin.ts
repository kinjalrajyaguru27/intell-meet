import { Router } from "express";
import { User, Team } from "@workspace/db";
import { AdminUpdateUserRoleBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { formatUserResponse } from "./auth";

const router = Router();

// Apply global middlewares to all admin endpoints: must be authenticated and must be an Admin
router.use(requireAuth);
router.use(requireRole(["Admin"]));

// GET /api/admin/users - List all registered users (Admin only)
router.get("/users", async (req: AuthenticatedRequest, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    const formatted = users.map((user) => formatUserResponse(user));

    res.json(formatted);
  } catch (error) {
    req.log.error({ error }, "Error in admin list users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/users/:userId/role - Change user platform role (Admin only)
router.put("/users/:userId/role", async (req: AuthenticatedRequest, res) => {
  const parsed = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role payload", details: parsed.error.format() });
    return;
  }

  const { role } = parsed.data;

  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent Admin from demoting themselves to avoid lockout
    if (targetUser._id.toString() === req.user?.id && role !== "Admin") {
      res.status(400).json({ error: "You cannot change your own admin role" });
      return;
    }

    targetUser.role = role as "Admin" | "Manager" | "Member";
    await targetUser.save();

    res.json(formatUserResponse(targetUser));
  } catch (error) {
    req.log.error({ error }, "Error updating user role");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:userId - Delete a user account (Admin only)
router.delete("/users/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.userId;

    // Prevent Admin from deleting themselves
    if (userId === req.user?.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Remove user from all teams memberships
    await Team.updateMany(
      { "members.user": userId },
      { $pull: { members: { user: userId } } }
    );

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    req.log.error({ error }, "Error deleting user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
