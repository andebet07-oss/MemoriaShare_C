---
name: Role Resolution Pattern (Permissions + co_hosts coexistence)
description: Canonical priority table and exact code block for deriving effectiveRole when both event_permissions table and legacy co_hosts email array can grant access
type: project
---

During the transition period (Phases 3–6), role resolution follows this priority table — first match wins:

| Priority | Condition | Effective Role | Notes |
|----------|-----------|----------------|-------|
| 1 | `currentUser.role === 'admin'` | `owner` | System admin bypasses all event-level checks |
| 2 | `event.created_by === currentUser.id` | `owner` | Original creator |
| 3 | event_permissions row with role='editor' for currentUser.id | `editor` | UUID-keyed new system |
| 4 | email in `event.co_hosts[]` (legacy) | `editor` | Treated as editor; beats viewer grant |
| 5 | event_permissions row with role='viewer' for currentUser.id | `viewer` | Only if NOT also in co_hosts[] |
| 6 | None of the above | `guest` | Default |

**Conflict rule — higher privilege wins:** If a user has a `viewer` row in `event_permissions` AND their email is in `co_hosts[]`, their effective role is `editor` (priority 4 beats priority 5). The `viewer` row does not downgrade a legacy co-host during the migration window. Only Phase 7 (co_hosts column drop) can change this.

**Canonical code block (copy verbatim into useEventGallery.js and Dashboard.jsx):**

```javascript
// Dual-system role resolution — migration window
// Priority: system-admin > creator > new-system-editor > legacy-cohost > new-system-viewer > guest
const isSystemAdmin   = currentUser.role === 'admin';
const isCreator       = event.created_by === currentUser.id;

let grantedRole = null; // from event_permissions table
if (!isSystemAdmin && !isCreator) {
  const permRow = await memoriaService.eventPermissions.getForUser(event.id, currentUser.id);
  grantedRole = permRow?.role ?? null; // 'editor' | 'viewer' | null
}

const isLegacyCoHost  = Array.isArray(event.co_hosts) && event.co_hosts.includes(currentUser.email);
const isNewEditor     = grantedRole === 'editor';
const isNewViewer     = grantedRole === 'viewer';

// Higher privilege wins: co_hosts presence always resolves to editor regardless of new-system role
const effectiveIsEditor = isNewEditor || isLegacyCoHost;
const effectiveIsViewer = isNewViewer && !isLegacyCoHost; // co_hosts overrides viewer grant

let effectiveRole = 'guest';
if (isSystemAdmin || isCreator) effectiveRole = 'owner';
else if (effectiveIsEditor)     effectiveRole = 'editor';
else if (effectiveIsViewer)     effectiveRole = 'viewer';
```

**isOwner backward compatibility:** The hook return MUST keep `isOwner: effectiveRole === 'owner'`. EventGallery.jsx and GalleryHeader.jsx consume it. Remove only after all consumers are migrated to effectiveRole — separate cleanup PR.

**Phase 7 simplification:** Once co_hosts column is dropped, remove isLegacyCoHost line, set `effectiveIsEditor = isNewEditor` and `effectiveIsViewer = isNewViewer`.

**Why:** Removing the legacy check before Phase 7 silently locks out co-hosts whose emails are in co_hosts[] but have no UUID row in event_permissions yet.
