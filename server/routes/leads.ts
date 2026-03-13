import { Router } from "express";
import { leadController } from "../controllers/leadController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public endpoint for creating leads (e.g. from website or social media)
router.post("/", authenticateToken, leadController.createLead);

// Protected endpoints for managing leads
router.get("/", authenticateToken, leadController.getLeads);
router.get("/:id", authenticateToken, leadController.getLeadById);

export default router;
