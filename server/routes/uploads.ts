import { Router } from "express";
import { 
  uploadFile, 
  uploadPostMedia 
} from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Local disk uploads are temporary development storage, not tenant-isolated
// durable object storage. Refuse them in production instead of accepting files
// that might disappear on restart or be publicly exposed.
router.use((_req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(503).json({
      error: "Uploads unavailable until agency-scoped durable media storage is configured"
    });
  }
  next();
});

router.post("/upload", authenticateToken, upload.single("image"), uploadFile);
router.post("/posts/media", authenticateToken, upload.single("media"), uploadPostMedia);

export default router;
