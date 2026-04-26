---
name: useEventGallery triple-array fan-out pattern
description: In useEventGallery.js the photos/myPhotos/sharedPhotos arrays must be mutated in parallel by every realtime handler — easy to forget and creates drift bugs
type: project
---

In `src/hooks/useEventGallery.js`, three state arrays hold overlapping copies of the same photos:

- `photos` (L31) — the full "owner view" list
- `myPhotos` (L32) — only the current user's photos, fetched via `getMyPhotos`
- `sharedPhotos` (L33) — approved-or-auto-published photos for the public guest view

The realtime handler at L287-337 must fan out every INSERT/UPDATE/DELETE to all three. Upload success (L588-594) also writes to `photos` AND `myPhotos` optimistically.

**Why:** Share uses three different RLS paths:
- `photos_select_owner` — for the host view (all photos)
- `photos_select_own` — for the "my photos" tab (each guest's own)
- `photos_select_public` — for the public tab (approved/auto-published)

Each path needs its own client cache because one user might be simultaneously owner-of-an-event and guest-in-another.

**How to apply:** When adding a new feature that mutates photo rows (e.g., a new approval flow, new metadata field, new delete state), you must update the handler to mirror the change into all three arrays in the correct conditions. Forgetting `myPhotos` is the most common bug because it lives in a separate endpoint (`getMyPhotos`) rather than being derived from `photos`. Also remember: `userUploadedCount` (L38) is a fourth source of truth that must be incremented/decremented alongside `myPhotos` mutations.
