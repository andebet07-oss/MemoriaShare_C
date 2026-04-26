---
name: Event Permissions Feature Plan
description: Implementation plan for viewer/editor sharing permissions on events — table design, coexistence with co_hosts, inline RLS EXISTS pattern, migration sequence
type: project
---

New `event_permissions` table uses UUID-based identity. Legacy `co_hosts` column uses email strings. Both systems must coexist until a formal deprecation PR (Phase 7). Role resolution in `useEventGallery.js` and `Dashboard.jsx` must check BOTH systems (union logic) for any access decision during the transition period.

**Why:** A user can legitimately be recognized by their email (co_hosts legacy) before their UUID is in event_permissions. Dropping one check before the migration completes will silently lock out existing co-hosts.

**How to apply:** When implementing the `effectiveRole` derivation in Phase 3, always include both checks. See arch_role_resolution_pattern.md for the canonical code block and priority table.

**RLS pattern — inline EXISTS, no helper function (revised 2026-04-23):**
Do NOT create a `is_editor_for_event(UUID)` SECURITY DEFINER helper function. All editor checks in RLS policies use inline correlated EXISTS subqueries:

```sql
OR EXISTS (
  SELECT 1 FROM event_permissions ep
  WHERE ep.event_id = <table>.id  -- or <table>.event_id depending on policy table
    AND ep.user_id  = (select auth.uid())
    AND ep.role     = 'editor'
)
```

**Why no helper function:** SECURITY DEFINER functions execute as the function owner, bypassing the calling user's RLS context. Inline EXISTS runs under the correct calling-user context, is easier to audit, and avoids a hidden privilege escalation surface.

**CoHostsManager.jsx bug:** Line ~29 has `trimmed === event.created_by` comparing email string to UUID — always false. Fix in Phase 5 UI layer only, not before.

**Rollback note:** No `DROP FUNCTION is_editor_for_event(UUID)` step in rollback — the function is never created.
