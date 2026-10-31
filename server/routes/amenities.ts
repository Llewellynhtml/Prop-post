import { Router } from "express";
import { 
  getAmenities, 
} from "../controllers/amenityController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getAmenities);
// Global amenity vocabulary is read-only until tenant-owned amenities are modeled.
// Do not allow one agency to delete globally shared amenities.

export default router;
