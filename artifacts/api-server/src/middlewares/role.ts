import { type Response, type NextFunction } from "express";
import { type AuthenticatedRequest } from "./auth";

export function requireRole(allowedRoles: Array<"Admin" | "Manager" | "Member">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
}
