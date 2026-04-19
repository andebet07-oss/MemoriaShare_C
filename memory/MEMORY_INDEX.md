# Memory System Index

Last consolidation: **2026-04-18T13:00Z** (automated — MagnetReview preview composite + cover image upload)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **BRAND LOCKED (2026-04-17):** POV.camera cool-dark aesthetic. Background `#1e1e1e` (cool-900), primary accent `#7c86e1` (indigo-500), text `#fcfcfe`. Typography: Playfair Display serif headers + Heebo Hebrew body + Montserrat editorial labels. See long-term-memory.md §Design Language.
- **Sub-brand:** Violet `#7c3aed` reserved for MemoriaMagnet admin/print UI only (AdminShell, CreateMagnetEvent, MagnetEventDashboard, PrintStation, MagnetReview).
- **STICKER SYSTEM V2 (2026-04-17 PM):** Y2K / Pinterest aesthetic. 5 types (`svg`, `script-text`, `retro-text`, `handwritten-text`, `editorial-text`) in `stickerPacks.js`. 24 SVG stickers with white die-cut stroke in `svgStickers.js`. Canvas renderer in `MagnetReview.jsx drawSticker()` uses a base64 SVG→Image cache. Legacy `badge/stamp/emoji/text` types retained only for back-compat.
- **MAGNETREVIEW PREVIEW COMPOSITE (2026-04-18):** Review screen now bakes photo + frame artwork + label to a `previewUrl` data URL so users see the real magnet during sticker placement. `photoFrac = photoH / totalH` constrains the sticker drag zone to the photo area only. **Rule:** at submit, `drawSticker(ctx, s, photoW, photoH, svgImg)` — NEVER `canvas.height` (includes label strip → shifts stickers).
- **COVER IMAGE UPLOAD (2026-04-18):** `CreateMagnetEvent` step 1 accepts optional background photo; `memoriaService.storage.uploadCoverImage()` uploads to `covers/{eventId}/cover.{ext}` with `x-upsert: true`; URL persisted to `events.cover_image`. Next step: surface on guest landing page.
- **FramePicker.jsx DELETED (2026-04-17 PM):** Frame selection chrome is inlined in `CreateMagnetEvent.jsx` as `FrameThumbnail`. `THUMB_W=108px`. New frames carry `isNew: true` for the "חדש" badge.
- **OPEN TECH DEBT:** `linked_event_id` migration (HIGH), duplicate `compressImage` in MagnetLead, canvas fonts not gated on `document.fonts.ready`, cover_image not yet displayed on guest landing. See project-memory.md.
