---
name: Supabase v2 auth mutex workarounds
description: Why memoriaService uses raw fetch + localStorage JWT for storage and photos.create — DO NOT refactor to supabase-js without understanding
type: feedback
---

Rule: Do NOT replace the raw `fetch()` calls in `memoriaService.storage.upload`, `memoriaService.storage.uploadOverlay`, `memoriaService.storage.uploadCoverImage`, or `memoriaService.photos.create` with the corresponding `supabase-js` methods. The raw fetch + `_getJwt()` (reading the access_token out of localStorage directly) is a deliberate workaround, not cruft.

**Why:** In `@supabase/supabase-js` v2.x, `supabase.storage.upload()` and `supabase.from().insert()` call `_fetchWithAuth` which checks session expiry before every request. If the token is near expiry, `refreshSession()` is invoked — re-entering the same auth mutex that `signInAnonymously()` holds at guest-page mount time. The hang is silent, indefinite, and breaks the upload flow. The team hit this in production and fixed it with the fetch-bypass pattern. The comments in memoriaService.jsx lines 225-229 and 414-420 document this.

**How to apply:** If you see anyone "simplifying" these back to `supabase.storage.upload(...)`, reject the change and reference the comments. The same reason is why `checkGuestQuota.js` is pure and `getMyPhotos.js` accepts `user_id` as a param rather than calling `supabase.auth.getUser()`.

Related: `useEventGallery.uploadAllPendingPhotos` resolves user ID via a three-tier fallback (AuthContext state → getSession with 2s timeout → signInAnonymously) for the same reason — any direct `getUser()` can hang the mutex.
