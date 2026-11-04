-- ============================================================
-- Close the public listing of the photos bucket — security fix
-- Applied to live DB: 2026-11-04 (QA docs/qa/photo-listing-test.sql: 7/7)
-- ============================================================
--
-- Found in the 2026-11-04 audit (also the planned Stage 1 follow-up in
-- docs/share-retirement-plan.md §5). storage_photos_select_public lets anyone, without
-- signing in, list every object in the photos bucket through the Storage API and so find
-- and download every guest photo of every event.
--
-- Fix: replace it with an admin-only SELECT.
--   - Listing and authenticated download in the photos bucket: admins only.
--   - Public links (/storage/v1/object/public/photos/...) keep working: a public bucket serves
--     them without RLS, and that is how the site shows photos today.
--   - Guest uploads (INSERT, no upsert) don't need SELECT and are unchanged.
--   - Admin cover upload (upsert) keeps working: SELECT + UPDATE are both admin.
--   - api/resize-photo.ts uses the service role and is unaffected.
-- Making the bucket itself private (signed URLs) is the larger Stage 2 + 4 rebuild.
--
-- QA after applying: docs/qa/photo-listing-test.sql. Rollback: end of this file.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'public.is_admin() is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
                 AND policyname = 'storage_photos_select_public') THEN
    RAISE EXCEPTION 'storage_photos_select_public not found: the live policies differ from what this migration expects';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
             AND policyname = 'storage_photos_select_admin') THEN
    RAISE EXCEPTION 'storage_photos_select_admin already exists';
  END IF;
END $$;

DROP POLICY storage_photos_select_public ON storage.objects;

CREATE POLICY storage_photos_select_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (SELECT public.is_admin()));

COMMIT;

-- ============================================================
-- ROLLBACK (only if needed; reopens the public listing):
-- BEGIN;
-- DROP POLICY IF EXISTS storage_photos_select_admin ON storage.objects;
-- CREATE POLICY storage_photos_select_public ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'photos');
-- COMMIT;
-- ============================================================
