# MemoriaShare Retirement Plan

**Decision (2026-10-25):** Memoria is a single product, **MemoriaMagnet** (managed magnet printing at live events). MemoriaShare (self-service albums) is retired.
**Status:** PLAN, awaiting approval. Nothing is deleted and no DB change is applied until each phase is approved.

---

## 1. Coupling points: Magnet depends on these, so they stay

| Coupling | Why it matters | Handling |
|---|---|---|
| `/event/:code` renders `MagnetGuestPage` for `event_type='magnet'` (`src/pages/Event.jsx:79`) | Older printed QR codes may point at `/event/:code` | Keep the route as a redirect to `/magnet/:code` |
| Admin sign-in is the Google OAuth button in `src/components/home/Header.jsx` | `RequireAdmin` sends signed-out users to `/`, so `/admin` has no login of its own | Keep the header login and the "ניהול" link; drop only "האירועים שלי" |
| `photos` table + `photos` bucket + `api/resize-photo.ts` | `print_jobs.photo_id` references `photos`; print cards read `photos.file_urls.thumbnail` | Keep. Only the Share-only columns/policies go (Phase 2) |
| **No admin SELECT policy on `photos`**. Operators read photos only through `photos_select_public` | Tightening public read without adding an admin policy breaks PrintStation + MagnetEventDashboard | Phase 2 adds `photos_select_admin` *before* narrowing public read |
| `memoriaService` `events` / `photos` / `printJobs` / `storage` / `frameMeta` / `leads` | Shared service layer | Keep; remove only the Share-only methods listed below |
| `supabase/functions/payplus-webhook` | Updates `leads.is_paid`, which is the Magnet sales funnel | Keep |

---

## 2. Phase 1: Frontend retirement (no DB change)

### Routes (`src/App.jsx`)
- `/event/:code`, `/event/:code/gallery` → `<Navigate to="/magnet/:code">` (keeps old QR codes working)
- `/host`, `/host/events/*`, `/MyEvents`, `/CreateEvent`, `/EventSuccess` → `/`
  - *Partly done in Stage 1 (`a20b042`):* `/host/events/create` (and `/CreateEvent`) now redirects by role, to the admin magnet wizard or to `/magnet/lead`. `src/pages/CreateEvent.jsx` is unreferenced; delete it in Phase 1.
- Remove `/admin/events/share`
- `MagnetGuestEntry`: a non-magnet code shows "אירוע לא נמצא" instead of bouncing to `/event/:code` (otherwise it loops with the redirect above)

### Delete (Share-only according to the import graph; nothing on the Magnet side imports them)
- **Pages:** `Event`, `EventGallery`, `EventSuccess`, `CreateEvent`, `Dashboard`, `MyEvents`
- **Components:** `HostOnboardingModal`, `PullToRefresh`, `camera/CameraCapture`, `dashboard/*` (incl. `cards/*`, `useColorExtractor`, `AdminGallery`), `gallery/*`, `notifications/RealtimeNotification`, `home/ProductChooser`, `createEvent/PhoneMockup`, `pricing/PricingSlider`
- **Functions:** `checkGuestQuota`, `getMyPhotos`, `requestPhotoDeletion`, `resolvePhotoDeletion`
- **Hooks:** `useEventGallery`, `useRealtimeNotifications`
- **memoriaService:** `eventPermissions.*`, `profiles.getByEmail`, `photos.approve`, and the Share defaults in `events.create` (`privacy_mode`, `guest_tier`, `max_uploads_per_user`)

### Modify
- **Home:** ~~remove `ProductChooser`; every CTA goes to `/magnet/lead`~~ — done in Stage 1 (CTA commit on `claude/lucid-knuth-l1jm0g`). Rewrite the copy in `HeroSection` / `Features` / `HowItWorks` / `FAQ` / `FinalCTA` / `Testimonials` for Magnet (Hebrew; needs copy sign-off)
- **Header:** drop "האירועים שלי"; keep login, logout and "ניהול"
- **Admin:** remove the share tab (`AdminShell`), the share KPI and the `/host/events/:id` fallback link (`AdminOverview`), the `type` prop and share branches (`AdminEventsList`), and the `MyEvents` links (`AdminUsers`)
- **AuthContext / App:** remove `needsOnboarding` + `HostOnboardingModal` mount
- **Branding strings:** `LOGO.png` alt text, `public/manifest.json`, `index.html` title, `package.json` name

### Optional, separate commit: already-dead code (unreachable today, not Share-specific)
`PrintQueue`, `PrintJobCard` (replaced by `MagnetProStation`), `CreateMagnetEventForm`, `functions/processImage`, `lib/frameRenderer`, `lib/logger`, `hooks/useIsAdmin`, `utils/photoUtils` (+ test), `ui/IphoneMockup`, `ui/PremiumButton`, `ui/TileGroup`, `ui/EmptyState`, `src/pages.config.js`

### Verify
`npm run lint`, `npm run build`, `npm test`; walk-through of `/`, `/magnet/lead`, `/magnet/:code` (camera → review → print status), `/event/:code` redirect, `/admin` (overview, magnet events, create, dashboard, print station, frames, leads, users).

---

## 3. Phase 2: DB / RLS (migration file + approval before applying)

Written as `supabase/migrations/2026MMDD_retire_share.sql`, split into a **safe** part and a **destructive** part, applied separately.

**2a. Security tightening (safe, reversible)**
- `photos_select_admin` (new): `USING (is_admin())`. Must land first.
- `photos_select_public` → drop. Today every approved photo is publicly listable, and Magnet photos are inserted with `is_approved = true` (`MagnetReview.jsx:297`), so any anonymous client can list all guest photos of every Magnet event. Guests keep `photos_select_own`.
- `events_insert_authenticated` → admin-only (`is_admin()`). Today any Google account can create an event.
- `photos_update_owner` / `photos_delete_owner` / `events_update_owner` → drop the `co_hosts` + `event_permissions` branches; keep creator/uploader + `is_admin()`
- Drop `photos_select_owner`, `photos_select_viewer`
- `upload_diagnostics_select` → admin-only

**2b. Schema cleanup (destructive: only after the Share-data decision below)**
- Drop `event_permissions` (+ realtime publication entry), `is_event_owner()`
- Drop `events` columns: `co_hosts`, `pin_code`, `guest_tier`, `max_uploads_per_user`, `upload_closure_datetime`, `auto_publish_guest_photos`
- Drop `photos` columns: `guest_greeting`, `deletion_status`, `device_uuid` (+ any `prevent_guest_approval` trigger, to be confirmed against the live DB)
- `events.event_type`: default `'magnet'`, then `CHECK (event_type = 'magnet')` once no `share` rows remain
- Update `CLEAN_RESET_SCHEMA.sql` to match

Every statement gets verified against the **live** schema first (`CLEAN_RESET_SCHEMA.sql` lags behind the `supabase/migrations/` files).

---

## 4. Decisions needed from you

1. **Existing Share events and photos:** (a) hard stop, where `/event/:code` for share events shows "האלבום אינו פעיל עוד"; (b) a read-only grace period so hosts can download a ZIP until a date; (c) export, then delete the rows and storage objects. This decides when 2b can run.
2. **Landing copy:** do I draft new Hebrew Magnet copy for Home, or do you supply it?
3. **Scope of Phase 1:** include the optional dead-code commit, or keep it separate?
4. **Phase 2a** can ship independently of the Share-data decision. Write it now?
