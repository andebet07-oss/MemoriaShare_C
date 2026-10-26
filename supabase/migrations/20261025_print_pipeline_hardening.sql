-- ============================================================
-- Print pipeline hardening
--   §1 guest print_jobs INSERT          §5 photos: URL integrity (insert guard + lock)
--   §2 photos bucket INSERT (+ leads)   §6 events: create / magnet updates admin-only
--   §3 photos bucket admin UPDATE       §7 data: reset simulated auto-copies
--   §4 photos: admin read, magnet photos private
-- Applied to live DB: <PENDING>
-- ============================================================
--
-- Written against the LIVE policies (pg_policies, 2026-10-25), which differ
-- from CLEAN_RESET_SCHEMA.sql. Where the live policy text is not known
-- (photos_*, events INSERT), the new rules are RESTRICTIVE policies: Postgres
-- ANDs them with every permissive policy, so they hold whatever the live
-- permissive policies say.
--
-- Apply order: docs/runbooks/pre-migration-backup.md (snapshot → pg_dump →
-- status page → apply → QA). Rollback: supabase/rollback/20261025_restore_policies_snapshot.sql
--
-- One transaction. The guards abort it — nothing applied — when a
-- precondition fails or any other INSERT path into print_jobs or the photos
-- bucket survives.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'print_jobs'
        AND column_name IN ('copies', 'face_count', 'crop_config', 'raw_photo_url')) < 4 THEN
    RAISE EXCEPTION 'print_jobs is missing 20260701 columns — apply 20260701_print_jobs_pro_station.sql first';
  END IF;
END$$;

-- ── Helpers ──────────────────────────────────────────────────

-- Our public storage prefix for the photos bucket, pinned from existing data:
-- every app upload builds file_url = VITE_SUPABASE_URL + this path. Aborts
-- unless exactly one prefix is in use, and prints the pinned value.
DO $$
DECLARE bases text[]; foreign_rows int;
BEGIN
  SELECT array_agg(DISTINCT b) INTO bases
  FROM (SELECT substring(file_url FROM '^(https://[^/]+/storage/v1/object/public/photos/)') AS b
        FROM photos WHERE file_url IS NOT NULL) s
  WHERE b IS NOT NULL;
  IF coalesce(array_length(bases, 1), 0) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one photos storage prefix in photos.file_url, found: %', bases;
  END IF;

  EXECUTE format(
    'CREATE OR REPLACE FUNCTION public.photos_public_base_url() RETURNS text
       LANGUAGE sql IMMUTABLE AS %L',
    format('SELECT %L::text', bases[1]));

  SELECT count(*) INTO foreign_rows FROM photos
  WHERE file_url IS NOT NULL AND NOT starts_with(file_url, bases[1]);
  RAISE NOTICE 'Pinned photos storage prefix: % (existing photos outside it: %)', bases[1], foreign_rows;
END$$;

-- True when p_url is a file directly inside {event_id}/ of our photos bucket.
CREATE OR REPLACE FUNCTION public.is_event_storage_url(p_url TEXT, p_event_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p_url IS NOT NULL
     AND starts_with(p_url, photos_public_base_url() || p_event_id::text || '/')
     AND substr(p_url, length(photos_public_base_url() || p_event_id::text || '/') + 1)
           ~ '^[A-Za-z0-9._-]+$';
$$;

-- The helpers below are SECURITY DEFINER (same pattern as is_admin /
-- is_event_owner) so the new rules don't depend on the drifted live
-- events/photos SELECT policies.

CREATE OR REPLACE FUNCTION public.is_magnet_event(p_event_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM events WHERE id = p_event_id AND event_type = 'magnet');
$$;

-- The caller may queue a print for this photo: the event is an active magnet
-- event and the caller created the photo in that event.
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

-- A storage folder name is the id of an active event. Text compare, so a
-- non-UUID folder ('general', 'covers', ...) is false, not a cast error.
CREATE OR REPLACE FUNCTION public.is_active_event_folder(p_folder TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM events e WHERE e.id::text = p_folder AND e.is_active = true);
$$;

-- is_magnet_event keeps the default EXECUTE: the photos SELECT restriction is
-- also evaluated for anonymous (no-session) reads.
REVOKE EXECUTE ON FUNCTION public.can_queue_print_job(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_event_folder(TEXT)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_queue_print_job(UUID, UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_active_event_folder(TEXT)    TO authenticated;

-- ── 1. print_jobs: guest INSERT ──────────────────────────────
-- A fresh, untouched job for the caller's own photo in an active magnet event.
-- copies / crop_config / face_count are operator-only (print_jobs_update_admin).
-- raw_photo_url, if set, must be a file in this event's folder of our bucket.
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
    AND (raw_photo_url IS NULL OR public.is_event_storage_url(raw_photo_url, event_id))
    AND public.can_queue_print_job(event_id, photo_id)
  );

-- ── 2. photos bucket: INSERT ─────────────────────────────────
-- Replaces the live {public}-role policy: authenticated users only (anonymous
-- sign-ins have role `authenticated`), only into {event_id}/ of an active event.
DROP POLICY IF EXISTS "storage_photos_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_insert_event_folder" ON storage.objects;
CREATE POLICY "storage_photos_insert_event_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND public.is_active_event_folder((storage.foldername(name))[1])
  );

-- Admin-only: event covers (covers/{event_id}/cover.*).
DROP POLICY IF EXISTS "storage_covers_insert_admin" ON storage.objects;
CREATE POLICY "storage_covers_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'covers'
    AND public.is_admin()
  );

-- D1: MagnetLead signs the visitor in anonymously and uploads the prospect's
-- cover to leads/{auth.uid()}/{file} — only the caller's own folder, one level.
DROP POLICY IF EXISTS "storage_leads_insert_own" ON storage.objects;
CREATE POLICY "storage_leads_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'leads'
    AND (storage.foldername(name))[2] = (select auth.uid())::text
    AND array_length(storage.foldername(name), 1) = 2
  );

-- storage_overlays_insert_admin (overlays/ is admin-only) is intentionally unchanged.

-- ── 3. photos bucket: admin UPDATE (D4) ──────────────────────
-- uploadOverlay / uploadCoverImage send x-upsert: true; replacing an existing
-- file needs UPDATE, and live has no UPDATE policy on storage.objects.
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

-- ── 4. photos: admin read, magnet photos private ─────────────
-- Order matters (operators read photos only through the public policy today):
-- first the admin SELECT, then the restriction. Both land in this transaction.
DROP POLICY IF EXISTS "photos_select_admin" ON photos;
CREATE POLICY "photos_select_admin"
  ON photos FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- Magnet photos are visible only to their uploader and admins — no anonymous
-- or cross-guest listing. Share photos are untouched. RESTRICTIVE: ANDed with
-- every live permissive SELECT policy (photos_select, ...).
DROP POLICY IF EXISTS "photos_magnet_private_select" ON photos;
CREATE POLICY "photos_magnet_private_select"
  ON photos AS RESTRICTIVE FOR SELECT
  TO public
  USING (
    NOT public.is_magnet_event(event_id)
    OR created_by = (select auth.uid())
    OR (select public.is_admin())
  );

-- Same scope for UPDATE / DELETE. Also neutralises, for magnet photos, the
-- `ep.event_id = event_id` editor bug (D3) whatever the live text is.
DROP POLICY IF EXISTS "photos_magnet_private_update" ON photos;
CREATE POLICY "photos_magnet_private_update"
  ON photos AS RESTRICTIVE FOR UPDATE
  TO public
  USING (
    NOT public.is_magnet_event(event_id)
    OR created_by = (select auth.uid())
    OR (select public.is_admin())
  );

DROP POLICY IF EXISTS "photos_magnet_private_delete" ON photos;
CREATE POLICY "photos_magnet_private_delete"
  ON photos AS RESTRICTIVE FOR DELETE
  TO public
  USING (
    NOT public.is_magnet_event(event_id)
    OR created_by = (select auth.uid())
    OR (select public.is_admin())
  );

-- ── 5. photos: URL integrity ─────────────────────────────────
-- A client may only insert a photo whose file_url is the public URL of its own
-- `path`, a single file directly in {event_id}/ of our bucket, owned by the
-- caller. file_urls must be empty: api/resize-photo.ts (service role) fills it
-- and skips rows that already have it, and the station prints file_urls.original.
DROP POLICY IF EXISTS "photos_insert_url_guard" ON photos;
CREATE POLICY "photos_insert_url_guard"
  ON photos AS RESTRICTIVE FOR INSERT
  TO public
  WITH CHECK (
    created_by = (select auth.uid())
    AND file_urls IS NULL
    AND public.is_event_storage_url(file_url, event_id)
    AND file_url = public.photos_public_base_url() || path
  );

-- After insert, API roles cannot repoint a photo. The resize webhook
-- (service_role) and the SQL editor (postgres) are not affected.
CREATE OR REPLACE FUNCTION public.photos_lock_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.file_url   IS DISTINCT FROM OLD.file_url
       OR NEW.file_urls  IS DISTINCT FROM OLD.file_urls
       OR NEW.path       IS DISTINCT FROM OLD.path
       OR NEW.event_id   IS DISTINCT FROM OLD.event_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by) THEN
    RAISE EXCEPTION 'PHOTO_URL_IMMUTABLE' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_photos_lock_urls ON photos;
CREATE TRIGGER trg_photos_lock_urls
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION public.photos_lock_urls();

-- ── 6. events: creation is admin-only ────────────────────────
-- RESTRICTIVE, so it holds whatever the live INSERT policy allows (repo:
-- any Google account). Share self-service event creation stops here — retired.
DROP POLICY IF EXISTS "events_insert_admin_only" ON events;
CREATE POLICY "events_insert_admin_only"
  ON events AS RESTRICTIVE FOR INSERT
  TO public
  WITH CHECK ((select public.is_admin()));

-- Same gate on UPDATE: otherwise an owner / co-host / editor allowed by the
-- live events_update_owner could turn a Share event into a magnet event, or
-- change a magnet event's frame, quota or owner. USING blocks non-admins from
-- touching magnet rows; WITH CHECK blocks producing one.
DROP POLICY IF EXISTS "events_update_magnet_admin_only" ON events;
CREATE POLICY "events_update_magnet_admin_only"
  ON events AS RESTRICTIVE FOR UPDATE
  TO public
  USING      (event_type <> 'magnet' OR (select public.is_admin()))
  WITH CHECK (event_type <> 'magnet' OR (select public.is_admin()));

-- ── 7. Data: reset simulated auto-copies ─────────────────────
-- The removed station auto-analysis wrote copies = simulated face count.
-- Same predicate as the 2026-10-25 audit (queued_with_auto_copies = 2).
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

-- ── 8. D3 (Share side) — pending the full live text of photos_select/_update ──

-- ── Guards (abort the whole migration on any surviving hole) ─────────────
DO $$
DECLARE leftovers text;
BEGIN
  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'print_jobs'
    AND cmd IN ('INSERT', 'ALL') AND permissive = 'PERMISSIVE'
    AND policyname <> 'print_jobs_insert_guest';
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Other INSERT policies remain on print_jobs: %', leftovers;
  END IF;

  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('INSERT', 'ALL') AND permissive = 'PERMISSIVE'
    AND coalesce(with_check, '') || coalesce(qual, '') LIKE '%''photos''%'
    AND policyname NOT IN ('storage_photos_insert_event_folder',
                           'storage_covers_insert_admin',
                           'storage_leads_insert_own',
                           'storage_overlays_insert_admin');
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Other INSERT policies on the photos bucket remain: %', leftovers;
  END IF;

  SELECT string_agg(policyname, ', ') INTO leftovers
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd IN ('INSERT', 'ALL') AND permissive = 'PERMISSIVE'
    AND coalesce(with_check, '') || coalesce(qual, '') LIKE '%''photos''%'
    AND policyname <> 'storage_overlays_insert_admin'  -- unchanged; gated by is_admin()
    AND roles <> ARRAY['authenticated']::name[];
  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'Photos-bucket INSERT policies not limited to authenticated: %', leftovers;
  END IF;
END$$;

COMMIT;
