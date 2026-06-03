-- ============================================================
-- Fix: events_update_owner — wrong column reference in editor EXISTS
-- Applied to live DB: 2026-06-03
-- ============================================================
--
-- Bug: the migration 20260423_event_permissions_phase1.sql used
-- `ep.event_id = id` inside a subquery aliased as `ep` for
-- event_permissions. Because event_permissions also has an `id`
-- column, PostgreSQL resolved the unqualified `id` to ep.id
-- (the event_permissions primary key) instead of events.id.
--
-- Result: the editor-role EXISTS check was always false
-- (event_permissions.event_id never equals event_permissions.id).
-- Editor grantees could never update events.
--
-- Fix: use events.id (explicitly qualified) to reference the outer
-- events row. This is the correct scoping in a policy body.
-- ============================================================

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
