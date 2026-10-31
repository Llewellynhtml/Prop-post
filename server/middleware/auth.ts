import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured (at least 32 characters)");
  return secret;
};

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    agency_id: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    // JWT claims can be stale after an account is disabled or moved.
    // Resolve current role and agency membership from the database.
    const identity = Number(decoded.id);
    if (!Number.isSafeInteger(identity) || identity <= 0) {
      return res.status(403).json({ error: "Invalid account identity." });
    }
    const active = db.prepare("SELECT id, email, role, agency_id FROM users WHERE id = ?").get(identity) as AuthRequest['user'] | undefined;
    if (!active?.agency_id || active.email !== decoded.email || active.agency_id !== decoded.agency_id) {
      return res.status(403).json({ error: "Account access has changed. Sign in again." });
    }
    req.user = active;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
