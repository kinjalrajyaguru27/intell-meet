import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@workspace/db";

const JWT_SECRET = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    name: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: "Admin" | "Manager" | "Member";
      name: string;
    };

    // Verify user still exists in DB
    const userExists = await User.findById(decoded.id);
    if (!userExists) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
