import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./server/config/db.js";
import { initPostWorker } from "./server/workers/postWorker.js";

// Import Routes
import authRoutes from "./server/routes/auth.js";
import propertyRoutes from "./server/routes/properties.js";
import agentRoutes from "./server/routes/agents.js";
import amenityRoutes from "./server/routes/amenities.js";
import brandingRoutes from "./server/routes/branding.js";
import templateRoutes from "./server/routes/templates.js";
import historyRoutes from "./server/routes/history.js";
import postRoutes from "./server/routes/posts.js";
import scheduleRoutes from "./server/routes/schedules.js";
import uploadRoutes from "./server/routes/uploads.js";
import leadRoutes from "./server/routes/leads.js";
import analyticsRoutes from "./server/routes/analytics.js";
import agencyRoutes from "./server/routes/agencies.js";
import campaignRoutes from "./server/routes/campaigns.js";
import aiRoutes from "./server/routes/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
initDb();

// Initialize Post Worker
try {
  initPostWorker();
  console.log("Post publishing worker initialized");
} catch (error) {
  console.error("Failed to initialize post worker:", error);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Static Files
  app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
  app.use("/uploads/posts", express.static(path.join(__dirname, "public/uploads/posts")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/properties", propertyRoutes);
  app.use("/api/agents", agentRoutes);
  app.use("/api/amenities", amenityRoutes);
  app.use("/api/branding", brandingRoutes);
  app.use("/api/templates", templateRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/scheduled_posts", scheduleRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/agencies", agencyRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api", uploadRoutes);

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
