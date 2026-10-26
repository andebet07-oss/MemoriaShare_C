-- ============================================================
-- Pre-migration snapshot for 20261025_print_pipeline_hardening.sql
-- Run in the Supabase SQL editor BEFORE applying the migration.
-- Restore with: supabase/rollback/20261025_restore_policies_snapshot.sql
-- ============================================================
-- Copies every RLS policy on events / photos / print_jobs / storage.objects
-- (with a ready-to-run CREATE POLICY statement) and the print_jobs rows into
-- a private schema. `backup_20261025` is not in the API's exposed schemas and
-- has no grants for anon/authenticated, so nothing here is reachable from
-- the app or the public key.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS backup_20261025;
REVOKE ALL ON SCHEMA backup_20261025 FROM PUBLIC, anon, authenticated;

CREATE TABLE backup_20261025.policies AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check,
       format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
              policyname, schemaname, tablename, permissive, cmd,
              array_to_string(roles, ', '),
              CASE WHEN qual       IS NOT NULL THEN ' USING ('      || qual       || ')' ELSE '' END,
              CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END
       ) AS create_stmt
FROM pg_policies
WHERE (schemaname = 'public'  AND tablename IN ('events', 'photos', 'print_jobs'))
   OR (schemaname = 'storage' AND tablename = 'objects');

CREATE TABLE backup_20261025.print_jobs AS TABLE public.print_jobs;

COMMIT;

-- Verify: expect policies = the pg_policies count you saw (16 + events rows),
-- print_jobs_rows = 32.
SELECT (SELECT count(*) FROM backup_20261025.policies)   AS policies,
       (SELECT count(*) FROM backup_20261025.print_jobs) AS print_jobs_rows;
