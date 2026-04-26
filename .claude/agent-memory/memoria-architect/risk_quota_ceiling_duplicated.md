---
name: Per-user upload quota ceiling is computed in three places
description: The 200/50/15 upload ceiling is duplicated across getUserMaxUploads, eventMaxPhotos, and checkGuestQuota — values must agree
type: project
---

The per-user upload ceiling for Share events is computed in three separate locations and must be kept consistent:

1. `useEventGallery.js:434-440` — `getUserMaxUploads()` returns 200 for super-admin (email effitag@gmail.com), 200 for event owner (created_by match), 50 for co-host, else `event.max_uploads_per_user || 15`.
2. `useEventGallery.js:717-724` — `eventMaxPhotos` derivation uses the SAME rule set with the same magic numbers, plus `isSuperAdmin` computed again inline.
3. `src/functions/checkGuestQuota.js:67` — backend-of-record quota check uses ONLY `event.max_uploads_per_user || 15`. It is NOT aware of the 200/50 tier.

**Why:** The service-layer quota check (checkGuestQuota) is the authoritative one; the two client-side computations are UX guardrails. If someone changes one tier (say, super-admin goes to 500), the other site will silently drift and the UI may show wrong remaining counts.

**How to apply:** Any PR that edits quota limits must update all three sites. Before writing quota logic, extract the tier computation into a single shared helper — there is no `useQuota` hook yet (see MEMORY.md missing-pieces). Also: the super-admin literal `'effitag@gmail.com'` appears at useEventGallery.js:436 and :717 — centralize it.
