-- ============================================================
-- Polaroid templates (2/2): remove the old frame system — destructive
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Drops events.overlay_frame_url, the frames_meta table (its RLS policies and
-- indexes go with it) and the storage policies that only served overlay frames.
--
-- Apply order:
--   1. 20261026_polaroid_templates_add.sql is applied and the templates PR is
--      deployed (nothing reads overlay_frame_url / frames_meta any more).
--   2. 20261025_print_pipeline_hardening.sql is applied — it creates
--      storage_photos_update_admin, which this file narrows to covers/ only.
--      (Applied after this file, hardening would re-add overlays/.)
--   3. Optional but tidy: delete the overlay files first (query below).
--   4. docs/runbooks/pre-migration-backup.md (snapshot → pg_dump → apply).
--
-- Overlay files to delete by hand — run this read-only query, then delete the
-- listed objects from the dashboard (Storage → bucket → select → Delete).
-- Don't DELETE FROM storage.objects: that removes the rows, not the files.
--
--   SELECT bucket_id, name, (metadata->>'size')::int AS bytes, created_at
--   FROM storage.objects
--   WHERE (bucket_id = 'photos' AND name LIKE 'overlays/%')   -- per-event uploads
--      OR bucket_id = 'overlays'                              -- frames library PNGs
--   ORDER BY bucket_id, name;
--
-- Once empty, the 'overlays' bucket itself can be deleted from the dashboard.
--
-- Rollback: data is not recoverable from here (frame rows and frame refs are
-- test data) — restore from the pg_dump taken in step 4 if ever needed.
--
-- One transaction. The guards abort it — nothing applied — when a
-- precondition fails.
-- ============================================================

BEGIN;

-- ── Guards ───────────────────────────────────────────────────
DO $$
DECLARE refs text;
BEGIN
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'events'
        AND column_name IN ('template_id', 'template_options')) < 2 THEN
    RAISE EXCEPTION 'events.template_id / template_options missing — apply 20261026_polaroid_templates_add.sql first';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'storage_photos_update_admin') THEN
    RAISE EXCEPTION 'storage_photos_update_admin missing — apply 20261025_print_pipeline_hardening.sql first';
  END IF;

  -- Function bodies are not tracked as dependencies; check them by text.
  SELECT string_agg(p.oid::regprocedure::text, ', ') INTO refs
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND (p.prosrc LIKE '%overlay_frame_url%' OR p.prosrc LIKE '%frames_meta%');
  IF refs IS NOT NULL THEN
    RAISE EXCEPTION 'Functions still reference overlay_frame_url / frames_meta: %', refs;
  END IF;
END$$;

-- ── 1. events: the frame reference ───────────────────────────
-- No CASCADE: a view or other dependent object aborts the migration instead.
ALTER TABLE public.events DROP COLUMN IF EXISTS overlay_frame_url;

-- ── 2. frames_meta ───────────────────────────────────────────
DROP TABLE IF EXISTS public.frames_meta;

-- ── 3. storage: overlay-only policies ────────────────────────
-- Admin INSERT into photos/overlays/ (per-event frame uploads).
DROP POLICY IF EXISTS "storage_overlays_insert_admin" ON storage.objects;

-- Admin UPDATE (upsert) in the photos bucket: covers/ only from now on.
DROP POLICY IF EXISTS "storage_photos_update_admin" ON storage.objects;
CREATE POLICY "storage_photos_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'covers'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'covers'
    AND public.is_admin()
  );

-- ── Report (informational) ───────────────────────────────────
-- Live policies have drifted from the repo, so any other policy that mentions
-- overlays is listed for review rather than dropped by pattern.
DO $$
DECLARE leftovers text; files int;
BEGIN
  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND coalesce(with_check, '') || coalesce(qual, '') LIKE '%overlays%';
  IF leftovers IS NOT NULL THEN
    RAISE NOTICE 'Storage policies still mentioning overlays (review; drop with the bucket): %', leftovers;
  END IF;

  SELECT count(*) INTO files FROM storage.objects
  WHERE (bucket_id = 'photos' AND name LIKE 'overlays/%') OR bucket_id = 'overlays';
  IF files > 0 THEN
    RAISE NOTICE '% overlay file(s) still in storage — delete them from the dashboard (query in the header)', files;
  END IF;
END$$;

COMMIT;
