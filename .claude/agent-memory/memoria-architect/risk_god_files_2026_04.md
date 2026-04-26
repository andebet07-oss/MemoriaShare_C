---
name: God files inventory 2026-04-22
description: Files exceeding the 200-line CLAUDE.md hard limit, ranked by size and blast radius
type: project
---

CLAUDE.md sets a 200-line hard limit per component. All of these are over. Ranked by blast radius (how many other modules break if the file breaks):

**Why:** When a file is both large and widely imported, any edit is high-risk; surface these up-front so executors read-before-write them.

**How to apply:** Any task touching these files should be treated as "danger zone" — read the full file first, don't edit blindly, prefer extracting sub-components over adding to them.

## Tier 1 — system-critical (read full file before editing)
- `src/components/memoriaService.jsx` (600 lines) — ALL DB CRUD. Break this, break the entire app.
- `src/hooks/useEventGallery.js` (741 lines) — the gallery state machine. Owns quota, upload batching, realtime, compression, watermark, sharing, deletion flows. Core to Share product.
- `src/lib/AuthContext.jsx` (202 lines) — single source of session state.

## Tier 2 — large page components (refactor candidates)
- `src/pages/Dashboard.jsx` (753) — Share host management. Mixes: event settings, share/print, guest book moderation, export-to-zip, photo moderation, delete requests.
- `src/pages/CreateMagnetEvent.jsx` (741) — Admin Magnet event wizard with frame preview, overlay upload, polaroid preview.
- `src/pages/MagnetLead.jsx` (615) — Lead wizard with phone mockup preview.
- `src/pages/CreateEvent.jsx` (555) — Share event wizard with phone mockup preview.
- `src/pages/EventGallery.jsx` (451) — wraps useEventGallery, owns guest-book modal, theme toggle.

## Tier 3 — heavy Magnet UI (single-product blast radius)
- `src/components/magnet/MagnetReview.jsx` (439) — canvas compositor, sticker engine, submit pipeline.
- `src/components/magnet/MagnetCamera.jsx` (365) — full-screen WebRTC camera with in-app-browser fallback.

Wizard pages (CreateEvent, MagnetLead, CreateMagnetEvent) all contain an inline `PhoneMockup` sub-component plus `compressImage` helper — candidate to extract to `src/components/shared/`.
