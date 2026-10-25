# Pre-Migration Backup (Free Plan)

The Free plan has no restorable backups, so every live DB change is preceded by these steps. The example is `20261025_print_pipeline_hardening.sql`.

> The CLI and connection steps in step 2 are from memory and could not be checked against supabase.com from the sandbox. If a dashboard label differs, follow the dashboard.

## 1. In-database snapshot (required, ~1 min)

Covers exactly what the migration changes: the RLS policies on `events`, `photos`, `print_jobs` and `storage.objects`, plus the `print_jobs` rows.

1. SQL editor → run `supabase/rollback/20261025_snapshot.sql`.
2. Check the final result. `policies` should equal the number of policies on those four tables, and `print_jobs_rows` should be `32`.
3. Optional: run `SELECT create_stmt FROM backup_20261025.policies;` and export the result (CSV) to your machine, so you also have an off-database copy of the policy definitions.

The snapshot lives in schema `backup_20261025`. That schema isn't exposed by the API and has no grants for `anon` / `authenticated`.

**Rollback:** run `supabase/rollback/20261025_restore_policies_snapshot.sql`. It drops every current policy on those four tables, recreates the snapshot exactly, and drops the two helper functions the migration added. It runs as one transaction. Its last query should return 0 rows (no difference from the snapshot).

This round trip (snapshot → migrate → restore) was tested on a local Postgres 16 copy, and the restored policies came back identical.

## 2. Off-site logical dump (recommended)

Protects against anything beyond this migration (e.g. a destructive Share cleanup later).

1. **Connection string:** Dashboard → **Connect** → **Session pooler** (port 5432). The direct `db.<ref>.supabase.co` host is IPv6-only unless you have the IPv4 add-on. If you don't know the DB password, reset it under Project Settings → Database. The app uses API keys, not the DB password, so a reset doesn't affect the site.
2. **Version match:** run `SELECT version();` in the SQL editor. Your local `pg_dump` major version must be ≥ the server's.
3. **Dump the `public` schema** (tables, functions, policies, data):
   ```bash
   pg_dump "postgresql://postgres.<project-ref>:<db-password>@<pooler-host>:5432/postgres" \
     --format=custom --no-owner --no-privileges \
     --schema=public --file=memoria-public-2026-10-25.dump
   pg_restore --list memoria-public-2026-10-25.dump | head   # sanity check: lists tables
   ```
   Alternative: the Supabase CLI. It runs `pg_dump` inside Docker, so Docker must be running.
   ```bash
   supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
   supabase db dump --db-url "$DB_URL" -f schema.sql
   supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only
   ```
4. Policies on `storage.objects` are **not** in a `public` dump. Step 1 covers them.

## 3. Storage files

Uploaded files (photos, covers, frames) live in object storage, not in the database, so no dump includes them. This migration doesn't touch any file. Back up the `photos` bucket separately **before** any step that deletes files (Share retirement Phase 2b).

## 4. Apply → verify → clean up

1. Apply the migration in the SQL editor. If any assertion fails it aborts with a message, and nothing is applied.
2. Run `docs/qa/print-pipeline-rls-test.sql`. It ends with an intentional error whose message is the results table; every line must read `PASS`.
3. Run the storage and browser checks in `docs/qa/print-pipeline-hardening.md`.
4. If something is wrong, run the rollback from step 1.
5. After ~2 weeks without issues: `DROP SCHEMA backup_20261025 CASCADE;`
