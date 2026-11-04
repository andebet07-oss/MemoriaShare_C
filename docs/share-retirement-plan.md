# MemoriaShare Retirement Plan

**Decision (2026-10-25):** Memoria is a single product, **MemoriaMagnet** (managed magnet printing at live events). MemoriaShare (self-service albums) is retired.
**Status:** approved 2026-11-04 (decisions in §4). Phase 1 (frontend + dead code + packages) done on the branch, awaiting deploy. Phase 2a migration written and tested, to apply after Phase 1 is live. Next: Share backup (D1), landing copy (D2).

---

## 1. Coupling points: Magnet depends on these, so they stay

| Coupling | Why it matters | Handling |
|---|---|---|
| `/event/:code` renders `MagnetGuestPage` for `event_type='magnet'` (`src/pages/Event.jsx:79`) | Older printed QR codes may point at `/event/:code` | Keep the route as a redirect to `/magnet/:code` |
| ~~Admin sign-in is the Google OAuth button in `src/components/home/Header.jsx`~~ | **Done 2026-11-04:** the landing page has no sign-in; `/admin` shows its own (`RequireAdmin` → `AdminSignIn`) | Header keeps only the "ניהול" link for a signed-in admin |
| `photos` table + `photos` bucket + `api/resize-photo.ts` | `print_jobs.photo_id` references `photos`; print cards read `photos.file_urls.thumbnail` | Keep. Only the Share-only columns/policies go (Phase 2) |
| **No admin SELECT policy on `photos`**. Operators read photos only through `photos_select_public` | Tightening public read without adding an admin policy breaks PrintStation + MagnetEventDashboard | Phase 2 adds `photos_select_admin` *before* narrowing public read |
| `memoriaService` `events` / `photos` / `printJobs` / `storage` / `leads` | Shared service layer | Keep; remove only the Share-only methods listed below |
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
`functions/processImage`, `lib/logger`, `hooks/useIsAdmin`, `utils/photoUtils` (+ test), `ui/IphoneMockup`, `ui/PremiumButton`, `ui/TileGroup`, `ui/EmptyState`, `src/pages.config.js`

### Verify
`npm run lint`, `npm run build`, `npm test`; walk-through of `/`, `/magnet/lead`, `/magnet/:code` (camera → review → print status), `/event/:code` redirect, `/admin` (overview, magnet events, create, dashboard, print station, leads, users).

---

## 3. Phase 2: DB / RLS (migration file + approval before applying)

Written as `supabase/migrations/2026MMDD_retire_share.sql`, split into a **safe** part and a **destructive** part, applied separately.

**2a. Security tightening (safe, reversible)**: written as `supabase/pending/20261104_retire_share_2a.sql`, QA `docs/qa/share-2a-test.sql`. Tested on a local stand-in of the live rules: 16/28 before the migration (the 12 holes fail), 28/28 after, rollback restores the original rules. Apply after Phase 1 is live.
- `photos_select_admin` already exists (Stage 1). Magnet photos are already private (`photos_magnet_private_*`, Stage 1).
- `photos_select` (live name) → drop. Anyone can read every approved **Share** photo (83 photos). Replaced by `photos_select_own` (uploader).
- `events_insert_authenticated` + the restrictive `events_insert_admin_only` → one `events_insert_admin`. Only admins can create events already; this is cleanup.
- `photos_update` / `photos_update_owner` / `photos_delete_owner` / `events_update_owner` → drop the `co_hosts` + `event_permissions` branches; keep creator/uploader + `is_admin()` (new `photos_update_admin`, `photos_delete_own`, `photos_delete_admin`)
- Drop `photos_select_owner`, `photos_select_viewer`. Their `ep.event_id = ep.event_id` bug let an editor/viewer on one event reach every event's photos (`event_permissions` is empty, so not exploited)
- `upload_diagnostics` → admin-only (empty and unused; any guest could read and write it)
- Supabase advisor: revoke EXECUTE on trigger functions from `anon` / `authenticated`; pin `photos_public_base_url()` search_path

**Seen in the 2a audit, left for 2b:** `events_select_public` lets anyone list every active event with all its columns (incl. `pin_code`, `co_hosts`: all empty today). Dropping the Share columns fixes the PII part; drop `upload_diagnostics` too.

**2b. Schema cleanup (destructive: only after the Share-data decision below)**
- Drop `event_permissions` (+ realtime publication entry), `is_event_owner()`
- Drop `events` columns: `co_hosts`, `pin_code`, `guest_tier`, `max_uploads_per_user`, `upload_closure_datetime`, `auto_publish_guest_photos`
- Drop `photos` columns: `guest_greeting`, `deletion_status`, `device_uuid` (+ any `prevent_guest_approval` trigger, to be confirmed against the live DB)
- `events.event_type`: default `'magnet'`, then `CHECK (event_type = 'magnet')` once no `share` rows remain
- Update `CLEAN_RESET_SCHEMA.sql` to match

Every statement gets verified against the **live** schema first (`CLEAN_RESET_SCHEMA.sql` lags behind the `supabase/migrations/` files).

---

## 5. Stage 2 + 4 rebuild: private photo bucket with signed URLs (decided 2026-10-26)

**Why:** the `photos` bucket is public, so anyone who has a photo URL can fetch it, whatever the table RLS says. This was the Codex review finding on PR #4. The Stage 1 migration hides the rows and the next follow-up closes the Storage list endpoint. This step removes the public URLs themselves.

**Shape**
- **Split storage by audience.**
  - A private bucket for guest captures (composites, raw photos, derived thumbnails).
  - A public bucket for assets every guest must load: covers, lead covers if they stay public. (Overlay frames are gone: templates are drawn in code.)
- **Store paths, not URLs.** Today `photos.file_url`, `photos.file_urls` and `print_jobs.raw_photo_url` hold public URLs. Keep the storage path and mint signed URLs on read, through `memoriaService`, batched with `createSignedUrls`.
- **Read access** (storage SELECT on the private bucket): the uploader (owner) and admins.
- **Expiry:** signed URLs need a lifetime long enough for a print session (e.g. 1 h), refreshed as needed.

**Touch points to rework**
- Guest: `MagnetReview` (upload), `MagnetGuestPage` / `PrintStatusModal` (own thumbnails).
- Station: `ProJobCard` thumbnails; `magnetPrint` (composite / raw load for print and crop, cross-origin canvas: verify CORS on signed URLs); `CropEditor`.
- Admin: `MagnetEventDashboard` photo grid.
- `api/resize-photo.ts`: it writes `file_urls` with `getPublicUrl`; it must store paths instead.
- Stage 1 migration rules that assume public URLs: `photos_insert_url_guard`, `is_event_storage_url`, and the `raw_photo_url` check in `print_jobs_insert_guest`. They must validate paths instead.
- Existing rows: a data migration from URL to path, plus copying or moving objects if the bucket changes.

**Order:** close the Storage list endpoint first (small, Stage 1 follow-up). Then this rebuild, together with the Share deletions (§2–3), so the bucket split happens once.

## 4. Decisions (answered 2026-11-04)

- **D1 Share data → (c) back up, then delete.** Live on 2026-11-04: 20 share events (18 created by the two admins, 2 by one other user), 83 photos, none uploaded in the last 60 days. Back up rows + photos and hand the backup to the owner. Send the other user's 2 events to them first if they turn out to be real. Then run 2b.
- **D2 Landing copy:** Claude drafts new Hebrew Magnet copy; the owner approves before it ships.
- **D3 Phase 1 scope:** the dead code and unused npm packages go in the same round, as separate commits.
- **D4 Phase 2a:** write it now, independently of D1.

### Original questions

1. **Existing Share events and photos:** (a) hard stop, where `/event/:code` for share events shows "האלבום אינו פעיל עוד"; (b) a read-only grace period so hosts can download a ZIP until a date; (c) export, then delete the rows and storage objects. This decides when 2b can run.
2. **Landing copy:** do I draft new Hebrew Magnet copy for Home, or do you supply it?
3. **Scope of Phase 1:** include the optional dead-code commit, or keep it separate?
4. **Phase 2a** can ship independently of the Share-data decision. Write it now?
