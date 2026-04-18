# Memory System Index

Last consolidation: **2026-04-17T13:30Z** (automated — MagnetLead cover edit + Sticker System v2)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **BRAND LOCKED (2026-04-17):** POV.camera cool-dark aesthetic. Background `#1e1e1e` (cool-900), primary accent `#7c86e1` (indigo-500), text `#fcfcfe`. Typography: Playfair Display serif headers + Heebo Hebrew body + Montserrat editorial labels. See long-term-memory.md §Design Language.
- **Sub-brand:** Violet `#7c3aed` reserved for MemoriaMagnet admin/print UI only (AdminShell, CreateMagnetEvent, MagnetEventDashboard, PrintStation, MagnetReview).
- **STICKER SYSTEM V2 (2026-04-17 PM):** Y2K / Pinterest aesthetic. 5 types (`svg`, `script-text`, `retro-text`, `handwritten-text`, `editorial-text`) in `stickerPacks.js`. 24 SVG stickers with white die-cut stroke in `svgStickers.js`. Canvas renderer in `MagnetReview.jsx drawSticker()` uses a base64 SVG→Image cache. Legacy `badge/stamp/emoji/text` types retained only for back-compat.
- **FramePicker.jsx DELETED (2026-04-17 PM):** Frame selection chrome is now inlined in `CreateMagnetEvent.jsx` as `FrameThumbnail`. `THUMB_W=108px`. New frames carry `isNew: true` for the "חדש" badge.
- **OPEN TECH DEBT:** `linked_event_id` migration (HIGH), duplicate `compressImage` in MagnetLead, canvas fonts not gated on `document.fonts.ready`, post-v2 build unverified. See project-memory.md.