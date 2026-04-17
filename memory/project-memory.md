---
type: project-memory
updated: 2026-04-17T00:00Z
---

# Project Memory — Active State

## Build Status
- Branch: `main`
- Last build: ✅ EXIT 0 (2026-04-16 20:00)
- Deployed: https://memoriashare.com (Vercel auto-deploy on push)

## Brand Status (Locked 2026-04-17)
- POV.camera cool-dark / indigo aesthetic — canonical across MemoriaShare shell
- Background `#1e1e1e` (cool-900), primary `#7c86e1` (indigo-500), text `#fcfcfe`
- Violet `#7c3aed` preserved as MemoriaMagnet sub-brand accent
- Full brand spec: see `memory/long-term-memory.md` §Design Language
- 4 pages explicitly aligned per user request: CreateEvent, CreateMagnetEvent, MyEvents (/host), AdminShell+AdminOverview

---

## Active Plan
Plan file: `~/.claude/plans/wobbly-wobbling-crab.md`
(Architectural refactor: routing, separation, super-admin command center)

| Stage | Status | Notes |
|-------|--------|-------|
| Stage 1 — Foundation | ⚠️ Partial | `useIsAdmin`, `RequireAdmin`, redirects done. `linked_event_id` migration **NOT done** |
| Stage 2 — Admin shell | ✅ Complete | AdminShell, AdminOverview, AdminEventsList, MagnetEventDashboard |
| Stage 3 — Migration | ✅ Complete | Internal navigate() targets updated, MyEvents scoped to share-only |
| Stage 4 — Cleanup | ⏳ Not started | pages.config.js, legacy route cleanup |

---

## Known Issues / Tech Debt

| Issue | Priority | Action |
|-------|----------|--------|
| `linked_event_id` migration missing | **HIGH** | Add to `CLEAN_RESET_SCHEMA.sql`; add bundle toggle on `MagnetEventDashboard` (verified still absent 2026-04-16T22:00Z) |
| `public/icons/kpi-*.webp` unreferenced | Low | Delete 4 files — AdminOverview now uses Lucide (per evening session) |
| No search/filter on AdminEventsList | Medium | Add search input, filter by type/date |
| Magnet card metadata missing | Medium | Add guest count, quota used, print count to cards |
| QR preview missing on MagnetEventDashboard | Low | Reuse `qrcode.react` from EventSuccess |
| `pages.config.js` vestigial | Low | Delete or strip to Layout export only |
| `/Event` + `/EventGallery` inconsistent | Low | Redirect to `/event/:code` pattern |
| Per-event frame pack override | Medium | Expose frame-pack selector in `CreateMagnetEvent` admin form |

---

## Recent File Changes

| File | Date | Summary |
|------|------|---------|
| `src/pages/Home.jsx` + `HeroSection.jsx` + `Features.jsx` + `HowItWorks.jsx` | 2026-04-17 | POV brand: `.dark` wrapper, contrast fix, indigo palette |
| `src/pages/CreateEvent.jsx` | 2026-04-17 | POV brand: `.dark` + cool-dark gradient + Playfair wizard headers |
| `src/pages/MyEvents.jsx` | 2026-04-17 | POV brand: semantic tokens throughout, editorial `01 · ניהול` label, Playfair card titles, dialog restyled |
| `src/pages/CreateMagnetEvent.jsx` | 2026-04-17 | POV shell + violet sub-brand preserved; 4 editorial step labels; Playfair titles |
| `src/components/admin/AdminShell.jsx` | 2026-04-17 | POV brand: `.dark` wrap, border-border, violet sub-brand retained for admin |
| `src/components/admin/AdminOverview.jsx` | 2026-04-17 | POV brand: semantic tokens, Playfair numerals, editorial section label, STATUS_COLORS updated |
| `src/Layout.jsx` | 2026-04-17 | `.luxury-button` + `.premium-submit-button` cool-neutral rewrite with indigo-tinted shadows |
| `src/components/dashboard/cards/CardElegant.jsx` | 2026-04-17 | "Gold" → "Indigo" rename, hex swaps to POV palette |
| `src/components/magnet/framePacks.js` | 2026-04-17 | UI chrome gold→indigo; frame artwork metallic tones retained |
| `src/components/dashboard/PrintableShareCards.jsx` | 2026-04-17 | `קשת זהב` → `קשת אינדיגו` |
| `src/components/admin/LeadsPanel.jsx` | 2026-04-17 | Contacted status amber → violet `#a78bfa` |
| `memory/*.md` + `CLAUDE.md` | 2026-04-17 | Canonicalized POV brand across memory + project docs |
| `src/components/admin/AdminShell.jsx` | 2026-04-16 | Text-only tabs, removed icon imports + useNavigate |
| `src/components/admin/AdminOverview.jsx` | 2026-04-16 | Lucide icon containers, staleTime 30s, error states, Hash icon |
| `src/components/admin/AdminEventsList.jsx` | 2026-04-16 | Error state added |
| `src/components/magnet/stickerPacks.js` | 2026-04-16 | New badge/stamp types, redesigned content for all 4 packs |
| `src/components/magnet/MagnetReview.jsx` | 2026-04-16 | drawSticker extended for badge/stamp, ctx.save/restore added |
| `src/pages/MagnetEventDashboard.jsx` | 2026-04-16 | event_type guard → Navigate |
| `src/pages/Dashboard.jsx` | 2026-04-16 | Admin inspection banner |
| `src/components/home/Header.jsx` | 2026-04-16 | Dead import removed |
| `memory/*.md` | 2026-04-16 | Memory system updated |
| `src/components/magnet/framePacks.js` | 2026-04-16 | NEW — canvas frame system v2 (6 packs, LABEL_H_RATIO=0.225) |
| `src/components/magnet/FramePicker.jsx` | 2026-04-16 | NEW — RTL horizontal scroll strip for frame selection |
| `public/FRAMES/*.jpeg` | 2026-04-15 | 8 reference magnet prints for frame design |
| `cowork context/*` | 2026-04-15 | Shared design-system SKILL + project-context docs |

---

## URL Map (Current)

```
Public:
  /                              → Home
  /magnet/lead                   → MagnetLead wizard

Guest (anonymous):
  /event/:code                   → Event (share entry)
  /event/:code/gallery           → EventGallery
  /magnet/:code                  → MagnetGuestPage

Host (authenticated):
  /host                          → MyEvents (share events only)
  /host/events/create            → CreateEvent
  /host/events/:id               → Dashboard

Admin (role === 'admin'):
  /admin                         → AdminShell + AdminOverview
  /admin/events/share            → AdminEventsList type=share
  /admin/events/magnet           → AdminEventsList type=magnet
  /admin/events/magnet/create    → CreateMagnetEvent
  /admin/events/magnet/:id       → MagnetEventDashboard
  /admin/events/magnet/:id/print → PrintStation
  /admin/leads                   → LeadsPanel
  /admin/users                   → AdminUsers

Legacy redirects (keep until next release):
  /AdminDashboard  → /admin
  /CreateMagnetEvent → /admin/events/magnet/create
  /MyEvents        → /host
  /PrintStation/:id → /admin/events/magnet/:id/print
```

---

## Environment
- `VITE_SITE_URL` — must be set in Vercel dashboard (controls QR + share link base URLs)
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — in `.env.local` (never commit)
- Supabase project ref: `esjprtvfijyjjxpufjho`

---

## Memory & Research Infrastructure (Activated 2026-04-16)

### Memory System
- 3-layer memory: recent (48hr), long-term (rules/patterns), project (active state)
- `memory/recent-memory.md` — loaded at session start
- `memory/long-term-memory.md` — rules, patterns, gotchas, design language
- `memory/project-memory.md` — this file (active tasks, known issues, file changes)
- **Automated consolidation:** nightly at 10 PM (`consolidate-memoria-memory` task)

### Research Scout
- **Purpose:** Hunt for new information that challenges/updates documented knowledge
- **Scope:** React 18, Tailwind, Supabase, Canvas, WebRTC
- **Nightly hunt:** 10:03 PM daily (all 5 domains in one run)
- **Weekly review:** Sunday 6:03 AM (promote findings, clear staging)
- **Findings storage:** `memory/long-term-memory.md` → `new_learnings` section
- **Skill location:** `skills/research-scout/`
- **Status:** 🟢 Active (first hunt: 2026-04-16 10:03 PM)
