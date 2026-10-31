import db from "../config/db.js";

/** Check every referenced record before a tenant-scoped write. */
export function assertAgencyReferences(agencyId: string, refs: Array<{ table: 'properties' | 'agents' | 'scheduled_posts' | 'branding' | 'templates' | 'posts'; id: number | string | null | undefined }>) {
  for (const { table, id } of refs) {
    if (id == null || id === '') continue;
    const found = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND agency_id = ?`).get(id, agencyId);
    if (!found) throw new Error(`Invalid or inaccessible ${table} reference`);
  }
}
