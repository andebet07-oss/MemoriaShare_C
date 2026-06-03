-- ============================================================
-- Fix: RLS infinite recursion on events table (42P17)
-- Applied to live DB: 2026-06-03
-- ============================================================
--
-- Root cause:
--   events_update_owner (UPDATE policy on events) contains an EXISTS
--   subquery on event_permissions.
--   event_permissions_select (SELECT policy on event_permissions)
--   contained an EXISTS subquery on events.
--   → Cycle: events → event_permissions → events → 42P17.
--
-- PostgreSQL raises 42P17 at runtime when it detects it is already
-- evaluating RLS policies for a table and encounters a second request
-- to evaluate the same table's policies. This fires even when OR
-- short-circuiting might theoretically skip the EXISTS clause, because
-- the query planner can reorder OR operands.
--
-- Fix: replace the raw EXISTS-on-events in event_permissions policies
-- with a SECURITY DEFINER function (is_event_owner) that reads events
-- without triggering RLS — same pattern as the existing is_admin().
-- ============================================================

-- ── 1. SECURITY DEFINER helper ───────────────────────────────
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

-- ── 2. Rebuild event_permissions policies ────────────────────
DROP POLICY IF EXISTS "event_permissions_select" ON event_permissions;
CREATE POLICY "event_permissions_select"
  ON event_permissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_admin()
    OR is_event_owner(event_id)
  );

DROP POLICY IF EXISTS "event_permissions_insert" ON event_permissions;
CREATE POLICY "event_permissions_insert"
  ON event_permissions FOR INSERT
  WITH CHECK (
    is_admin()
    OR is_event_owner(event_id)
  );

DROP POLICY IF EXISTS "event_permissions_delete" ON event_permissions;
CREATE POLICY "event_permissions_delete"
  ON event_permissions FOR DELETE
  USING (
    is_admin()
    OR is_event_owner(event_id)
  );
