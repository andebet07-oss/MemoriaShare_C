-- ============================================================
-- Frame studio (/admin/studio): template library + files — additive
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Plan: docs/studio-migration-plan.md §3 (decision D1: one library shared by all admins).
-- Additive only: nothing in the current app reads these objects, so this can be
-- applied before the studio code ships.
--
--   public.studio_templates   one row per frame template; `doc` is the studio's
--                             template.json, unchanged
--   storage "studio-files"    private bucket: {template_id}/assets/<file>,
--                             {template_id}/thumbnail.png
--
-- Access: admins only (public.is_admin()), for the table and the bucket. Anonymous
-- visitors (guests have anonymous sessions) and signed-in non-admins get nothing.
--
-- The guard block aborts the whole migration, changing nothing, if is_admin() is
-- missing or doesn't check profiles.role = 'admin' for auth.uid(), or if the table or
-- bucket already exists.
--
-- QA after applying: docs/qa/studio-templates-rls-test.sql. Rollback: end of this file.
-- ============================================================

BEGIN;

-- ── Guards ──────────────────────────────────────────────────
DO $$
DECLARE
  fn regprocedure := to_regprocedure('public.is_admin()');
  def text;
BEGIN
  IF fn IS NULL THEN
    RAISE EXCEPTION 'public.is_admin() is missing: the studio policies depend on it';
  END IF;
  def := pg_get_functiondef(fn);
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = fn) THEN
    RAISE EXCEPTION 'public.is_admin() is not SECURITY DEFINER (it would hit profiles RLS): %', def;
  END IF;
  IF def !~ 'auth\.uid\(\)' OR def !~ $re$role\s*=\s*'admin'$re$ THEN
    RAISE EXCEPTION 'public.is_admin() does not look like the profiles.role = ''admin'' check: %', def;
  END IF;
  IF to_regclass('public.studio_templates') IS NOT NULL THEN
    RAISE EXCEPTION 'public.studio_templates already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'studio-files') THEN
    RAISE EXCEPTION 'storage bucket studio-files already exists';
  END IF;
END $$;

-- ── Table ───────────────────────────────────────────────────
CREATE TABLE public.studio_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who created it. A record only: the library is shared by all admins, and a
  -- template outlives its creator's account, so there is no foreign key.
  owner_id    uuid NOT NULL DEFAULT auth.uid(),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  doc         jsonb NOT NULL CHECK (octet_length(doc::text) <= 512000), -- images are never embedded
  revision    integer NOT NULL DEFAULT 1,                                 -- bumped on every save
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.studio_templates IS
  'Frame studio templates (/admin/studio). doc holds template.json; images are in the studio-files bucket.';
COMMENT ON COLUMN public.studio_templates.revision IS
  'Incremented by trigger on every update. The studio saves with "where revision = <last seen>", so two open tabs never silently overwrite each other.';

CREATE INDEX studio_templates_updated_idx ON public.studio_templates (updated_at DESC);

-- Server-controlled fields: a client can't change the creator, the creation time or the revision.
CREATE FUNCTION public.studio_templates_before_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.owner_id   := OLD.owner_id;
  NEW.created_at := OLD.created_at;
  NEW.revision   := OLD.revision + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER studio_templates_before_update
BEFORE UPDATE ON public.studio_templates
FOR EACH ROW EXECUTE FUNCTION public.studio_templates_before_update();

-- ── Access: admins only ─────────────────────────────────────
ALTER TABLE public.studio_templates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.studio_templates FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_templates TO authenticated;

CREATE POLICY studio_templates_select_admin
  ON public.studio_templates FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- A new row is recorded under the admin who creates it.
CREATE POLICY studio_templates_insert_admin
  ON public.studio_templates FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) AND owner_id = (SELECT auth.uid()));

CREATE POLICY studio_templates_update_admin
  ON public.studio_templates FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY studio_templates_delete_admin
  ON public.studio_templates FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ── Files: private bucket, admins only ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-files',
  'studio-files',
  false,
  20971520, -- 20 MB per file
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

CREATE POLICY studio_files_select_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'studio-files' AND (SELECT public.is_admin()));

CREATE POLICY studio_files_insert_admin
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-files' AND (SELECT public.is_admin()));

CREATE POLICY studio_files_update_admin
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-files' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'studio-files' AND (SELECT public.is_admin()));

CREATE POLICY studio_files_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-files' AND (SELECT public.is_admin()));

COMMIT;

-- ============================================================
-- ROLLBACK (only if needed; deletes every studio template and file record)
-- Empty the bucket first in Dashboard → Storage → studio-files (Supabase blocks
-- deleting storage rows from SQL), then run:
--
-- BEGIN;
-- DROP POLICY IF EXISTS studio_files_select_admin ON storage.objects;
-- DROP POLICY IF EXISTS studio_files_insert_admin ON storage.objects;
-- DROP POLICY IF EXISTS studio_files_update_admin ON storage.objects;
-- DROP POLICY IF EXISTS studio_files_delete_admin ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'studio-files';
-- DROP TABLE IF EXISTS public.studio_templates;
-- DROP FUNCTION IF EXISTS public.studio_templates_before_update();
-- COMMIT;
-- ============================================================
