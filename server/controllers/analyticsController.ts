import { Response } from "express";
import { analyticsService } from "../services/analyticsService.js";
import { AuthRequest } from "../middleware/auth.js";

export const analyticsController = {
  getDashboardData: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

      const stats = analyticsService.getDashboardStats(agencyId);
      const topProperties = analyticsService.getTopProperties(agencyId);
      const platformPerformance = analyticsService.getPlatformPerformance(agencyId);
      const leadsPerAgent = analyticsService.getLeadsPerAgent(agencyId);
      const leadsByPlatform = analyticsService.getLeadsByPlatform(agencyId);
      const leadsByProperty = analyticsService.getLeadsByProperty(agencyId);
      const recentLeads = analyticsService.getRecentLeads(agencyId);
      const recentActivity = analyticsService.getRecentActivity(agencyId);

      res.json({
        stats,
        topProperties,
        platformPerformance,
        leadsPerAgent,
        leadsByPlatform,
        leadsByProperty,
        recentLeads,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  },

  getPropertyPerformance: async (req: AuthRequest, res: Response) => {
    try {
      const { propertyId } = req.params;
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }
      const data = analyticsService.getPropertyPerformance(Number(propertyId), agencyId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching property performance:", error);
      res.status(500).json({ error: "Failed to fetch property performance" });
    }
  }
};
