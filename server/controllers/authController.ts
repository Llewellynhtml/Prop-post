import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { AuthRequest } from "../middleware/auth.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured (at least 32 characters)");
  return secret;
};

// Public account creation is disabled until secure agency invitations are implemented.
// Never accept role or agency_id from an unauthenticated request.
export const register = async (_req: Request, res: Response) => {
  return res.status(403).json({ error: "Public registration is disabled. Contact your agency administrator." });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, agency_id: user.agency_id },
      getJwtSecret(),
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agency_id: user.agency_id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = db.prepare("SELECT id, name, email, role, agency_id, created_at FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};
