-- ============================================================
-- Retire Share, Phase 2a: tighten the database rules Share left behind — security fix
-- Applied to live DB: 2026-11-04 (rules checked against live pg_policies the same day)
-- ============================================================
--
-- Plan: docs/share-retirement-plan.md §3 (2a). Apply AFTER the Phase 1 site is live:
-- the Share pages that used these rules (album gallery, host dashboard) are gone from it.
-- Rules checked against live pg_policies on 2026-11-04.
--
-- photos (Magnet photos are already private: photos_magnet_private_* stay as they are)
--   - photos_select let anyone, without signing in, read every approved Share photo
--     (83 photos in 20 events). It is replaced by photos_select_own (the uploader), next to
--     the existing photos_select_admin. Guests still get their own photo back after upload.
--   - photos_select_owner / photos_select_viewer / photos_update_owner / photos_delete_owner:
--     their event_permissions branch compares ep.event_id with itself, so an editor or viewer
--     on ONE event reached the photos of EVERY event. Dropped (event_permissions is empty).
--   - photos_update (event host + co_hosts branch): dropped. photos_update_uploader stays.
--   - New: photos_delete_own (MagnetReview removes its own row after a failed upload),
--     photos_update_admin, photos_delete_admin.
-- events
--   - events_update_owner: drop the co_hosts and event_permissions branches → creator or admin.
--   - events_insert_authenticated + the restrictive events_insert_admin_only → one rule,
--     events_insert_admin. Same result as today (only admins create events).
-- upload_diagnostics (empty, not used by the site): any signed-in session, anonymous guests
--   included, could read and write it → admins only. Phase 2b drops the table.
-- Functions (Supabase security advisor)
--   - Trigger functions: revoke EXECUTE from PUBLIC/anon/authenticated. Triggers still fire:
--     EXECUTE is checked when a trigger is created, not when it fires (as with
--     profiles_protect_role, already live).
--   - photos_public_base_url(): pin search_path.
--
-- Not here (Phase 2b, after the Share backup): drop event_permissions and is_event_owner(),
-- the Share columns, the Share rows and files, and upload_diagnostics.
--
-- QA after applying: docs/qa/share-2a-test.sql. Rollback: end of this file.
-- ============================================================

BEGIN;

DO $$
DECLARE
  p text;
BEGIN
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'public.is_admin() is missing';
  END IF;
  -- The live rules this migration replaces or relies on
  FOREACH p IN ARRAY ARRAY[
    'photos.photos_select', 'photos.photos_select_owner', 'photos.photos_select_viewer',
    'photos.photos_update', 'photos.photos_update_owner', 'photos.photos_delete_owner',
    'photos.photos_select_admin', 'photos.photos_update_uploader',
    'photos.photos_magnet_private_select', 'photos.photos_magnet_private_update', 'photos.photos_magnet_private_delete',
    'events.events_update_owner', 'events.events_insert_authenticated', 'events.events_insert_admin_only',
    'upload_diagnostics.upload_diagnostics_select', 'upload_diagnostics.upload_diagnostics_insert'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                   AND tablename = split_part(p, '.', 1) AND policyname = split_part(p, '.', 2)) THEN
      RAISE EXCEPTION 'policy % not found: the live rules differ from what this migration expects', p;
    END IF;
  END LOOP;
  FOREACH p IN ARRAY ARRAY[
    'photos.photos_select_own', 'photos.photos_update_admin', 'photos.photos_delete_own',
    'photos.photos_delete_admin', 'events.events_insert_admin', 'upload_diagnostics.upload_diagnostics_admin'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
               AND tablename = split_part(p, '.', 1) AND policyname = split_part(p, '.', 2)) THEN
      RAISE EXCEPTION 'policy % already exists', p;
    END IF;
  END LOOP;
END $$;

-- ── photos ────────────────────────────────────────────────────
DROP POLICY photos_select ON public.photos;
DROP POLICY photos_select_owner ON public.photos;
DROP POLICY photos_select_viewer ON public.photos;
DROP POLICY photos_update ON public.photos;
DROP POLICY photos_update_owner ON public.photos;
DROP POLICY photos_delete_owner ON public.photos;

CREATE POLICY photos_select_own ON public.photos FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY photos_update_admin ON public.photos FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY photos_delete_own ON public.photos FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY photos_delete_admin ON public.photos FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ── events ────────────────────────────────────────────────────
DROP POLICY events_update_owner ON public.events;
CREATE POLICY events_update_owner ON public.events FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = created_by OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.uid()) = created_by OR (SELECT public.is_admin()));

DROP POLICY events_insert_authenticated ON public.events;
DROP POLICY events_insert_admin_only ON public.events;
CREATE POLICY events_insert_admin ON public.events FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- ── upload_diagnostics ────────────────────────────────────────
DROP POLICY upload_diagnostics_select ON public.upload_diagnostics;
DROP POLICY upload_diagnostics_insert ON public.upload_diagnostics;
CREATE POLICY upload_diagnostics_admin ON public.upload_diagnostics FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ── Functions ─────────────────────────────────────────────────
DO $$
DECLARE
  f regprocedure;
BEGIN
  FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.prorettype = 'trigger'::regtype LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

ALTER FUNCTION public.photos_public_base_url() SET search_path = '';

COMMIT;

-- ============================================================
-- ROLLBACK (only if needed; reopens the Share photos and the event_permissions bug):
-- BEGIN;
-- DROP POLICY IF EXISTS photos_select_own ON public.photos;
-- DROP POLICY IF EXISTS photos_update_admin ON public.photos;
-- DROP POLICY IF EXISTS photos_delete_own ON public.photos;
-- DROP POLICY IF EXISTS photos_delete_admin ON public.photos;
-- CREATE POLICY photos_select ON public.photos FOR SELECT TO public USING (((is_hidden = false) AND ((is_approved = true) OR (EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (e.auto_publish_guest_photos = true)))))) OR ((SELECT auth.uid()) = created_by) OR (EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts)))))));
-- CREATE POLICY photos_select_owner ON public.photos FOR SELECT TO public USING ((EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts)))))) OR (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = ep.event_id) AND (ep.user_id = auth.uid()) AND (ep.role = 'editor')))));
-- CREATE POLICY photos_select_viewer ON public.photos FOR SELECT TO public USING ((is_hidden = false) AND (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = ep.event_id) AND (ep.user_id = auth.uid()) AND (ep.role = ANY (ARRAY['viewer', 'editor']))))));
-- CREATE POLICY photos_update ON public.photos FOR UPDATE TO public USING (((SELECT auth.uid()) = created_by) OR (EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts))))))) WITH CHECK ((EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts)))))) OR (deletion_status = ANY (ARRAY['none', 'requested'])));
-- CREATE POLICY photos_update_owner ON public.photos FOR UPDATE TO public USING ((EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts)))))) OR (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = ep.event_id) AND (ep.user_id = auth.uid()) AND (ep.role = 'editor')))));
-- CREATE POLICY photos_delete_owner ON public.photos FOR DELETE TO public USING (((SELECT auth.uid()) = created_by) OR (EXISTS (SELECT 1 FROM events e WHERE ((e.id = photos.event_id) AND (((SELECT auth.uid()) = e.created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (e.co_hosts)))))) OR (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = ep.event_id) AND (ep.user_id = auth.uid()) AND (ep.role = 'editor')))));
-- DROP POLICY IF EXISTS events_update_owner ON public.events;
-- CREATE POLICY events_update_owner ON public.events FOR UPDATE TO public USING (((SELECT auth.uid()) = created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (co_hosts)) OR is_admin() OR (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = events.id) AND (ep.user_id = auth.uid()) AND (ep.role = 'editor'))))) WITH CHECK (((SELECT auth.uid()) = created_by) OR (((SELECT auth.jwt()) ->> 'email') = ANY (co_hosts)) OR is_admin() OR (EXISTS (SELECT 1 FROM event_permissions ep WHERE ((ep.event_id = events.id) AND (ep.user_id = auth.uid()) AND (ep.role = 'editor')))));
-- DROP POLICY IF EXISTS events_insert_admin ON public.events;
-- CREATE POLICY events_insert_authenticated ON public.events FOR INSERT TO public WITH CHECK (((SELECT auth.role()) = 'authenticated') AND ((SELECT auth.email()) IS NOT NULL));
-- CREATE POLICY events_insert_admin_only ON public.events AS RESTRICTIVE FOR INSERT TO public WITH CHECK ((SELECT is_admin()));
-- DROP POLICY IF EXISTS upload_diagnostics_admin ON public.upload_diagnostics;
-- CREATE POLICY upload_diagnostics_select ON public.upload_diagnostics FOR SELECT TO public USING ((SELECT auth.role()) = 'authenticated');
-- CREATE POLICY upload_diagnostics_insert ON public.upload_diagnostics FOR INSERT TO public WITH CHECK ((SELECT auth.role()) = 'authenticated');
-- GRANT EXECUTE ON FUNCTION public.check_lead_rate_limit(), public.enforce_print_quota(), public.handle_new_user(),
--   public.notify_on_new_lead(), public.photos_lock_urls(), public.studio_templates_before_update() TO PUBLIC, anon, authenticated;
-- ALTER FUNCTION public.photos_public_base_url() RESET search_path;
-- COMMIT;
-- ============================================================
