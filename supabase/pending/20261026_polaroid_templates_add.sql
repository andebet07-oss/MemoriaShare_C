-- ============================================================
-- Polaroid templates (1/2): template choice per event + render snapshot
-- per print job — additive
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Replaces the frame reference (events.overlay_frame_url) with a code-rendered
-- template choice, and records on each print job what its magnet was rendered
-- with. Additive only: the current production code ignores the new columns.
-- Apply this BEFORE merging the templates PR — the new code writes these
-- columns when an event is created or edited AND on every guest print job,
-- so without them guests could not send to print.
--
-- events
--   template_id       which template renders the magnet ('A' Soft, 'B' Serif,
--                     'C' Red heart, 'D' Rings, 'F' Handwritten, 'G' Script).
--                     No CHECK on the list: adding a template stays a code-only
--                     change, and the renderer falls back to 'A' for an unknown id.
--   template_options  the template's options as named choices, e.g.
--                     A {"heart":"red","url":false}, B {"amp":"gold"}, D {"icon":"taupe"}.
--                     Validated by the renderer; unknown keys/values use defaults.
--   Existing (test) events get 'A' + {} from the defaults.
--
-- print_jobs
--   render_snapshot   everything that shaped the guest's magnet, as the guest
--                     saw it on the review screen:
--                     {"v":1,"templateId":"C","options":{},"name":"נועה & איתי","date":"2026-12-15"}
--                     An operator re-crop re-renders from it, so a template /
--                     name / date change on the event afterwards doesn't alter
--                     queued magnets. NULL (jobs from before this migration) →
--                     the event's current settings. The renderer validates the
--                     template id and options; names and date are plain text.
--                     Capped at 2 KB because guests write it.
--
-- RLS: no new policy.
--   events: guests read through the existing SELECT policy; with
--     20261025_print_pipeline_hardening applied, magnet-event updates are
--     admin-only (events_update_magnet_admin_only), which covers the columns.
--   print_jobs: neither the repo's guest INSERT policy nor hardening's
--     print_jobs_insert_guest restricts render_snapshot (live policy text has
--     drifted — check after applying: a guest print from the new code must
--     succeed and store the snapshot). A guest can only set it on their own
--     job, and it only shapes their own magnet — they already upload the
--     composite image itself. Updates stay operator-only.
--
-- Apply order: docs/runbooks/pre-migration-backup.md (snapshot → pg_dump → apply).
-- Rollback:
--   ALTER TABLE public.print_jobs DROP COLUMN IF EXISTS render_snapshot;
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

ALTER TABLE public.print_jobs
  ADD COLUMN IF NOT EXISTS render_snapshot jsonb
    CONSTRAINT print_jobs_render_snapshot_shape CHECK (
      render_snapshot IS NULL
      OR (jsonb_typeof(render_snapshot) = 'object' AND octet_length(render_snapshot::text) <= 2048)
    );

COMMENT ON COLUMN public.print_jobs.render_snapshot IS
  'What the guest''s magnet was rendered with: {v, templateId, options, name, date}. Re-crops render from it; NULL = event''s current settings.';

COMMIT;
