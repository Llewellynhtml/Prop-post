import db from "../config/db.js";
import { metricsService } from "./metricsService.js";

export const leadService = {
  getAll: (agencyId: string) => {
    return db.prepare(`
      SELECT l.*, p.title as propertyTitle, a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.agency_id = ?
      ORDER BY l.created_at DESC
    `).all(agencyId).map((l: any) => ({
      id: l.id,
      propertyId: l.property_id,
      postId: l.post_id,
      agentId: l.agent_id,
      source: l.source,
      contactName: l.contact_name,
      contactPhone: l.contact_phone,
      message: l.message,
      metadata: l.metadata ? JSON.parse(l.metadata) : undefined,
      createdAt: l.created_at,
      propertyTitle: l.propertyTitle,
      agentName: l.agentName
    }));
  },

  getById: (id: number | string, agencyId: string) => {
    const l: any = db.prepare(`
      SELECT l.*, p.title as propertyTitle, a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.id = ? AND l.agency_id = ?
    `).get(id, agencyId);
    
    if (!l) return null;

    return {
      id: l.id,
      propertyId: l.property_id,
      postId: l.post_id,
      agentId: l.agent_id,
      source: l.source,
      contactName: l.contact_name,
      contactPhone: l.contact_phone,
      message: l.message,
      metadata: l.metadata ? JSON.parse(l.metadata) : undefined,
      createdAt: l.created_at,
      propertyTitle: l.propertyTitle,
      agentName: l.agentName
    };
  },

  create: (data: {
    propertyId?: number;
    postId?: number;
    agentId?: number;
    source: string;
    contactName: string;
    contactPhone: string;
    message?: string;
    metadata?: any;
  }, agencyId: string) => {
    const { propertyId, postId, agentId, source, contactName, contactPhone, message, metadata } = data;
    const result = db.prepare(`
      INSERT INTO leads (agency_id, property_id, post_id, agent_id, source, contact_name, contact_phone, message, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, propertyId, postId, agentId, source, contactName, contactPhone, message, metadata ? JSON.stringify(metadata) : null);
    
    const leadId = result.lastInsertRowid;

    // Update property marketing score if propertyId is present
    if (propertyId) {
      metricsService.updateMetrics(propertyId);
    }

    return leadId;
  }
};
