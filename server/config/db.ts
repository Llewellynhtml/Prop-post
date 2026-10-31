import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The DB file should be in the root relative to this file
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, "../../proppost.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// Initialize Database with comprehensive schema
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager', 'agent')) NOT NULL,
      office_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'ZAR',
      location_city TEXT NOT NULL,
      location_area TEXT NOT NULL,
      address_optional TEXT,
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      parking INTEGER DEFAULT 0,
      floor_size_m2 INTEGER DEFAULT 0,
      erf_size_m2 INTEGER,
      short_description TEXT,
      long_description TEXT,
      listing_type TEXT CHECK(listing_type IN ('rent', 'sale')) DEFAULT 'sale',
      status TEXT CHECK(status IN ('available', 'sold', 'pending', 'archived')) DEFAULT 'available',
      agent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon_optional TEXT
    );

    CREATE TABLE IF NOT EXISTS property_amenities (
      property_id INTEGER,
      amenity_id INTEGER,
      priority_score INTEGER DEFAULT 0,
      PRIMARY KEY (property_id, amenity_id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY(amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      image_url TEXT NOT NULL,
      caption_optional TEXT,
      sort_order INTEGER DEFAULT 0,
      is_hero BOOLEAN DEFAULT 0,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      full_name TEXT NOT NULL,
      role_optional TEXT,
      cellphone_number TEXT,
      email TEXT,
      profile_photo_url TEXT,
      whatsapp_number TEXT,
      office_number_optional TEXT,
      bio_optional TEXT,
      linkedin_url_optional TEXT,
      instagram_url_optional TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      style_theme TEXT,
      supported_formats TEXT,
      thumbnail_url TEXT,
      description TEXT,
      tags TEXT,
      listing_status TEXT,
      version INTEGER DEFAULT 1,
      layout_rules TEXT,
      is_favorite BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS branding (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      company_name TEXT NOT NULL,
      logo_url TEXT,
      watermark_logo_optional_url TEXT,
      primary_color_hex TEXT DEFAULT '#1E97AB',
      secondary_color_hex TEXT DEFAULT '#359288',
      accent_color_hex TEXT DEFAULT '#518E58',
      background_color_hex TEXT DEFAULT '#FEFEFE',
      heading_font_family TEXT DEFAULT 'Montserrat',
      body_font_family TEXT DEFAULT 'Montserrat',
      website_url TEXT DEFAULT 'www.proppost.co.za',
      default_cta_text TEXT DEFAULT 'WhatsApp Now',
      default_hashtags_optional TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      agent_id INTEGER,
      brand_id INTEGER,
      template_id INTEGER,
      platform TEXT,
      aspect_ratio TEXT,
      style TEXT,
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id),
      FOREIGN KEY(brand_id) REFERENCES branding(id),
      FOREIGN KEY(template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      user_id INTEGER,
      content TEXT,
      visibility TEXT CHECK(visibility IN ('public', 'friends', 'only_me')) DEFAULT 'public',
      location TEXT,
      platform TEXT,
      dimensions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      agent_id INTEGER,
      property_title TEXT,
      agent_name TEXT,
      platforms TEXT,
      caption TEXT,
      image_url TEXT,
      date TEXT,
      time TEXT,
      status TEXT CHECK(status IN ('scheduled', 'posted', 'failed')) DEFAULT 'scheduled',
      attempts INTEGER DEFAULT 0,
      last_attempt DATETIME,
      failure_reason TEXT,
      publish_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      post_id INTEGER,
      agent_id INTEGER,
      source TEXT CHECK(source IN ('website', 'instagram', 'facebook', 'linkedin', 'whatsapp')) NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      message TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE SET NULL,
      FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE SET NULL,
      FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS post_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      platform TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id TEXT,
      property_id INTEGER,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_posts (
      campaign_id INTEGER,
      post_id INTEGER,
      PRIMARY KEY (campaign_id, post_id),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_metrics (
      property_id INTEGER PRIMARY KEY,
      posts_created INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      total_reach INTEGER DEFAULT 0,
      marketing_score INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    -- Add columns if they don't exist (for existing databases)
    PRAGMA table_info(scheduled_posts);
  `);

  // Helper to add column if it doesn't exist
  const addColumn = (table: string, column: string, type: string) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!info.find(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };

  addColumn('scheduled_posts', 'attempts', 'INTEGER DEFAULT 0');
  addColumn('scheduled_posts', 'last_attempt', 'DATETIME');
  addColumn('scheduled_posts', 'failure_reason', 'TEXT');
  addColumn('scheduled_posts', 'publish_status', 'TEXT');

  // Add agency_id to all relevant tables
  const tablesToUpdate = [
    'users', 'properties', 'agents', 'templates', 'posts', 
    'scheduled_posts', 'leads', 'branding'
  ];
  tablesToUpdate.forEach(table => addColumn(table, 'agency_id', 'TEXT'));
  addColumn('properties', 'agent_id', 'INTEGER');

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      media_url TEXT NOT NULL,
      media_type TEXT CHECK(media_type IN ('image', 'video')) NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // Development fixtures are opt-in. Real tenants start with empty properties
  // and metrics; never manufacture successful social posts or leads.
  const demoMode = process.env.SEED_DEMO_DATA === "true" && process.env.NODE_ENV !== "production";
  let defaultAgencyId = "";
  const existingAgency = db.prepare("SELECT id FROM agencies ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
  if (existingAgency) defaultAgencyId = existingAgency.id;
  if (!existingAgency) {
    defaultAgencyId = randomUUID();
    db.prepare("INSERT INTO agencies (id, name) VALUES (?, ?)").run(
      defaultAgencyId, process.env.BOOTSTRAP_AGENCY_NAME || "Initial Agency"
    );
  }
  if (demoMode) {
    console.log("[Database] Demo fixture seeding enabled for development.");
    const propertyCount = db.prepare("SELECT COUNT(*) as count FROM properties").get() as { count: number };
    if (propertyCount.count === 0) {
      const insertProp = db.prepare("INSERT INTO properties (agency_id, title, price, location_city, location_area, listing_type) VALUES (?, ?, ?, ?, ?, ?)");
      insertProp.run(defaultAgencyId, "EXAMPLE • Demo property", 1250000, "Kimberley", "Central", "sale");
    }
  }

  // Bootstrap only with explicit, server-side credentials.
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0 && process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
      throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters");
    }
    const passwordHash = bcrypt.hashSync(process.env.BOOTSTRAP_ADMIN_PASSWORD, 12);
    db.prepare(`
      INSERT INTO users (agency_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(defaultAgencyId, "System Admin", process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim(), passwordHash, "admin");
    console.log("Initial administrator created from secure environment configuration");
  }
};

export default db;
