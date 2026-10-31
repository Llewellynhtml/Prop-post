import db from "../config/db.js";
import { assertAgencyReferences } from "./tenantGuard.js";
import { schedulerService } from "./scheduler.js";

export const scheduleService = {
  getAll: (agencyId: string) => {
    const posts = db.prepare("SELECT * FROM scheduled_posts WHERE agency_id = ? ORDER BY date ASC, time ASC").all(agencyId) as any[];
    return posts.map(p => ({
      ...p,
      platforms: JSON.parse(p.platforms),
      propertyTitle: p.property_title,
      agentName: p.agent_name,
      imageURL: p.image_url
    }));
  },

  create: async (data: any, agencyId: string) => {
    const { propertyId, agentId, propertyTitle, agentName, platforms, caption, imageURL, date, time } = data;
    assertAgencyReferences(agencyId, [
      { table: 'properties', id: propertyId },
      { table: 'agents', id: agentId }
    ]);
    const result = db.prepare(`
      INSERT INTO scheduled_posts (agency_id, property_id, agent_id, property_title, agent_name, platforms, caption, image_url, date, time, status, attempts, publish_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, propertyId, agentId, propertyTitle, agentName, JSON.stringify(platforms), caption, imageURL, date, time, 'scheduled', 0, 'manual_required');
    
    const postId = Number(result.lastInsertRowid);

    // These are calendar plans, not queued promises to publish.
    // Do not enqueue an unsupported publishing operation.
    return postId;

  },

  delete: async (id: string | number, agencyId: string) => {
    // Verify ownership
    const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
    if (!post) return { changes: 0 };

    // Cancel the job in BullMQ
    try {
      await schedulerService.cancelPost(Number(id));
    } catch (error) {
      console.error(`Failed to cancel job for post ${id}:`, error);
    }
    
    return db.prepare("DELETE FROM scheduled_posts WHERE id = ?").run(id);
  },

  postNow: async (id: string | number, agencyId: string) => {
    const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
    if (!post) throw new Error("Post not found");
    // Do not accept an immediate publishing request until a real provider is connected.
    throw new Error("Direct publishing is not configured. Export the post for manual publishing.");
  },

  reschedule: async (id: string | number, date: string, time: string, agencyId: string) => {
    try {
      // Verify ownership
      const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
      if (!post) throw new Error("Post not found");

      // Update database
      db.prepare(`
        UPDATE scheduled_posts 
        SET date = ?, time = ?, status = 'scheduled', publish_status = 'manual_required'
        WHERE id = ?
      `).run(date, time, id);

      // Calendar planning only. Direct publishing is not connected.
      return true;
    } catch (error) {
      console.error(`Failed to reschedule post ${id}:`, error);
      throw error;
    }
  }
};
