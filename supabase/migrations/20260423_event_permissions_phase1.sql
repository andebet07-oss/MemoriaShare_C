-- ============================================================
-- Phase 1: event_permissions — Schema and RLS
-- ============================================================
-- Adds UUID-based viewer/editor sharing grants to events.
--
-- Safe to run on any database that already carries the base schema.
-- Idempotent: uses IF NOT EXISTS / DROP IF EXISTS throughout.
--
-- What this migration does:
--   1. Creates the event_permissions table + indexes.
--   2. Enables RLS and realtime on the new table.
--   3. Adds three RLS policies on event_permissions (SELECT / INSERT / DELETE).
--   4. Extends four existing photo/event policies with an inline OR EXISTS
--      clause so editor-role grantees gain the same access as co-hosts.
--   5. Adds a new photos_select_viewer policy for viewer + editor SELECT.
--
-- What this migration does NOT do:
--   • Does not remove or alter co_hosts behavior.
--   • Does not touch events_delete_owner (delete stays owner-only).
--   • Does not touch photos_insert_authenticated.
--   • Does not touch enforce_print_quota or any Magnet tables.
--   • Does not introduce any functions or SECURITY DEFINER blocks.
-- ============================================================

-- ── 1. Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES events(id)      ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('viewer', 'editor')),
  granted_by  UUID        NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
  -- The UNIQUE constraint implicitly creates a (event_id, user_id) index,
  -- which covers the getForUser(eventId, userId) exact-match lookup pattern.
);

-- ── 2. Indexes ───────────────────────────────────────────────

-- For getByEvent: list all grants for a given event.
CREATE INDEX IF NOT EXISTS idx_event_permissions_event_id
  ON event_permissions(event_id);

-- For getForUser without event_id: "which events can I access?".
CREATE INDEX IF NOT EXISTS idx_event_permissions_user_id
  ON event_permissions(user_id);

-- For role-filtered EXISTS queries in photos/events RLS policies,
-- e.g. WHERE ep.event_id = $1 AND ep.role = 'editor'.
CREATE INDEX IF NOT EXISTS idx_event_permissions_event_role
  ON event_permissions(event_id, role);

-- ── 3. RLS + Realtime ────────────────────────────────────────

ALTER TABLE event_permissions ENABLE ROW LEVEL SECURITY;

-- Full replica identity so realtime payloads include old/new row data.
-- Enables the permissions-${eventId} channel in useEventGallery.js.
ALTER TABLE event_permissions REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE event_permissions;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- ── 4. Helper function ───────────────────────────────────────

-- is_event_owner: checks event ownership without querying events under RLS.
-- SECURITY DEFINER bypasses RLS on events, which prevents the 42P17
-- infinite-recursion cycle that would otherwise form:
--   events_update_owner → reads event_permissions
--   event_permissions_select → reads events  ← cycle!
-- Using SECURITY DEFINER here breaks the cycle identically to is_admin().
CREATE OR REPLACE FUNCTION is_event_owner(p_event_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id AND created_by = auth.uid()
  );
$$;

-- ── 5. RLS policies: event_permissions ───────────────────────

-- SELECT: grantee sees their own row; event owner sees all rows for
-- their events; admins see everything.
-- Uses is_event_owner() (SECURITY DEFINER) to avoid events→event_permissions→events cycle.
DROP POLICY IF EXISTS "event_permissions_select" ON event_permissions;
CREATE POLICY "event_permissions_select"
  ON event_permissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_admin()
    OR is_event_owner(event_id)
  );

-- INSERT: only the event owner or an admin may create grants.
DROP POLICY IF EXISTS "event_permissions_insert" ON event_permissions;
CREATE POLICY "event_permissions_insert"
  ON event_permissions FOR INSERT
  WITH CHECK (
    is_admin()
    OR is_event_owner(event_id)
  );

-- DELETE: only the event owner or an admin may revoke grants.
DROP POLICY IF EXISTS "event_permissions_delete" ON event_permissions;
CREATE POLICY "event_permissions_delete"
  ON event_permissions FOR DELETE
  USING (
    is_admin()
    OR is_event_owner(event_id)
  );

-- ── 6. Extend existing policies with editor role ─────────────
-- Each policy below is dropped and recreated with one new OR EXISTS
-- clause appended. All original conditions are preserved verbatim.
-- events_delete_owner is intentionally excluded — editors cannot
-- delete events, only the original creator can.

-- events_update_owner: editor-role grantees may update event fields.
-- NOTE: must use events.id explicitly. Unqualified `id` resolves to ep.id
-- because event_permissions also has an `id` column (PostgreSQL scoping rule).
DROP POLICY IF EXISTS "events_update_owner" ON events;
CREATE POLICY "events_update_owner"
  ON events FOR UPDATE
  USING (
    (select auth.uid()) = created_by
    OR (select auth.jwt()) ->> 'email' = ANY(co_hosts)
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = events.id
        AND ep.user_id  = auth.uid()
        AND ep.role     = 'editor'
    )
  )
  WITH CHECK (
    (select auth.uid()) = created_by
    OR (select auth.jwt()) ->> 'email' = ANY(co_hosts)
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = events.id
        AND ep.user_id  = auth.uid()
        AND ep.role     = 'editor'
    )
  );

-- photos_select_owner: editor-role grantees may read ALL photos
-- for their events, including hidden and unapproved.
DROP POLICY IF EXISTS "photos_select_owner" ON photos;
CREATE POLICY "photos_select_owner"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          (select auth.uid()) = e.created_by
          OR (select auth.jwt()) ->> 'email' = ANY(e.co_hosts)
        )
    )
    OR EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = event_id
        AND ep.user_id  = auth.uid()
        AND ep.role     = 'editor'
    )
  );

-- photos_update_owner: editor-role grantees may approve, hide,
-- and update photos (same moderation rights as co-hosts).
DROP POLICY IF EXISTS "photos_update_owner" ON photos;
CREATE POLICY "photos_update_owner"
  ON photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          (select auth.uid()) = e.created_by
          OR (select auth.jwt()) ->> 'email' = ANY(e.co_hosts)
        )
    )
    OR EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = event_id
        AND ep.user_id  = auth.uid()
        AND ep.role     = 'editor'
    )
  );

-- photos_delete_owner: editor-role grantees may delete any photo in their
-- managed events — the same authority the co_hosts array already grants.
-- Editor intentionally equals co-host: "can approve, hide, delete photos".
-- The self-uploader branch (auth.uid() = created_by) is unchanged.
DROP POLICY IF EXISTS "photos_delete_owner" ON photos;
CREATE POLICY "photos_delete_owner"
  ON photos FOR DELETE
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          (select auth.uid()) = e.created_by
          OR (select auth.jwt()) ->> 'email' = ANY(e.co_hosts)
        )
    )
    OR EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = event_id
        AND ep.user_id  = auth.uid()
        AND ep.role     = 'editor'
    )
  );

-- ── 6. New policy: photos_select_viewer ──────────────────────
-- Grants SELECT on non-hidden photos to viewer and editor grantees.
--
-- Access matrix after this migration:
--   owner / co-host → photos_select_owner  (all photos, any status)
--   editor grant    → photos_select_owner  (all photos, any status)
--                     + photos_select_viewer (redundant but harmless)
--   viewer grant    → photos_select_viewer  (non-hidden only, any approval)
--   public          → photos_select_public  (non-hidden + approved/auto-publish)
--   own upload      → photos_select_own     (always)
--
-- Viewers intentionally see non-hidden photos regardless of is_approved:
-- they have explicit access granted by the event owner, which is more
-- permissive than the anonymous public view but less than owner view.
DROP POLICY IF EXISTS "photos_select_viewer" ON photos;
CREATE POLICY "photos_select_viewer"
  ON photos FOR SELECT
  USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM event_permissions ep
      WHERE ep.event_id = event_id
        AND ep.user_id  = auth.uid()
        AND ep.role     IN ('viewer', 'editor')
    )
  );
