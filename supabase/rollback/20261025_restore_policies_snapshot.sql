-- ============================================================
-- Rollback for 20261025_print_pipeline_hardening.sql
-- Restores every policy on events / photos / print_jobs / storage.objects to
-- the state captured by 20261025_snapshot.sql, then drops the trigger and
-- helpers the migration added. One transaction: any error leaves the DB unchanged.
-- ============================================================

BEGIN;

DO $$
DECLARE r record;
BEGIN
  IF to_regclass('backup_20261025.policies') IS NULL THEN
    RAISE EXCEPTION 'No snapshot found — backup_20261025.policies does not exist';
  END IF;

  -- Drop every current policy on the snapshotted tables (incl. ones the
  -- migration created), then recreate the snapshot exactly.
  FOR r IN
    SELECT p.schemaname, p.tablename, p.policyname
    FROM pg_policies p
    WHERE (p.schemaname = 'public'  AND p.tablename IN ('events', 'photos', 'print_jobs'))
       OR (p.schemaname = 'storage' AND p.tablename = 'objects')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  FOR r IN SELECT create_stmt FROM backup_20261025.policies LOOP
    EXECUTE r.create_stmt;
  END LOOP;
END$$;

DROP TRIGGER  IF EXISTS trg_photos_lock_urls ON public.photos;
DROP FUNCTION IF EXISTS public.photos_lock_urls();
DROP FUNCTION IF EXISTS public.can_queue_print_job(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_active_event_folder(TEXT);
DROP FUNCTION IF EXISTS public.is_magnet_event(UUID);
DROP FUNCTION IF EXISTS public.is_event_storage_url(TEXT, UUID);
DROP FUNCTION IF EXISTS public.photos_public_base_url();

-- Optional, normally NOT wanted: restore the simulated auto-copies the
-- migration reset to 1 (re-enables over-printing of those 2 jobs).
-- UPDATE public.print_jobs pj
--    SET copies = b.copies
--   FROM backup_20261025.print_jobs b
--  WHERE pj.id = b.id AND pj.copies IS DISTINCT FROM b.copies;

COMMIT;

-- Verify: policy set equals the snapshot (expect 0 rows from each side).
SELECT 'missing_after_restore' AS diff, policyname FROM backup_20261025.policies
EXCEPT SELECT 'missing_after_restore', policyname FROM pg_policies
UNION ALL
(SELECT 'extra_after_restore', policyname FROM pg_policies
  WHERE (schemaname = 'public'  AND tablename IN ('events', 'photos', 'print_jobs'))
     OR (schemaname = 'storage' AND tablename = 'objects')
 EXCEPT SELECT 'extra_after_restore', policyname FROM backup_20261025.policies);
