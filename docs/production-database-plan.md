# Prop-post production database and deployment decision (Phase 1)

## Current state
- The API uses synchronous `better-sqlite3` in `server/config/db.ts`.
- `DATABASE_PATH` configures the SQLite file. The API creates its parent folder and enables WAL, foreign-key checks and busy-timeout.
- The Vite application on **static Hostinger hosting is only a frontend**. It cannot use the SQLite database without a running backend API. Do not treat frontend-only deployment as a SaaS deployment.
- Authentication requires a 32+-character `JWT_SECRET` in the backend environment. Bootstrap credentials must never be committed.

## Recommendation
For a production **multi-agency SaaS**, choose managed PostgreSQL with automated snapshots / point-in-time recovery, TLS and connection pooling. This requires a **database adapter + migration** for every query (the current SQLite-based implementation cannot connect to PostgreSQL simply by changing an environment variable). Keep the current SQLite setup restricted to local development and a tightly controlled single-instance pilot.

### Interim single-instance SQLite pilot (not a production HA architecture)
Only if the host supports a Node.js 22 backend with:
1. One API instance bound to a dedicated **persistent volume** holding `DATABASE_PATH`; no ephemeral container directory. Do not horizontally scale SQLite across machines or attach a network volume that lacks reliable locking.
2. `JWT_SECRET` and optional bootstrap admin credentials held as platform secrets. Disable demo seeding.
3. Same-origin `/api/**` proxy to the backend and restricted CORS and origin config; HTTPS on the public domain.
4. One-way schema migrations tested against a backup, no arbitrary reinitialization, and foreign keys enabled on every connection.
5. Daily **online SQLite backups using the backup API**, copied off-host, encrypted and retained according to policy. A raw copy of the DB file while WAL is active is not a reliable backup plan.
6. A restore drill against a disposable environment, `PRAGMA integrity_check`, and reconciled agency counts before accepting traffic.
7. Monitoring for disk space, backup failures, API availability, error rates and restart recovery.

### PostgreSQL production path
1. Inventory each SQLite schema/table, query, implicit type and foreign-key relationship. Model agencies, user membership, properties, leads and posts with mandatory `agency_id`.
2. Create versioned forward-only migrations and constraints, including tenant-local foreign-key ownership where possible.
3. Use pooled TLS client connections and server-side authentication/authorization. Derive agency ID exclusively from verified user membership, never a request body.
4. Run transaction and tenant-isolation integration tests against disposable PostgreSQL instances.
5. Migrate data via a verified, repeatable ETL process: preserve primary keys, normalize timestamps, perform row counts/checksums and map IDs; never blindly move demo records.
6. Set up automated backups and point-in-time recovery, practice restoring to a staging environment, and document retention and access controls.
7. Stage the API separately from the static web app; verify `/api/health`, login, CRUD, image uploads, screenshot exports, scheduled calendar plans and negative cross-tenant tests before updating production traffic.

## Outstanding blockers
- The agency-wide CRUD, upload and analytics audit is still in progress; unit-level guards are not a complete multitenancy security proof.
- Uploads are currently local files, not durable multi-instance object storage, and need media ownership rules and safe CORS responses.
- Real social platform publishing is **not available**. Scheduled posts are calendar plans and must never be reported as published.
- The in-memory fallback scheduler is non-durable; do not use it for a production publishing guarantee.
- Set API rate limiting, body/upload size validation, audit events, secrets rotation, error redaction and backup recovery before public launch.

**Release gate:** keep PR #1, #2 and #3 unmerged and the Hostinger deployment unchanged until these checks are met.
