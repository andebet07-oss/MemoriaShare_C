---
name: useAuth profileReady gap — role flicker risk
description: Several useAuth consumers read user.role without gating on profileReady, causing a 6s window where admins are treated as regular users
type: project
---

`AuthContext.jsx` exposes two separate readiness flags:
- `isLoadingAuth` — flips false when the session is known (fast, localStorage-only path)
- `profileReady` — flips true only after `enrichWithProfile()` completes (may take up to 6s — the AbortController timeout at L37)

`user.role` is populated only during enrichment (L55). Between auth-settle and profile-ready, `user.role === 'user'` for admins.

Consumers that correctly gate on `profileReady`:
- `RequireAdmin.jsx:16` — `stillLoading = isLoadingAuth || !profileReady`

Consumers that DO NOT gate on `profileReady` and risk role flicker:
- `src/hooks/useIsAdmin.js:8-9` — returns `user?.role === 'admin'` without waiting; will briefly return false for admins after login
- `src/pages/CreateMagnetEvent.jsx:354` — reads `user` unconditionally
- `src/pages/CreateEvent.jsx:308` — reads `user` unconditionally
- `src/components/admin/CreateMagnetEventForm.jsx:10` — reads `user` unconditionally

**Why it matters:** RLS policies use `is_admin()` (SECURITY DEFINER) so server-side enforcement is correct. But client-side branches like "show admin-only button" will flicker. Also, `useEventGallery.js:239` derives `ownerOrAdmin` from `currentUser.role === 'admin'` — during the gap, an admin visiting their own event's gallery would NOT get owner treatment until enrichment completes.

**How to apply:** When adding a new admin-only UI branch or checking `user.role`, always destructure `profileReady` too and gate visibility on it. When adding to `useIsAdmin`, consider whether it should return `null` (unknown) during the gap rather than `false` (definitely not admin) to let callers distinguish "loading" from "not authorized".
