---
name: Service layer invariant status
description: Count and location of direct supabase.from() / .channel() / .storage calls outside memoriaService; tracks whether the service layer rule is being honored
type: project
---

Direct Supabase client usage outside the service layer as of 2026-04-22 (verify with grep `supabase\.(from|channel|storage|auth)\(` before acting):

**Why:** CLAUDE.md mandates all DB calls go through `memoriaService`. Tracking drift from this rule is critical to detecting architecture erosion.

**How to apply:** Before approving new code, check whether it re-opens any of these exceptions or introduces a new direct call. Any new direct call in a component = structural regression.

## Direct usage outside service layer (legitimate)
- `src/lib/AuthContext.jsx` — auth.getSession/onAuthStateChange/updateUser — OWNED by auth context, do not refactor out
- `src/hooks/useEventGallery.js` — `.channel()` for realtime photos; also calls `signInAnonymously` and `getSession` as fallback — acceptable, documented WHY
- `src/hooks/useRealtimeNotifications.js` — `.channel()` for notifications — acceptable
- `src/pages/MagnetGuestPage.jsx` — `.channel()` for guest prints + `signInAnonymously` — acceptable
- `src/components/magnet/PrintQueue.jsx` — `.channel()` for print jobs — acceptable
- `src/pages/EventGallery.jsx` — `getSession` + `signInAnonymously` + `updateUser` for guest book flow — acceptable, documented WHY

## Direct usage that is a structural leak (flag on next audit)
- `src/pages/AdminUsers.jsx` — calls `supabase.from('profiles')` directly via react-query (NOT routed through memoriaService). Should have a `memoriaService.profiles.{list,updateRole}` namespace.
- `src/pages/EventSuccess.jsx` — imports supabase but grep shows only 1 hit; re-check before asserting it's a leak.
- `src/components/HostOnboardingModal.jsx` — direct supabase usage for profile update.
- `src/lib/framesUtils.js` — uses memoriaService.frameMeta, clean.
