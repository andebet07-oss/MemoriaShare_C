# Memory System Index

Last consolidation: **2026-04-19T22:00Z** (automated — Magnet sub-brand narrowing: CreateMagnetEvent + MagnetLead fully de-violet-ed)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **BRAND LOCKED (2026-04-17, refined 2026-04-19):** POV.camera cool-dark aesthetic. Background `#1e1e1e` (cool-900), primary accent `#7c86e1` (indigo-500), text `#fcfcfe`. Typography: Playfair Display serif headers + Heebo Hebrew body + Montserrat editorial labels. See long-term-memory.md §Design Language.
- **VIOLET SUB-BRAND NARROWED (2026-04-19):** Violet `#7c3aed` now reserved for admin back-office + in-event operational surfaces only (AdminShell, AdminOverview, AdminEventsList, LeadsPanel, PrintStation, MagnetEventDashboard, MagnetCamera, MagnetGuestPage, MagnetReview). Consumer-facing Magnet intake (MagnetLead, CreateMagnetEvent) uses indigo/primary — `grep -c violet-` returns 0 for both files. Rationale: violet = "operator/print service" context; consumer intake should feel continuous with Share brand.
- **SEGMENTED-CONTROL PATTERN (2026-04-19):** For 2-col option grids, use parent `rounded-2xl bg-secondary border border-border` + transparent children marked by `border-primary shadow-indigo-soft`. See long-term-memory.md §Segmented-Control Pattern. First use: MagnetLead GUEST_OPTIONS.
- **STICKER SYSTEM V2 (2026-04-17 PM):** Y2K / Pinterest aesthetic. 5 types (`svg`, `script-text`, `retro-text`, `handwritten-text`, `editorial-text`) in `stickerPacks.js`. 24 SVG stickers with white die-cut stroke in `svgStickers.js`. Canvas renderer in `MagnetReview.jsx drawSticker()` uses a base64 SVG→Image cache.
- **MAGNETREVIEW PREVIEW COMPOSITE (2026-04-18):** Review screen bakes photo + frame artwork + label to a `previewUrl` data URL. `photoFrac = photoH / totalH` constrains sticker drag zone. **Rule:** at submit, `drawSticker(ctx, s, photoW, photoH, svgImg)` — NEVER `canvas.height` (shifts stickers onto label strip).
- **COVER IMAGE UPLOAD (2026-04-18):** `CreateMagnetEvent` step 1 accepts optional background photo; `memoriaService.storage.uploadCoverImage()` uploads to `covers/{eventId}/cover.{ext}` with `x-upsert: true`; URL persisted to `events.cover_image`. Still TODO: surface on guest landing page.
- **FramePicker.jsx DELETED (2026-04-17 PM):** Frame selection inlined in `CreateMagnetEvent.jsx` as `FrameThumbnail`. `THUMB_W=108px`. New frames carry `isNew: true` for "חדש" badge.
- **SHADOW UTILITY:** `shadow-indigo-soft` = `0 4px 20px -4px rgba(124,134,225,0.25)` (tailwind.config.js:128) — use in place of raw `shadow-[...violet...]` / `shadow-[...rgba(139,92,246...)...]`.
- **OPEN TECH DEBT:** `linked_event_id` migration (HIGH), duplicate `compressImage` in MagnetLead, canvas fonts not gated on `document.fonts.ready`, cover_image not yet displayed on guest landing. See project-memory.md.
