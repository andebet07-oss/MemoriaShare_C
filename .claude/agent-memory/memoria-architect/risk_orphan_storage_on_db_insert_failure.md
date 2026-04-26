---
name: Orphan storage objects on DB-insert failure in photo upload
description: storage.upload succeeds before photos.create; a create failure leaves the uploaded file with no DB row and no cleanup
type: project
---

Photo upload is a 2-step, non-atomic write: `memoriaService.storage.upload` then `memoriaService.photos.create` (useEventGallery.js lines 546 and 564 in the Share flow; MagnetReview.jsx lines 285-287 in the Magnet flow). Both use raw fetch, not transactional.

**Why:** If the storage POST returns 2xx and then the photos-table POST returns 4xx/5xx (e.g. RLS rejects created_by mismatch, network drop between the two calls, expired JWT used by raw fetch), the object stays in the `photos` bucket forever. No cleanup path exists.

**How to apply:** Any new upload path added to `memoriaService` should pair the storage write with a compensating `storage.remove` on DB-insert failure, or move the two-step operation into a Postgres RPC/edge function. Flag PRs that add new storage.upload call sites without rollback handling. MagnetReview.jsx:293 has a cleanup for the reverse case (photo.delete if printJobs.create fails) — follow that pattern for all compound writes.
