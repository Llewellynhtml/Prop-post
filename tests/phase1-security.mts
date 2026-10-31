import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'proppost-security-'));
process.env.DATABASE_PATH = path.join(root, 'agency.db');
process.env.SEED_DEMO_DATA = 'false';
delete process.env.BOOTSTRAP_ADMIN_EMAIL;
delete process.env.BOOTSTRAP_ADMIN_PASSWORD;

try {
  const { default: db, initDb } = await import('../server/config/db.ts');
  const { propertyService } = await import('../server/services/propertyService.ts');
  initDb();

  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1, 'Foreign key enforcement required');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM properties').get().total, 0, 'Production data must start empty');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM scheduled_posts').get().total, 0, 'Never seed fake published posts');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM post_analytics').get().total, 0, 'Never fabricate analytics');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM leads').get().total, 0, 'Never fabricate leads');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM users').get().total, 0, 'No hard-coded administrator');

  const firstAgency = db.prepare('SELECT id FROM agencies LIMIT 1').get().id;
  const secondAgency = randomUUID();
  db.prepare('INSERT INTO agencies (id, name) VALUES (?, ?)').run(secondAgency, 'Another agency');
  const agent = db.prepare('INSERT INTO agents (agency_id, full_name) VALUES (?, ?)').run(secondAgency, 'Tenant B Agent').lastInsertRowid;
  const payload = { title: 'Tenant B home', price: 500000, location_city: 'Kimberley', location_area: 'CBD', bedrooms: 2, bathrooms: 1, parking: 1, floor_size_m2: 80, short_description: '', listing_type: 'sale', agent_id: agent, amenities: [], images: [{ url: 'data:image/png;base64,AAAA' }] };
  const targetId = propertyService.create(payload, secondAgency);
  const beforeImages = db.prepare('SELECT COUNT(*) AS n FROM property_images WHERE property_id = ?').get(targetId).n;
  assert.equal(beforeImages, 1);
  assert.equal(propertyService.update(targetId, { ...payload, images: [] }, firstAgency), false, 'Cross-tenant edit must be rejected');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM property_images WHERE property_id = ?').get(targetId).n, 1, 'Cross-tenant edit must not delete images');
  assert.throws(() => propertyService.create({ ...payload, title: 'Invalid assignment' }, firstAgency), /Agent does not belong/);
  assert.equal(propertyService.getById(targetId, firstAgency), null, 'Cross-tenant read must be rejected');
  assert.equal(propertyService.update(targetId, { ...payload, title: 'Updated title' }, secondAgency), true);
  assert.equal(db.prepare('SELECT title FROM properties WHERE id = ?').get(targetId).title, 'Updated title');
  db.close();
  console.log('Phase 1 security checks passed: tenant boundaries, SQLite integrity, and no fabricated data.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
