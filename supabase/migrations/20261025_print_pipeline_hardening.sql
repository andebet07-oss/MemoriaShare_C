-- ============================================================
-- Print pipeline hardening — guest print_jobs INSERT + photos bucket INSERT
-- Applied to live DB: <PENDING>
-- ============================================================
--
-- Prerequisite: 20260701_print_jobs_pro_station.sql (copies / face_count /
-- crop_config). The guard below aborts the whole migration if it is missing.
--
-- Before applying, list the live policies (pre-flight query in
-- docs/print-pipeline-hardening-plan.md). Permissive policies are OR-ed: any
-- other INSERT policy on print_jobs or storage.objects that is not dropped
-- here would keep the old hole open.
--
-- Wrapped in a transaction so a failure leaves the live DB untouched.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'print_jobs'
        AND column_name IN ('copies', 'face_count', 'crop_config')) < 3 THEN
    RAISE EXCEPTION 'print_jobs is missing copies/face_count/crop_config — apply 20260701_print_jobs_pro_station.sql first';
  END IF;
END$$;

-- ── 1. print_jobs: guest INSERT ──────────────────────────────
-- A guest may only queue a fresh, untouched job for a photo they created in
-- the same active magnet event. copies / crop_config / face_count are
-- operator-only (print_jobs_update_admin). enforce_print_quota() is unchanged
-- and still counts rows.
-- print_jobs.* is qualified because events and photos also have id/event_id
-- columns (same scoping trap as 20260603_fix_events_update_owner_column_ref).
DROP POLICY IF EXISTS "print_jobs_insert_guest" ON print_jobs;
CREATE POLICY "print_jobs_insert_guest"
  ON print_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    print_jobs.guest_user_id = (select auth.uid())
    AND print_jobs.status = 'pending'
    AND print_jobs.copies = 1
    AND print_jobs.crop_config IS NULL
    AND print_jobs.face_count IS NULL
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = print_jobs.event_id
        AND e.is_active = true
        AND e.event_type = 'magnet'
    )
    AND EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = print_jobs.photo_id
        AND p.event_id = print_jobs.event_id
        AND p.created_by = (select auth.uid())
    )
  );

-- ── 2. photos bucket: INSERT ─────────────────────────────────
-- Authenticated users only (anonymous sign-ins have role `authenticated`),
-- and only into {event_id}/ of an active event. The folder is matched as text
-- so a non-UUID folder ('general', 'covers', ...) is "no match", not a cast
-- error. `name` stays outside the subquery so it can't resolve to events.name.
DROP POLICY IF EXISTS "storage_photos_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_insert_event_folder" ON storage.objects;
CREATE POLICY "storage_photos_insert_event_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text FROM public.events e WHERE e.is_active = true
    )
  );

-- Admin-only: event covers (CreateMagnetEvent / MagnetEventDashboard write
-- covers/{event_id}/cover.*), which the event-folder rule no longer allows.
DROP POLICY IF EXISTS "storage_covers_insert_admin" ON storage.objects;
CREATE POLICY "storage_covers_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'covers'
    AND public.is_admin()
  );

-- storage_overlays_insert_admin (overlays/ is admin-only) is intentionally unchanged.

COMMIT;
