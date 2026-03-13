import db from "../config/db.js";

export const analyticsService = {
  getDashboardStats: (agencyId: string) => {
    const totalProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE agency_id = ?").get(agencyId) as { count: number };
    const activeCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE agency_id = ?").get(agencyId) as { count: number };
    const totalLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE agency_id = ?").get(agencyId) as { count: number };
    const scheduledPosts = db.prepare("SELECT COUNT(*) as count FROM scheduled_posts WHERE status = 'scheduled' AND agency_id = ?").get(agencyId) as { count: number };
    
    const analyticsStats = db.prepare(`
      SELECT 
        SUM(pa.clicks) as totalClicks, 
        SUM(pa.impressions) as totalImpressions 
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.agency_id = ?
    `).get(agencyId) as { totalClicks: number, totalImpressions: number };

    return {
      totalProperties: totalProperties.count,
      activeCampaigns: activeCampaigns.count,
      totalLeads: totalLeads.count,
      scheduledPosts: scheduledPosts.count,
      totalClicks: analyticsStats.totalClicks || 0,
      totalImpressions: analyticsStats.totalImpressions || 0
    };
  },

  getTopProperties: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        p.title,
        COUNT(l.id) as leadCount,
        SUM(pa.clicks) as clickCount,
        SUM(pa.impressions) as impressionCount,
        COALESCE(pm.marketing_score, 0) as marketingScore
      FROM properties p
      LEFT JOIN leads l ON p.id = l.property_id
      LEFT JOIN post_analytics pa ON p.id = (SELECT property_id FROM scheduled_posts WHERE id = pa.post_id)
      LEFT JOIN property_metrics pm ON p.id = pm.property_id
      WHERE p.agency_id = ?
      GROUP BY p.id
      ORDER BY marketingScore DESC, leadCount DESC
      LIMIT 5
    `).all(agencyId);
  },

  getPlatformPerformance: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        pa.platform,
        SUM(pa.likes) as likes,
        SUM(pa.comments) as comments,
        SUM(pa.shares) as shares,
        SUM(pa.clicks) as clicks,
        SUM(pa.impressions) as impressions
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.agency_id = ?
      GROUP BY pa.platform
    `).all(agencyId);
  },

  getLeadsPerAgent: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        a.full_name as agentName,
        a.profile_photo_url as profilePhoto,
        COUNT(l.id) as leadCount
      FROM agents a
      LEFT JOIN leads l ON a.id = l.agent_id
      WHERE a.agency_id = ?
      GROUP BY a.id
      ORDER BY leadCount DESC
    `).all(agencyId);
  },

  getLeadsByPlatform: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        source as platform,
        COUNT(*) as count
      FROM leads
      WHERE agency_id = ?
      GROUP BY source
      ORDER BY count DESC
    `).all(agencyId);
  },

  getLeadsByProperty: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        p.title as propertyTitle,
        COUNT(l.id) as leadCount
      FROM properties p
      JOIN leads l ON p.id = l.property_id
      WHERE p.agency_id = ?
      GROUP BY p.id
      ORDER BY leadCount DESC
      LIMIT 5
    `).all(agencyId);
  },

  getRecentLeads: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        l.*,
        p.title as propertyTitle,
        a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.agency_id = ?
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all(agencyId);
  },

  getRecentActivity: (agencyId: string) => {
    const properties = db.prepare(`
      SELECT 'property_added' as type, title as label, created_at as timestamp 
      FROM properties WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const agents = db.prepare(`
      SELECT 'agent_created' as type, full_name as label, created_at as timestamp 
      FROM agents WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const scheduled = db.prepare(`
      SELECT 'post_scheduled' as type, property_title as label, created_at as timestamp 
      FROM scheduled_posts WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const leads = db.prepare(`
      SELECT 'lead_received' as type, contact_name as label, created_at as timestamp 
      FROM leads WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    return [...properties, ...agents, ...scheduled, ...leads]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  },

  getPropertyPerformance: (propertyId: number, agencyId: string) => {
    // Verify ownership
    const property = db.prepare("SELECT id FROM properties WHERE id = ? AND agency_id = ?").get(propertyId, agencyId);
    if (!property) throw new Error("Property not found");

    const stats = db.prepare(`
      SELECT 
        SUM(pa.likes) as likes,
        SUM(pa.comments) as comments,
        SUM(pa.shares) as shares,
        SUM(pa.clicks) as clicks,
        SUM(pa.impressions) as impressions
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.property_id = ? AND sp.agency_id = ?
    `).get(propertyId, agencyId) as any;

    const leads = db.prepare(`
      SELECT COUNT(*) as count FROM leads WHERE property_id = ? AND agency_id = ?
    `).get(propertyId, agencyId) as { count: number };

    const platformBreakdown = db.prepare(`
      SELECT 
        pa.platform,
        SUM(pa.clicks) as clicks,
        SUM(pa.impressions) as impressions
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.property_id = ? AND sp.agency_id = ?
      GROUP BY pa.platform
    `).all(propertyId, agencyId);

    return {
      stats: {
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
        clicks: stats.clicks || 0,
        impressions: stats.impressions || 0,
        leads: leads.count || 0
      },
      platformBreakdown
    };
  }
};
