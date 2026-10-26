# Pre-Migration Backup & Apply (Free Plan)

The Free plan has no restorable backups. Every live DB change follows this sequence; nothing is skipped. The example is `20261025_print_pipeline_hardening.sql`.

> The pg_dump / CLI / dashboard steps are from memory and could not be checked against supabase.com from the sandbox. If a dashboard label differs, follow the dashboard.

## 1. In-database snapshot (required)
1. SQL editor → run `supabase/rollback/20261025_snapshot.sql`.
2. Check the final result. `policies` should equal the number of policies on events / photos / print_jobs / storage.objects, and `print_jobs_rows` should be `32`.
3. Run `SELECT create_stmt FROM backup_20261025.policies;` and export the result as CSV to your machine.

The snapshot lives in schema `backup_20261025`. That schema isn't exposed by the API and has no grants for `anon` / `authenticated`.

## 2. Off-site logical dump (required)
1. **Connection string:** Dashboard → **Connect** → **Session pooler** (port 5432). The direct `db.<ref>.supabase.co` host is IPv6-only without the IPv4 add-on. If you don't know the DB password, reset it under Project Settings → Database. The app uses API keys, not the DB password.
2. **Version match:** `SELECT version();`. Your local `pg_dump` major version must be ≥ the server's.
3. **Dump:**
   ```bash
   pg_dump "postgresql://postgres.<project-ref>:<db-password>@<pooler-host>:5432/postgres" \
     --format=custom --no-owner --no-privileges \
     --schema=public --file=memoria-public-2026-10-26.dump
   pg_restore --list memoria-public-2026-10-26.dump | head   # must list tables
   ```
   Alternative: the Supabase CLI. It runs `pg_dump` inside Docker, so Docker must be running.
   ```bash
   supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
   supabase db dump --db-url "$DB_URL" -f schema.sql
   supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only
   ```
4. Keep the dump and the CSV from step 1 together, outside the project.

Storage files (photos, covers, frames) are in object storage, not in any DB dump. This migration doesn't touch files. Back up the bucket before any step that deletes files (Share retirement Phase 2b).

## 3. Confirm there is no active incident
Check https://status.supabase.com for the project's region (Database, Storage, Auth). Don't apply during an incident or maintenance window.

## 4. Apply
SQL editor → run `supabase/migrations/20261025_print_pipeline_hardening.sql`.
- The NOTICE lines must show the **pinned storage prefix** (your `https://<ref>.supabase.co/storage/v1/object/public/photos/`) and `auto-copies reset: 2 row(s)`.
- If a guard fails, the migration aborts with a message and nothing is applied. Send me the message.

## 5. Verify
1. `docs/qa/print-pipeline-rls-test.sql` → all lines `PASS` (it ends with an intentional error carrying the results).
2. `docs/qa/print-pipeline-hardening.md` §B (storage, browser console).
3. **One real guest submission end to end** on the branch build (§C): `raw_photo_url` must be stored, `copies = 1`, one magnet prints.
4. Then the rest of the QA doc (§D–§G).

**Code ↔ DB coupling:** between applying and merging, `main` still runs the old lead wizard, whose cover upload goes to `general/`. That upload will fail (silently; the lead still submits). Run step 5.3 on the branch's Vercel **preview** deployment, if Preview has the Supabase env vars, and merge to `main` as soon as QA passes.

## 6. Rollback (if needed)
SQL editor → `supabase/rollback/20261025_restore_policies_snapshot.sql`.
- It drops every current policy on the four tables and recreates the snapshot exactly.
- It drops the migration's trigger and helper functions.
- It runs as one transaction, and its last query must return 0 rows.
- Tested locally: the restored policies are identical to the originals, and all new functions and the trigger are gone.

## 7. Clean-up
After ~2 weeks without issues: `DROP SCHEMA backup_20261025 CASCADE;`
