import { Response } from "express";
import { leadService } from "../services/leadService.js";
import { AuthRequest } from "../middleware/auth.js";

export const leadController = {
  getLeads: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const leads = leadService.getAll(agencyId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  },

  getLeadById: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const lead = leadService.getById(req.params.id, agencyId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  },

  createLead: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { propertyId, postId, agentId, source, contactName, contactPhone, message, metadata } = req.body;
      
      if (!source || !contactName || !contactPhone) {
        return res.status(400).json({ error: "Missing required fields: source, contactName, contactPhone" });
      }

      const id = leadService.create({
        propertyId,
        postId,
        agentId,
        source,
        contactName,
        contactPhone,
        message,
        metadata
      }, agencyId);

      const newLead = leadService.getById(id as number, agencyId);
      res.status(201).json(newLead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  }
};
