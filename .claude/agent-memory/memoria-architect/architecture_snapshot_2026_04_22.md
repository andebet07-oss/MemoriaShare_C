---
name: Architecture snapshot 2026-04-22
description: Domain map, routing, god files, and cross-product boundary audit captured 2026-04-22 at main @ 9306eee
type: project
---

Snapshot captured 2026-04-22 on branch `main` at commit 9306eee ("update: pov upgradeALL_14"). May drift — re-verify before acting.

**Why:** Provides a fast baseline for future architectural analyses; re-reading all 80+ source files each session is wasteful.

**How to apply:** Use as a map. Before recommending a file change, re-read that specific file — the snapshot is for orientation, not authority.

## Domain file ownership
- Auth & Session: `src/lib/AuthContext.jsx`, `src/lib/supabase.js` (SINGLE client instance — do not duplicate)
- Service layer: `src/components/memoriaService.jsx` — the ONE place DB CRUD lives. Sub-namespaces: auth, events, photos, leads, printJobs, storage, frameMeta
- Gallery domain: `src/hooks/useEventGallery.js` (741 lines — the gallery state machine), `src/components/gallery/*` (UploadManager, PhotoGrid, PhotoCard, PhotoViewer, GalleryHeader), `src/pages/EventGallery.jsx`
- Share product: `src/pages/{Home, CreateEvent, EventGallery, Dashboard, MyEvents, Event, EventSuccess}.jsx`
- Magnet product: `src/pages/{MagnetLead, MagnetGuestPage, PrintStation, CreateMagnetEvent, MagnetEventDashboard}.jsx`, `src/components/magnet/*`
- Admin: `src/pages/AdminDashboard.jsx` → `AdminShell.jsx` (tabbed Outlet), nested routes into `src/components/admin/*`, `src/pages/admin/*`, gated by `RequireAdmin.jsx`
- Frames (Magnet sub-system): `src/lib/frames{Meta,Rubric,Renderer,Utils}.js`, `src/lib/compositePngFrame.js`, `src/lib/detectHoleBbox.js`, `src/components/admin/frames/*`, `src/components/magnet/framePacks.js`
- Realtime: 4 channels total — `useEventGallery.js` (`photos-realtime-*`), `useRealtimeNotifications.js` (`photos-notifications-*`), `MagnetGuestPage.jsx` (`guest-prints-*`), `PrintQueue.jsx` (`print-jobs-*`)
- Pure functions (no Supabase I/O side-effects inside the hot path): `src/functions/checkGuestQuota.js` (fully pure), `getMyPhotos`, `requestPhotoDeletion`, `resolvePhotoDeletion`
- Infrastructure: `src/main.jsx`, `src/App.jsx`, `src/lib/{sentry, logger, query-client, NavigationTracker, PageNotFound}`, `src/components/GlobalErrorBoundary.jsx`

## Product isolation
`event_type IN ('share','magnet')` is the discriminator (DB check constraint, line 73-74 of CLEAN_RESET_SCHEMA). `PrintStation.jsx` enforces this at route level (SEC-03 guard). `MagnetEventDashboard` uses `react-query`; legacy share pages use ad-hoc useState + useEffect fetches. Violet (`#7c3aed`) is Magnet accent; Indigo (`#7c86e1`) is Share accent.

## Routing summary (App.jsx)
- `/` → Home (marketing)
- `/event/:code`, `/event/:code/gallery` → Guest Share flow (GuestLayout)
- `/magnet/lead`, `/magnet/:code` → Guest Magnet flow (GuestLayout)
- `/host`, `/host/events/create`, `/host/events/:id`, `/host/events/:id/success` → Authenticated host
- `/admin/*` → Tabbed AdminShell (RequireAdmin guard; overview, events/share, events/magnet, events/magnet/create, events/magnet/:id, frames, frames/moderation, leads, users)
- `/admin/events/magnet/:eventId/print` → PrintStation (full-screen, no shell)
- Legacy aliases: `/AdminDashboard`, `/MyEvents`, `/CreateEvent`, etc. all redirect

## File sizes at snapshot (top 6)
- `src/pages/Dashboard.jsx` — 753
- `src/pages/CreateMagnetEvent.jsx` — 741
- `src/hooks/useEventGallery.js` — 741
- `src/pages/MagnetLead.jsx` — 615
- `src/components/memoriaService.jsx` — 600
- `src/pages/CreateEvent.jsx` — 555
