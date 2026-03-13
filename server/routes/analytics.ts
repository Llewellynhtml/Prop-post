import express from "express";
import { analyticsController } from "../controllers/analyticsController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, analyticsController.getDashboardData);
router.get("/property/:propertyId", authenticateToken, analyticsController.getPropertyPerformance);

export default router;
