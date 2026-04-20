# Memory System Index

Last consolidation: **2026-04-20T21:00Z** (automated — `pov upgradeALL` series: Layout.jsx deletion, shared state components, MagnetCamera hardening, ARIA a11y pass)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **HEAD:** `dcb0646` (2026-04-20 20:47 +0300) — closes `upgradeALL` series (ALL1 `96dbbbe` → ALL5 `dcb0646`).
- **LAYOUT.JSX DELETED (2026-04-20):** `src/Layout.jsx` removed in `4933138`. `.luxury-button` and `.premium-submit-button` CSS classes retired. Use `<Button>` from `@/components/ui/button`. Grep for stale refs.
- **SHARED STATE COMPONENTS (2026-04-20):** `src/components/ui/LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx` are canonical. Never hand-roll a spinner or error block in a page — import these.
- **TAILWIND.CONFIG.JS (2026-04-20):** New at repo root (`4933138`). Canonical source for custom animations (`animate-paper-fly`, moved from inline `<style>` in MagnetReview), extended colors, `shadow-indigo-soft`.
- **MAGNETCAMERA HARDENED (2026-04-20, `c0d6cfd`):** Cancellation token (`startIdRef`), centralized `setTimeout` tracking (`timeoutsRef` + `later()`), in-app browser UA fallback (Instagram/FB/Line/Twitter), video-ready guard, GPU-first vintage filter with pixel fallback, `capturingRef` released in finally, front-flash at shutter, haptic on quota-exhaust, retry button, escape-to-close, full Hebrew aria-labels. Patterns documented in long-term-memory §MagnetCamera Hardening Patterns.
- **ARIA CONVENTIONS (2026-04-20):** Tab semantics (`role="tabpanel" aria-labelledby`), Hebrew aria-labels on icon buttons, `focus-visible:ring-2 focus-visible:ring-primary/40` everywhere, `role="alert"` on errors, `aria-pressed` on toggles, modal surfaces `role="dialog" aria-modal="true"`. See long-term-memory §Accessibility Conventions.
- **MAGNETEVENTDASHBOARD COVER UPLOAD (2026-04-20, `96dbbbe`):** Admin can now upload / replace event cover image directly from the dashboard (in addition to CreateMagnetEvent step 1). Still TODO: render `events.cover_image` on MagnetLead / MagnetGuestPage backgrounds.
- **BRAND LOCKED (2026-04-17, refined 2026-04-19, softened 2026-04-20):** POV.camera cool-dark aesthetic. Background `#1e1e1e` (cool-900), primary `#7c86e1` (indigo-500), text `#fcfcfe`. Typography: Playfair Display + Heebo + Montserrat editorial labels. See long-term-memory.md §Design Language.
- **VIOLET SUB-BRAND SCOPE:** Retained on admin back-office + in-event operational surfaces (AdminShell, AdminOverview, AdminEventsList, LeadsPanel, PrintStation, MagnetEventDashboard, MagnetCamera, MagnetReview). MagnetLead + CreateMagnetEvent = indigo/primary (verified `grep -c violet-` returns 0). MagnetGuestPage header premium badge removed `96dbbbe` — full re-audit pending.
- **HEBREW-FIRST COPY (2026-04-20):** HeroSection / FinalCTA / iPhone mockup captions migrated from English to Hebrew ("SHOTS" → "תמונות", "Begin" → "בואו נתחיל").
- **SEGMENTED-CONTROL PATTERN (2026-04-19):** For 2-col option grids, use parent `rounded-2xl bg-secondary border border-border` + transparent children marked by `border-primary shadow-indigo-soft`. See long-term-memory.md §Segmented-Control Pattern.
- **STICKER SYSTEM V2 (2026-04-17 PM):** Y2K / Pinterest aesthetic. 5 types (`svg`, `script-text`, `retro-text`, `handwritten-text`, `editorial-text`) in `stickerPacks.js`. 24 SVG stickers with white die-cut stroke in `svgStickers.js`.
- **MAGNETREVIEW PREVIEW COMPOSITE (2026-04-18):** Review screen bakes photo + frame artwork + label to a `previewUrl` data URL. `photoFrac = photoH / totalH` constrains sticker drag zone. **Rule:** at submit, `drawSticker(ctx, s, photoW, photoH, svgImg)` — NEVER `canvas.height`.
- **SHADOW UTILITY:** `shadow-indigo-soft` = `0 4px 20px -4px rgba(124,134,225,0.25)` (tailwind.config.js).
- **OPEN TECH DEBT:** `linked_event_id` migration (HIGH), RLS DELETE audit (HIGH), stale `.luxury-button` refs audit (NEW), duplicate `compressImage` in MagnetLead, canvas fonts not gated on `document.fonts.ready`, `events.cover_image` not yet displayed on guest landing, MagnetGuestPage violet re-audit pending. See project-memory.md.
