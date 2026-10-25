-- ============================================================
-- Print pipeline hardening — guest print_jobs INSERT, photos bucket
-- INSERT/UPDATE, reset of simulated auto-copies
-- Applied to live DB: <PENDING>
-- ============================================================
--
-- Written against the LIVE policies (pg_policies, 2026-10-25), which differ
-- from CLEAN_RESET_SCHEMA.sql. Live facts this relies on:
--   - storage_photos_insert_public exists with roles {public} (no auth).
--   - storage.objects has NO UPDATE policy.
--   - print_jobs has the 20260701 columns (copies/face_count/crop_config/raw_photo_url).
--
-- Before applying:
--   1. Take the snapshot in docs/runbooks/pre-migration-backup.md
--      (rollback: supabase/rollback/20261025_restore_policies_snapshot.sql).
--   2. Send the full policy text (plan §0, query 1); D3 (photos policies) is
--      added here only after that review.
--
-- Safety: the whole file is one transaction. The assertions at the end abort
-- it (nothing applied) if any other INSERT path into print_jobs or the photos
-- bucket survives — permissive policies are OR-ed, so one leftover policy
-- would keep the hole open.
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

-- ── Helpers ──────────────────────────────────────────────────
-- SECURITY DEFINER (same pattern as is_admin / is_event_owner) so the new
-- policies do not depend on the live events/photos SELECT policies, which
-- differ from the repo and are themselves being reworked.

-- True when the caller may queue a print for this photo: the event is an
-- active magnet event and the photo was created by the caller in that event.
CREATE OR REPLACE FUNCTION public.can_queue_print_job(p_event_id UUID, p_photo_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
           SELECT 1 FROM events e
           WHERE e.id = p_event_id AND e.is_active = true AND e.event_type = 'magnet'
         )
     AND EXISTS (
           SELECT 1 FROM photos p
           WHERE p.id = p_photo_id AND p.event_id = p_event_id AND p.created_by = auth.uid()
         );
$$;

-- True when a storage folder name is the id of an active event. Text compare,
-- so a non-UUID folder ('general', 'covers', ...) is false, not a cast error.
CREATE OR REPLACE FUNCTION public.is_active_event_folder(p_folder TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM events e WHERE e.id::text = p_folder AND e.is_active = true);
$$;

REVOKE EXECUTE ON FUNCTION public.can_queue_print_job(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_event_folder(TEXT)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_queue_print_job(UUID, UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_active_event_folder(TEXT)    TO authenticated;

-- ── 1. print_jobs: guest INSERT ──────────────────────────────
-- A guest may only queue a fresh, untouched job. copies / crop_config /
-- face_count are operator-only (print_jobs_update_admin). The guest submit
-- sends only ids + raw_photo_url, so DB defaults satisfy this.
-- enforce_print_quota() (BEFORE INSERT) is unchanged and still counts rows.
DROP POLICY IF EXISTS "print_jobs_insert_guest" ON print_jobs;
CREATE POLICY "print_jobs_insert_guest"
  ON print_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    guest_user_id = (select auth.uid())
    AND status = 'pending'
    AND copies = 1
    AND crop_config IS NULL
    AND face_count IS NULL
    AND public.can_queue_print_job(event_id, photo_id)
  );

-- ── 2. photos bucket: INSERT ─────────────────────────────────
-- Replaces the live {public}-role policy: authenticated users only (anonymous
-- sign-ins have role `authenticated`), and only into {event_id}/ of an active event.
DROP POLICY IF EXISTS "storage_photos_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_insert_event_folder" ON storage.objects;
CREATE POLICY "storage_photos_insert_event_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND public.is_active_event_folder((storage.foldername(name))[1])
  );

-- Admin-only: event covers (CreateMagnetEvent / MagnetEventDashboard write
-- covers/{event_id}/cover.*), no longer allowed by the event-folder rule.
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

-- ── 3. photos bucket: admin UPDATE (D4) ──────────────────────
-- uploadOverlay / uploadCoverImage send x-upsert: true. Replacing an existing
-- file needs an UPDATE policy, and live has none, so re-uploading a cover or a
-- custom frame failed. Admin-only, overlays/ and covers/ only.
DROP POLICY IF EXISTS "storage_photos_update_admin" ON storage.objects;
CREATE POLICY "storage_photos_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN ('overlays', 'covers')
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN ('overlays', 'covers')
    AND public.is_admin()
  );

-- ── 4. Data: reset simulated auto-copies ─────────────────────
-- The removed station auto-analysis wrote copies = simulated face count.
-- Same predicate as the 2026-10-25 audit query (queued_with_auto_copies = 2).
DO $$
DECLARE n integer;
BEGIN
  UPDATE print_jobs
     SET copies = 1, updated_at = NOW()
   WHERE status IN ('pending', 'printing')
     AND face_count IS NOT NULL
     AND copies > 1
     AND copies = GREATEST(1, face_count);
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'print_jobs auto-copies reset: % row(s)', n;
END$$;

-- ── 5. D3 — photos policies: pending review of the full live text ────────

-- ── Assertions (abort the whole migration on any surviving hole) ─────────
DO $$
DECLARE leftovers text;
BEGIN
  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'print_jobs'
    AND cmd IN ('INSERT', 'ALL')
    AND policyname <> 'print_jobs_insert_guest';
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Other INSERT policies remain on print_jobs: %', leftovers;
  END IF;

  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('INSERT', 'ALL')
    AND coalesce(with_check, '') || coalesce(qual, '') LIKE '%''photos''%'
    AND policyname NOT IN ('storage_photos_insert_event_folder',
                           'storage_covers_insert_admin',
                           'storage_overlays_insert_admin');
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Other INSERT policies on the photos bucket remain: %', leftovers;
  END IF;

  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('INSERT', 'ALL')
    AND coalesce(with_check, '') || coalesce(qual, '') LIKE '%''photos''%'
    AND policyname <> 'storage_overlays_insert_admin'  -- unchanged; gated by is_admin()
    AND roles <> ARRAY['authenticated']::name[];
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Photos-bucket INSERT policies not limited to authenticated: %', leftovers;
  END IF;
END$$;

COMMIT;
