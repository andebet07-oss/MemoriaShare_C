---
type: recent-memory
updated: 2026-04-17T00:00Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

## Session 2026-04-17 — POV Brand Pivot LOCKED IN (Canonical)

### Decision
Efi explicitly locked the POV.camera cool-dark / indigo brand as the canonical MemoriaShare palette. The prior violet-heavy brand is retired from the platform shell (violet remains only as MemoriaMagnet sub-brand accent). This was after seeing the refactored home + pages, then directing: *"העיצוב שהטמענו הוא העיצוב שהחלטתי שיהיה בפרוייקט מבחינת הצבעים. זה הקו שאנחנו הולכים איתו."*

### Brand (canonical)
- Background: `#1e1e1e` (cool-900) + gradient to cool-950
- Primary accent: `#7c86e1` (indigo-500)
- Text: `#fcfcfe` (cool-50)
- Muted: `#b4b4b4`
- Display serif: Playfair Display
- Body: Heebo (Hebrew)
- Micro-labels: Montserrat `tracking-[0.3em] uppercase text-[10px]`
- Sub-brand: Violet `#7c3aed` — MemoriaMagnet UI only

### Pages Aligned (Sessions 2 + 3)
- `src/pages/Home.jsx` + `HeroSection.jsx` + `Features.jsx` + `HowItWorks.jsx` — added `.dark`, fixed contrast bug, indigo label scheme
- `src/pages/CreateEvent.jsx` — wizard root: `.dark` + cool-dark gradient; radial glow `rgba(124,134,225,0.06)`; step headers → Playfair
- `src/pages/MyEvents.jsx` (/host) — full refactor: editorial label `01 · ניהול`, Playfair 3xl-4xl, semantic tokens throughout (no more hardcoded `bg-[#0a0a0a]` etc.), dialog → `bg-cool-950/95`
- `src/pages/CreateMagnetEvent.jsx` — admin wizard: all 4 steps get editorial labels (`01 · שם`, `02 · תאריך`, `03 · מכסה`, `04 · מסגרת`); shell cool-dark + violet sub-brand accent preserved
- `src/components/admin/AdminShell.jsx` — `.dark` wrap, `border-border`, text-muted-foreground, violet-500 active tab underline
- `src/components/admin/AdminOverview.jsx` — KPI cards semantic tokens, Playfair numerals, editorial section label `01 · סקירה`, STATUS_COLORS updated
- `src/Layout.jsx` — `.luxury-button` + `.premium-submit-button` CSS rewritten: cool-neutral (`#fcfcfe → #e8e8ec`) with indigo shadows `rgba(124,134,225,0.18-0.28)`
- `src/components/dashboard/cards/CardElegant.jsx` — "gold" → "indigo/accent" rename, hex swaps
- `src/components/magnet/framePacks.js` — "gold" references in UI chrome swapped to "indigo" (frame artwork may retain metallic tones)
- `src/components/dashboard/PrintableShareCards.jsx` — Hebrew label `קשת זהב` → `קשת אינדיגו`
- `src/components/admin/LeadsPanel.jsx` — contacted status amber → violet `#a78bfa`

### Root Cause Fix
Silvery home-page bug root-caused: no `.dark` ancestor existed in the app, so semantic tokens (`bg-background`, `text-foreground`, `border-border`) resolved to light palette values. Gradient `from-background via-cool-900 to-background` rendered as `#fafafa → #1e1e1e → #fafafa`. Fix: add `dark` class to every page root that expects dark appearance; use explicit cool-tone gradient (`from-cool-950 via-cool-900 to-cool-950`), not semantic `background` alias.

### Out of Scope (pending if requested)
- `src/pages/Dashboard.jsx` (host event dashboard) — still has `bg-[#1a1a1a]` hexes
- `src/pages/MagnetLead.jsx` — guest lead wizard, ~14 hardcoded hexes
- `src/pages/PrintStation.jsx` — operator print queue, 6 hardcoded hexes

---

## Session 2026-04-15 → 2026-04-16 (Late Night) — Magnet Frame System V1–V4

### New Files
- `src/components/magnet/framePacks.js` (1135 lines) — canvas frame system v2
- `src/components/magnet/FramePicker.jsx` (125 lines) — horizontal RTL scroll strip
- `public/FRAMES/*.jpeg` — 8 reference magnet prints (WhatsApp-sourced)
- `cowork context/` — shared design system SKILL + project context docs

### Architecture (`framePacks.js`)
- **Label-below-photo** design: label strip BELOW photo is the design surface; photo stays clean (at most subtle vignette/hairline)
- `LABEL_H_RATIO = 0.225` — label = 22.5% of canvas width
- Signature: `drawFrame(ctx, w, totalH, photoH, event)` where `event = { name, date }`
- 6 packs: `wedding`, `bar_mitzvah`, `brit`, `birthday`, `corporate`, `general` (expanded from 4)
- `getFramePack(eventName)` — Hebrew/English keyword router (חתונה → wedding, ברית → brit, etc.)
- `ALL_FRAMES` flat export for admin picker

### FramePicker UI
- Thumbnails 52×68px, `rounded-[4px]`, RTL horizontal scroll
- Selected state: gold border `rgba(201,169,110,0.9)` + gold glow
- Label "מסגרת" in Montserrat uppercase, gold 60% opacity
- Integrated into `MagnetReview.jsx` — sits above main action buttons

### Integration into MagnetReview
- Imports `{ getFramePack, ALL_FRAMES, LABEL_H_RATIO }`
- Default frame: first in auto-selected pack
- Canvas sized: `photoH + (w * LABEL_H_RATIO)` for label zone
- Frame ID persisted per review session

---

## Session 2026-04-16 (Evening) — UI Polish & Stickers

### Admin Panel Redesign
- Ran `/design-shotgun` skill → 3 variants generated ("Memoria Command" direction)
- **Chosen: Variant A — Underline Tabs (Classic)**
- `AdminShell.jsx`: tabs now text-only (no Lucide icons); removed `useNavigate`, icon imports

### 3D Icons Attempt & Revert
- Explored 3dicons.co library (CC0, Figma: `XCNRTPxTniTCS2dATAbUVl`)
- Downloaded 4 WebP files to `public/icons/` (camera, star, chat, calendar)
- **Reverted**: CDN serves WebP with solid white background — looks terrible on dark UI
- No transparent PNG variant exists (400 on `.png` path)
- **Final**: Lucide icons in 32px `rounded-xl` containers with per-color translucent bg
- `public/icons/*.webp` are unused — safe to delete

### Sticker System Overhaul
- Added 2 new sticker types across `stickerPacks.js` + `MagnetReview.jsx`:
  - `badge` — pill shape, `dark=false` → `#caff4a` bg / `#111` text; `dark=true` → `#111` bg / `#fff` text
  - `stamp` — white bg + `#111` border, uppercase (physical label aesthetic)
- Rewrote all 4 packs: wedding / bar_mitzvah / birthday / general
- Content style: "LEGEND", "ICONIC", "MAIN CHARACTER", "JUST MARRIED ✨"
- Canvas `drawSticker`: `ctx.roundRect` for badges, `fillRect+strokeRect` for stamps
- Added `ctx.save()/restore()` around each draw call

### Code Review Fixes Applied (from plan `wobbly-wobbling-crab.md`)
- `MagnetEventDashboard.jsx`: `event_type !== 'magnet'` guard → `<Navigate replace />`
- `Dashboard.jsx`: Admin inspection banner (violet) when admin views another host's event
- `AdminOverview.jsx`: Hash icon for KPI 4, `staleTime: 30_000`, error states
- `AdminEventsList.jsx`: error state added
- `Header.jsx`: dead `Users` import removed

### MCP Fixes
- `.mcp.json` puppeteer: added `cmd /c` wrapper (Windows npx requirement)
- `~/.claude.json` browser: same fix

---

## Session 2026-04-16 (Morning) — Architecture Refactor Complete

### Routing Refactor (Stages 1–3 Complete)
- `App.jsx`: single routing source, `/admin/*` namespace
- `RequireAdmin.jsx` + `useIsAdmin.js`: centralized role gating
- `AdminShell.jsx`: tabbed shell with `<Outlet />`
- `AdminOverview.jsx`: KPI grid, leads by status, recent events feed
- `AdminEventsList.jsx`: reusable list for share + magnet
- `MagnetEventDashboard.jsx`: single magnet event management page
- Old URLs redirect: `/AdminDashboard` → `/admin`, `/MyEvents` → `/host`, etc.

### Stage 4 (Pending)
- `pages.config.js` not yet deprecated
- Legacy routes (`/Event`, `/EventGallery`) still direct renders, not redirects

---

## What's Pending (carry forward)
- `linked_event_id` migration + bundle toggle (Stage 1 incomplete — HIGH priority) — **still missing from `CLEAN_RESET_SCHEMA.sql`** as of 2026-04-16T22:00Z
- `public/icons/kpi-*.webp` — 4 files unreferenced in src (AdminOverview uses Lucide icons instead); safe to delete
- Search/filter on `AdminEventsList`
- Magnet card metadata: guest count, quota, prints
- QR preview on `MagnetEventDashboard` (use `qrcode.react` from EventSuccess)
- Frame picker: add per-event frame override (admin chooses pack on `CreateMagnetEvent`)
