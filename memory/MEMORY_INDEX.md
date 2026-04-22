# Memory System Index

Last consolidation: **2026-04-21T21:00Z** (automated — 15 commits: PNG Frames Pipeline shipped, admin auth race fixed, 79 polaroid PNG frames added, admin panels brand-aligned, sticker packs gain `emoji` type)

This directory holds structured memory for the Memoria project across sessions.

## Files

- **recent-memory.md** — Rolling 48-hour context (last session's decisions, active tasks, design choices)
- **long-term-memory.md** — Distilled facts, patterns, rules, brand language, tech stack constraints
- **project-memory.md** — Active initiative state, deliverables, testing checklist, known issues

## Critical Facts (at-a-glance)

- **HEAD:** `276562a` (2026-04-21 16:04 +0300) — Fix PNG frames pipeline + admin auth race condition (closes `upgradeALL_12` series).
- **PNG FRAMES PIPELINE SHIPPED (2026-04-21, `d0db4cc`):** Parallel to procedural `drawFrame()`. New primitives: `compositePngFrame.js`, `detectHoleBbox.js` (alpha-channel cutout detection), `FramePngPreview.jsx`, `FrameUploadDialog.jsx`. Hardening rules (crossOrigin only for Supabase URLs; delete failed-image promises from cache on reject; cap canvas to 600×900 in preview; CORS on `/FRAMES/`) documented in long-term-memory §PNG Frame Overlay Pipeline.
- **ADMIN AUTH RACE FIXED (2026-04-21, `276562a`):** `profileReady` state in AuthContext gates role-enrichment completion. `RequireAdmin` now requires both `!isLoadingAuth && profileReady`. 6s enrichment timeout + 10s whole-auth safety timer. See long-term-memory §Admin Auth Race Pattern.
- **FRAME LIBRARY EXPANDED (2026-04-21):** 7 AI-designed SVG seeds + 8 Figma transparent PNGs + 71 Canva polaroids = 86 frames. Placeholder SVG seeds purged. Sources: `06c353e`, `f7def4d`, `4e73962`, `c1df70f`.
- **STICKER PACKS `emoji` TYPE PROMOTED (2026-04-21, `5d13611`):** First-class alongside `svg`/`script-text`/`retro-text`/`editorial-text`. Wedding pack 15 → 35+ stickers. Hebrew content: `מזל טוב`, `בר מצווה`.
- **ADMIN PANELS BRAND-ALIGNED (2026-04-21, `0f094a8`):** AdminEventsList + LeadsPanel hardcoded `rgba(...)` → `bg-card` / `border-border` / `text-muted-foreground`. Editorial headings now `font-playfair`. New banned pattern enforced on admin side.
- **LAYOUT.JSX DELETED (2026-04-20, `4933138`):** `.luxury-button` and `.premium-submit-button` retired. Use `<Button>` from `@/components/ui/button`. Grep for stale refs.
- **SHARED STATE COMPONENTS (2026-04-20):** `src/components/ui/LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx` are canonical. Never hand-roll a spinner or error block in a page.
- **TAILWIND.CONFIG.JS (2026-04-20):** Canonical source for custom animations (`animate-paper-fly`), extended colors, `shadow-indigo-soft`.
- **MAGNETCAMERA HARDENED (2026-04-20, `c0d6cfd`):** Cancellation token, centralized setTimeout tracking, in-app UA fallback, video-ready guard, GPU-first vintage filter, Hebrew aria-labels, retry button, escape-to-close, haptic on quota-exhaust. See long-term-memory §MagnetCamera Hardening Patterns.
- **ARIA CONVENTIONS (2026-04-20):** Tab semantics, Hebrew aria-labels, focus-visible rings, `role="alert"`, `aria-pressed` on toggles, modal surfaces `role="dialog" aria-modal="true"`. See long-term-memory §Accessibility Conventions.
- **BRAND LOCKED (2026-04-17, refined 2026-04-19, softened 2026-04-20):** POV.camera cool-dark. Background `#1e1e1e`, primary `#7c86e1`, text `#fcfcfe`. Playfair Display + Heebo + Montserrat editorial labels.
- **VIOLET SUB-BRAND SCOPE:** Admin back-office + in-event operational surfaces only. Consumer intake = indigo/primary. MagnetGuestPage header premium badge removed `96dbbbe` — full re-audit pending.
- **SEGMENTED-CONTROL PATTERN (2026-04-19):** Parent `rounded-2xl bg-secondary border border-border` + transparent children marked by `border-primary shadow-indigo-soft`.
- **STICKER SYSTEM V2 (2026-04-17 PM):** Y2K / Pinterest aesthetic. 5 types in `stickerPacks.js`. 24 SVG stickers with white die-cut stroke in `svgStickers.js`. Emoji now 1st-class (2026-04-21).
- **MAGNETREVIEW PREVIEW COMPOSITE (2026-04-18):** Review screen bakes photo + frame + label to `previewUrl` data URL. `photoFrac` constrains sticker drag zone. **Rule:** at submit, `drawSticker(ctx, s, photoW, photoH, ...)` — NEVER `canvas.height`.
- **SHADOW UTILITY:** `shadow-indigo-soft` = `0 4px 20px -4px rgba(124,134,225,0.25)`.
- **OPEN TECH DEBT (HIGH):** `onAuthStateChange` deadlock audit (NEW — auth context just touched, perfect window), `linked_event_id` migration, RLS DELETE audit. (MEDIUM): `min-h-screen` → `min-h-dvh` bulk replace (iOS address-bar fix), duplicate `compressImage` in MagnetLead, canvas fonts not gated on `document.fonts.ready`, `events.cover_image` not displayed on guest landing, MagnetGuestPage violet re-audit. See project-memory.md.
