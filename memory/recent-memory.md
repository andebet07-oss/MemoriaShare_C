---
type: recent-memory
updated: 2026-04-16T20:00Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

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
- `linked_event_id` migration + bundle toggle (Stage 1 incomplete — HIGH priority)
- `public/icons/*.webp` — 4 unused files (safe to delete)
- Search/filter on `AdminEventsList`
- Magnet card metadata: guest count, quota, prints
- QR preview on `MagnetEventDashboard` (use `qrcode.react` from EventSuccess)
