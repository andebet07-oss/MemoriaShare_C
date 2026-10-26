-- ============================================================
-- Polaroid templates (1/2): template choice per event — additive
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Replaces the frame reference (events.overlay_frame_url) with a code-rendered
-- template choice. Additive only: the current production code ignores the new
-- columns, so apply this BEFORE merging the templates PR (the new code writes
-- template_id / template_options when an event is created or edited).
--
--   template_id       which template renders the magnet ('A' Soft, 'B' Serif,
--                     'C' Red heart, 'D' Rings, 'F' Handwritten, 'G' Script).
--                     No CHECK on the list: adding a template stays a code-only
--                     change, and the renderer falls back to 'A' for an unknown id.
--   template_options  the template's options as named choices, e.g.
--                     A {"heart":"red","url":false}, B {"amp":"gold"}, D {"icon":"taupe"}.
--                     Validated by the renderer; unknown keys/values use defaults.
--
-- Existing (test) events get 'A' + {} from the defaults.
-- RLS: no new policy. Guests read events through the existing SELECT policy;
-- with 20261025_print_pipeline_hardening applied, magnet-event updates are
-- admin-only (events_update_magnet_admin_only), which covers these columns.
--
-- Apply order: docs/runbooks/pre-migration-backup.md (snapshot → pg_dump → apply).
-- Rollback:
--   ALTER TABLE public.events DROP COLUMN IF EXISTS template_options,
--                             DROP COLUMN IF EXISTS template_id;
-- ============================================================

BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS template_id text NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS template_options jsonb NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT events_template_options_is_object CHECK (jsonb_typeof(template_options) = 'object');

COMMENT ON COLUMN public.events.template_id IS
  'Magnet polaroid template id (src/lib/polaroid/templates.js). Unknown ids render as A.';
COMMENT ON COLUMN public.events.template_options IS
  'Template options as named choices, e.g. {"heart":"red","url":false}.';

COMMIT;
