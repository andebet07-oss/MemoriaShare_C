---
type: project-memory
updated: 2026-04-26T22:00Z
---

# Project Memory — Active State

## Build Status
- Branch: `main`
- Last commit: `9306eee` (2026-04-22 22:43 +0300) — `upgradeALL_14` (memory consolidation of afternoon 3 commits). Last functional code HEAD: `6643fd2` (2026-04-22 22:42) — UploadManager pending-panel brand redesign.
- **Quiet period 2026-04-23 → 2026-04-26 (4 days, 0 new commits).** No code, schema, or config changes since `9306eee`. Build state and tech-debt list below remain current; Vercel still serving `9306eee`.
- Today's highlight (2026-04-22 PM, 2 commits — NOT in `upgradeALL_14`): **Camera quota badge** rebuilt as frosted pill with number-first typography, amber warning at ≤3, red pill when exhausted; Lucide `Wand2` → `Film` for vintage filter toggle (`e5f31ec`). **UploadManager pending-photos panel** fully re-skinned to brand (indigo editorial header + 14px rounded thumbs + compact filter pills + indigo-gradient primary CTA, retired `bg-gray-*` outlier aesthetic) (`6643fd2`).
- Previous afternoon highlight (2026-04-22, 3 commits): **Routing refactor fallout fixed** — share events (`/event/:code`) now resolve correctly from `useParams()` instead of stale `window.location.search` reads (`9c0924e`); EventSuccess share URL no longer produces malformed `?&` concatenation. **PNG frame aspect** propagated from grid → detail panel so square PNGs render 1:1 (`4b38ddf`).
- Series highlight (2026-04-21, 15 commits): **PNG Frame Overlay Pipeline shipped** (compositePngFrame + detectHoleBbox + FramePngPreview + FrameUploadDialog), **admin auth race fixed** (profileReady gate in AuthContext), 79 real polaroid PNG frames added, CORS headers for `/FRAMES/`, admin panels brand-aligned.
- Series highlight (2026-04-20, 5 commits): Layout.jsx deleted → shared state components (LoadingState/ErrorState/EmptyState) → MagnetCamera hardened → MagnetEventDashboard cover upload UI → MagnetGuestPage violet badge retired → EventGallery ARIA tabs → Hebrew-first landing copy.
- Build: ✓ implicit green via Vercel auto-deploy on main push
- Deployed: https://memoriashare.com (Vercel auto-deploy on push)

## Brand Status (Locked 2026-04-17, refined 2026-04-19, softened 2026-04-20)
- POV.camera cool-dark / indigo aesthetic — canonical across MemoriaShare shell AND consumer-facing Magnet entry pages
- Background `#1e1e1e` (cool-900), primary `#7c86e1` (indigo-500), text `#fcfcfe`
- **Violet `#7c3aed` sub-brand NARROWED (2026-04-19) and further SOFTENED (2026-04-20):** retained on admin back-office + in-event operational surfaces (AdminShell, AdminOverview, AdminEventsList, LeadsPanel, PrintStation, MagnetEventDashboard, MagnetCamera, MagnetReview). Consumer intake pages MagnetLead + CreateMagnetEvent are indigo/primary (verified `grep -c violet-` returns 0). MagnetGuestPage header premium badge removed (`96dbbbe`) — full re-audit of remaining violet tokens in page pending.
- Full brand spec: see `memory/long-term-memory.md` §Design Language
- Shadow utility: `shadow-indigo-soft` = `0 4px 20px -4px rgba(124,134,225,0.25)` (tailwind.config.js)
- `tailwind.config.js` (added `4933138`) is now canonical source for custom animations/tokens; `animate-paper-fly` moved there from inline `<style>` in MagnetReview.

## Component Library Status (2026-04-20)
- `src/Layout.jsx` — **DELETED** (Luxury button CSS classes retired).
- `src/components/ui/Button.jsx` — canonical button; use via `import { Button } from '@/components/ui/button'`.
- `src/components/ui/LoadingState.jsx` — spinner; `fullScreen` prop. **Rule:** never hand-roll a spinner div in a page.
- `src/components/ui/ErrorState.jsx` — `AlertCircle` + Hebrew message + retry; `fullScreen` prop.
- `src/components/ui/EmptyState.jsx` — optional Icon + title + description + children slot.
- Migrated callers: `App.jsx`, `Dashboard.jsx`, `Event.jsx`, `EventGallery.jsx`, `MyEvents.jsx`.

---

## Active Plan
Plan file: `~/.claude/plans/wobbly-wobbling-crab.md`
(Architectural refactor: routing, separation, super-admin command center)

| Stage | Status | Notes |
|-------|--------|-------|
| Stage 1 — Foundation | ⚠️ Partial | `useIsAdmin`, `RequireAdmin`, redirects done. `linked_event_id` migration **NOT done** |
| Stage 2 — Admin shell | ✅ Complete | AdminShell, AdminOverview, AdminEventsList, MagnetEventDashboard |
| Stage 3 — Migration | ✅ Complete | Internal navigate() targets updated, MyEvents scoped to share-only. Legacy query-param routes (`/Event`, `/EventGallery`, `/MagnetLead`, `/Dashboard`) removed in `4933138`. |
| Stage 4 — Cleanup | ✅ Mostly complete | Layout.jsx deleted `4933138`; legacy route cleanup done same commit. `pages.config.js` still vestigial. |

---

## Known Issues / Tech Debt

| Issue | Priority | Action |
|-------|----------|--------|
| Dangling `window.location.search` reads elsewhere | **LOW — NEW 2026-04-22** | After the path-param refactor (`9c0924e` fixed Event, EventSuccess, useEventGallery), grep the codebase for any remaining `window.location.search` reads — likely candidates: legacy admin pages, MagnetLead query-string entry points. Migrate to `useParams()` / `useSearchParams()` with a string fallback. |
| `onAuthStateChange` deadlock audit | **HIGH — NEW 2026-04-21** | AuthContext was just touched (`276562a` profileReady fix). While fresh, verify the `supabase.auth.onAuthStateChange` callback either (a) is fully synchronous and only calls `setState`, or (b) wraps any post-event supabase-js work in `setTimeout(fn, 0)`. Awaiting supabase-js inside the callback deadlocks the WHOLE client silently. See long-term-memory §Common Pitfalls (2026-04-21 finding). |
| `linked_event_id` migration missing | **HIGH** | Add to `CLEAN_RESET_SCHEMA.sql`; add bundle toggle on `MagnetEventDashboard` (verified still absent 2026-04-20) |
| RLS delete silent-failure hardening | **HIGH** | Audit `CLEAN_RESET_SCHEMA.sql`: every table with a DELETE policy needs a matching SELECT/ALL policy. Add defensive `count > 0` check to `memoriaService.deletePhoto()` with Hebrew error `המחיקה נכשלה — אין לך הרשאה`. See long-term-memory §Common Pitfalls. |
| iOS Safari address-bar cuts off page CTAs (`vh` → `dvh`) | **MEDIUM — NEW 2026-04-21** | Bulk replace `min-h-screen` → `min-h-dvh` on page roots (MagnetLead, EventSuccess, MagnetGuestPage, Home, CreateEvent, Dashboard, EventGallery). Use `min-h-svh` for tightly-sized centered forms where growth would push content off-center. Tailwind v3.4.17 already ships the utilities — no config change. See long-term-memory §New Learnings 2026-04-21 finding. |
| Orphaned `.luxury-button` / `.premium-submit-button` class refs | **2026-04-20** | Layout.jsx deleted in `4933138` — grep the codebase for `luxury-button`, `premium-submit-button` and migrate any lingering usages to `<Button>` component from `@/components/ui/button`. |
| PNG frame pipeline `crossOrigin` gotcha | **2026-04-21** | `compositePngFrame.js` must apply `crossOrigin='anonymous'` ONLY to Supabase-hosted URLs — applying to same-origin SVGs breaks them. Baked in, but future PNG-adjacent code (e.g. sticker SVG batch loader) needs the same guard. |
| `vercel.json` CORS pattern generalization | **2026-04-21** | `/FRAMES/` CORS headers added in `d3398ab`. If new public-asset directories are added (e.g. `/STICKERS/`, `/OVERLAYS/`), replicate the header block. |
| Duplicate `compressImage` in MagnetLead | Medium | Replace inline `compressImage` in `src/pages/MagnetLead.jsx` with import from `@/functions/processImage` (MagnetReview already imports from there) |
| Canvas fonts may not be loaded at first draw | Medium | Gate first `MagnetReview` canvas draw on `document.fonts.ready` to avoid fallback-font flash for Great Vibes / Parisienne / Bebas Neue / Abril Fatface |
| `events.cover_image` not surfaced on guest landing | Medium | Admin can upload via CreateMagnetEvent step 1 AND via MagnetEventDashboard (new `96dbbbe`). Still need to render it on MagnetLead / MagnetGuestPage backgrounds. |
| MagnetGuestPage violet re-audit | Medium | Header premium badge removed `96dbbbe` — sweep the rest of the page for remaining violet tokens and decide: neutralize OR retain as "in-event operational" per new sub-brand scope. |
| `public/icons/kpi-*.webp` unreferenced | Low | Delete 4 files — AdminOverview now uses Lucide |
| No search/filter on AdminEventsList | Medium | Add search input, filter by type/date |
| Magnet card metadata missing | Medium | Add guest count, quota used, print count to cards |
| QR preview missing on MagnetEventDashboard | Low | Reuse `qrcode.react` from EventSuccess |
| `pages.config.js` vestigial | Low | Delete or strip to Layout export only |
| Per-event frame pack override | Medium | Expose frame-pack selector in `CreateMagnetEvent` admin form |
| MagnetReview preview caching | Low | `previewUrl` useEffect re-runs on every `event` prop shift — `useMemo` over `{ imageDataURL, overlay_frame_url }` would be cleaner |
| Canvas `willReadFrequently` audit | Medium | Audit any `canvas.getContext('2d')` call path feeding `getImageData`/`putImageData` (CameraCapture, MagnetReview compositor). Add `{ willReadFrequently: true }` on the FIRST `getContext` call. See long-term-memory §Common Pitfalls. |
| Sticker canvas perf — 3 compounding fixes | Medium | (1) `Math.floor()` on all `drawImage` coords in sticker renderer; (2) trim 9-font sticker set to minimum used by the 4 stock packs, lazy-load the rest; (3) cache `text-*` stickers as offscreen bitmaps keyed by `(text, type, size)`. See long-term-memory §Performance Patterns. |
| iOS Safari `NotAllowedError` Hebrew re-consent UI | Medium | CameraCapture error handler: detect `NotAllowedError` on iOS and show retry UI with Hebrew copy `Safari ביקש לאשר שוב גישה למצלמה — גע בסמל ההרשאות בשורת הכתובת`. Do NOT gate on `navigator.permissions.query()`. MagnetCamera already has retry button + in-app UA fallback (F03, F10 in `c0d6cfd`); replicate pattern for CameraCapture (Share). |
| iOS Safari 2nd getUserMedia mutes 1st track | **NEW 2026-04-20** | Before any camera-switch feature (front/back toggle, device picker), implement `streamRef.current?.getTracks().forEach(t => t.stop())` BEFORE re-calling `getUserMedia` with new constraints. See long-term-memory §New Learnings 2026-04-20 finding. |
| `getSupportedConstraints` guard for advanced camera controls | Low | Before rendering zoom/torch/focus controls, check BOTH `navigator.mediaDevices.getSupportedConstraints?.()` AND `videoTrack.getCapabilities?.()`. Only when building those controls — not urgent today. |
| Supabase signUp obfuscated-user detection | Medium | Audit `@/lib/AuthContext` host signup handler — check `data.session` AND `data.user.identities?.length > 0`, not just `data.user`. See long-term-memory §Common Pitfalls (2026-04-20 finding). |
| React 18 concurrent hooks — realtime + filter | Low | (1) Wrap Supabase realtime channel getter in a `useSyncExternalStore`-backed hook (tear-safe); (2) wrap host dashboard gallery filter input in `useDeferredValue`. Measure FPS on >300-photo events before/after. |
| Supabase private realtime channels (hardening) | Low | Evaluate moving per-event photo channels from public to private `realtime.channel()` with RLS on `realtime.messages`. Unlocked at v2.44.0; we're on v2.101.1. Not urgent — track as hardening follow-up. |
| Tailwind v4 migration (future) | Flagged | When scoped: (a) `scheme-dark` on body, (b) `@container` queries for EventCard/KPI tiles, (c) `user-valid:`/`user-invalid:` form variants (replace JS `touched` tracking on MagnetLead + CreateEvent), (d) `text-shadow-*` / `mask-*` opportunistic. Currently on v3.4.17 — no action. |

---

## Recent File Changes

| File | Date | Summary |
|------|------|---------|
| `src/components/gallery/UploadManager.jsx` | 2026-04-22 PM | **Brand re-skin** (`6643fd2`, +152/-51). Pending-photos panel: `rgba(255,255,255,0.02)` panel + `blur(12px)` backdrop; editorial header with indigo icon badge + `tracking-[0.25em] uppercase` micro-label + count pill; thumbs `rounded-[14px]` + depth shadow; module-level `FILTERS` const with Film icon on vintage pill; primary CTA = indigo gradient `linear-gradient(135deg,#7c86e1,#6368c7)` + `0 4px 20px rgba(124,134,225,0.3)` glow; 3-equal-column secondary actions; progress/preparing modals re-themed with indigo spinner ring + tokenized bg. Retired `bg-gradient-to-br from-gray-900/70 to-gray-800/50` outlier aesthetic. |
| `src/components/magnet/MagnetCamera.jsx` | 2026-04-22 PM | **Quota badge redesign** (`e5f31ec`, +22/-6). `text-xs text-white/60` copy → frosted pill badge with `backdrop-blur(12px)`; number-first typography (`text-xl font-black tabular-nums`); tri-state color — white normal, `text-amber-400` when `remainingPrints <= 3`, red pill `rgba(239,68,68,0.12)` with collapsed copy `המכסה הסתיימה` when exhausted. **Icon swap:** vintage filter toggle now uses Lucide `Film` (semantically accurate) instead of `Wand2`. |
| `src/hooks/useEventGallery.js` | 2026-04-22 | **Routing fix** (`9c0924e`). Imports `useParams`; event-code resolution now `propEventCode || routeCode || new URLSearchParams(window.location.search).get('code')`. Fixes silent null-code failure after `createPageUrl` path-param refactor. |
| `src/pages/Event.jsx` | 2026-04-22 | **Routing fix** (`9c0924e`). `useParams()` with query-param fallback in `loadEvent()`. |
| `src/pages/EventSuccess.jsx` | 2026-04-22 | **Routing fix** (`9c0924e`). `useParams()` for `{ id: eventId }`. Share URL cleaned: old malformed `createPageUrl(\`Event?code=${...}\`)&pin=${...}` (double `?&`) replaced with `${BASE_URL}/event/${event.unique_code}`. PIN param dropped from share URL. |
| `src/components/admin/frames/FrameDetailPanel.jsx` | 2026-04-22 | **Aspect fix** (`4b38ddf`). Split `PH` → `PH_PORTRAIT` + `PH_SQUARE = PW`; branches at render on `frame.isPng && frame.aspect === 'square'`. |
| `src/pages/admin/FramesLibrary.jsx` | 2026-04-22 | **Aspect fix** (`4b38ddf`). `setSelected(...)` forwards `aspect: f.aspect`; grid thumbnail `paddingBottom` conditional `'100%'` (square) vs `'133%'` (portrait). |
| `src/lib/AuthContext.jsx` | 2026-04-21 | **Admin auth race fix** (`276562a`). New `profileReady` state — only true after `enrichWithProfile()` completes. `RequireAdmin` now gates on `!isLoadingAuth && profileReady`. Added 6s profile-enrichment timeout + 10s whole-auth-settle safety timer. Strict order: auth mutex release → base user → DB profile → role → gate passes. |
| `src/functions/compositePngFrame.js` | 2026-04-21 | **NEW** (`d0db4cc`, hardened `f808345` + `276562a`). Canvas compositor overlaying photo + PNG frame + optional text. Supports `maxWidth`/`maxHeight` caps (preview cards = 600×900 to avoid 2400×3600 allocations). `crossOrigin='anonymous'` applied conditionally (Supabase URLs only — same-origin SVGs break with it). Failed-image promises deleted from cache on reject so retries actually work. |
| `src/functions/detectHoleBbox.js` | 2026-04-21 | **NEW** (`d0db4cc`). Alpha-channel scan of a PNG frame to find the transparent cutout bbox → auto-positions photo and text inside it. Eliminates manual per-frame coordinate config for well-authored transparent PNGs. |
| `src/components/admin/FramePngPreview.jsx` | 2026-04-21 | **NEW** (`d0db4cc`, fixed `f808345`). Real-time composite preview of PNG frame in admin grid. Uses `compositePngFrame()` with 600×900 cap. Retry on image load error (restores after transient CDN hiccups). |
| `src/components/admin/FrameUploadDialog.jsx` | 2026-04-21 | **NEW** (`d0db4cc`). Batch multi-file PNG ingestion with per-frame `text_config` JSONB metadata persistence. |
| `src/functions/framesUtils.js` | 2026-04-21 | `findApprovedFrameFromDB()` now falls back to local procedural seed pack via `findApprovedFrame()` when DB row is missing. Enables AI-designed SVG seeds to work in live picker without DB import. |
| `src/components/admin/FrameDetailPanel.jsx` | 2026-04-21 | Branches rendering: `frame.isPng ? <FramePngPreview /> : <canvas />`. PNG frames skip the procedural rubric approval gate — approved as static assets with metadata. |
| `src/components/admin/AdminEventsList.jsx` + `LeadsPanel.jsx` | 2026-04-21 | Brand-aligned (`0f094a8`): hardcoded `rgba(...)` → `bg-card` / `border-border` / `text-muted-foreground` / `bg-cool-950`. Editorial headings now `font-playfair`. |
| `src/components/magnet/stickerPacks.js` | 2026-04-21 | `emoji` type promoted to first-class (was legacy-only). Wedding pack 15 → 35+ stickers with emoji variants (🍾, 💍, 👰). Hebrew content added: `מזל טוב`, `בר מצווה`. |
| `vercel.json` | 2026-04-21 | CORS headers added for `/FRAMES/` static assets (`d3398ab`). Required for cross-origin-anonymous image loads to canvas without tainting. |
| `public/FRAMES/` | 2026-04-21 | Placeholder SVG seeds purged (`c1df70f`). Added 7 AI-designed SVG seeds (`06c353e`), 8 Figma transparent PNGs (`f7def4d`), 71 Canva polaroids (`4e73962`). Library now: 7 SVG + 79 PNG = 86 frames. |
| `src/components/magnet/MagnetCamera.jsx` | 2026-04-20 | eslint cleanup — removed `// eslint-disable-line` from useEffect dep arrays now that race conditions are guarded by `startIdRef` cancellation token (`dcb0646`, `c0d6cfd`). Full hardening pass: cancellation token + timeout tracking + in-app UA fallback + video-ready guard + GPU-first vintage filter + Hebrew aria-labels + retry button + escape-to-close + haptic on quota-exhaust. See long-term-memory §MagnetCamera Hardening Patterns. |
| `src/pages/EventGallery.jsx` | 2026-04-20 | ARIA tab semantics — panels wrapped in `role="tabpanel" aria-labelledby`, buttons gain `id` + `aria-controls` (`ef3a614`). Also migrated to shared `LoadingState` / `ErrorState` (`4933138`). |
| `src/Layout.jsx` | 2026-04-20 | **DELETED** (`4933138`). Inline `.luxury-button` + `.premium-submit-button` CSS retired; styling moved to `<Button>` component. |
| `src/components/ui/LoadingState.jsx` | 2026-04-20 | **NEW** (`4933138`). Spinner + `fullScreen` prop. Canonical — no more inline spinner divs. |
| `src/components/ui/ErrorState.jsx` | 2026-04-20 | **NEW** (`4933138`). AlertCircle + Hebrew message + retry button + `fullScreen` prop. |
| `src/components/ui/EmptyState.jsx` | 2026-04-20 | **NEW** (`4933138`). Optional Icon + title + description + children slot. |
| `tailwind.config.js` | 2026-04-20 | **NEW** (`4933138`). Canonical source for custom animations (`animate-paper-fly`, moved from inline `<style>` in MagnetReview), extended colors, `shadow-indigo-soft`. |
| `src/App.jsx` + `Dashboard.jsx` + `MyEvents.jsx` + `Event.jsx` | 2026-04-20 | Replaced inline spinners / error JSX with `<LoadingState fullScreen />` / `<ErrorState />`. Removed 8 legacy query-param routes from App.jsx — now path-based only (`4933138`). |
| `src/components/home/HeroSection.jsx` + `FinalCTA.jsx` + `Header.jsx` | 2026-04-20 | Hebrew-first copy: "SHOTS"/"REMAINING" → "תמונות"/"נותרו", "Begin" → "בואו נתחיל". Migrated to `<Button>` component. Header focus ring + aria-label (`4933138`). |
| `src/pages/MagnetEventDashboard.jsx` | 2026-04-20 | Cover image upload UI (dashed border box + `<ImageIcon>` + hover "לחץ להחלפה" overlay). Uses `memoriaService.storage.uploadCoverImage()` + `queryClient.invalidateQueries()` (`96dbbbe`). |
| `src/pages/MagnetGuestPage.jsx` | 2026-04-20 | Violet "Magnet Premium" header badge removed → neutral glass-morphism (`white/10`, `white/7`). `font-heebo` added to root for Hebrew typography consistency (`96dbbbe`). |
| `src/components/magnet/MagnetReview.jsx` | 2026-04-20 | Inline `<style>` keyframe `animate-paperPlane` removed — moved to `tailwind.config.js` as `animate-paper-fly`. `useEffect` added to imports (`4933138`, `96dbbbe`). |
| `src/components/camera/CameraCapture.jsx` | 2026-04-20 | Inline `.scrollbar-hide` CSS removed (`4933138`). |
| `src/pages/CreateMagnetEvent.jsx` | 2026-04-19 | Full violet→indigo/primary token sweep (0 violet-* left). Calendar, FrameThumbnail ring + "חדש" badge, FramePreviewModal button, success card, progress bar glow, hero radial glow, all step labels (01–04), focus rings, quota pills, frame-tab active state, "ללא מסגרת" chip (`18c5966`) |
| `src/pages/MagnetLead.jsx` | 2026-04-19 | Full violet→indigo/primary token sweep (0 violet-* left). Design-mode ring, inline calendar, progress bar, upload CTA, design-mode toggle, submit button, success check-circle. GUEST_OPTIONS now uses segmented-control pattern (parent `rounded-2xl bg-secondary border border-border`; selected children `bg-transparent text-primary border-primary shadow-indigo-soft`) |
| `src/components/magnet/MagnetReview.jsx` | 2026-04-18 | Preview composite useEffect bakes photo+frame+label to `previewUrl`; `photoFrac` state limits sticker drag zone; submit `drawSticker` now passes `photoH` (not `canvas.height`) so stickers don't drift onto label strip (`601e1c7`) |
| `src/components/memoriaService.jsx` | 2026-04-18 | NEW `storage.uploadCoverImage(file, eventId)` — direct fetch to `covers/{eventId}/cover.{ext}` with `x-upsert: true` |
| `src/pages/CreateMagnetEvent.jsx` | 2026-04-18 | Optional `coverImageFile` upload in step 1 (name); dashed box → thumbnail preview; writes URL to `events.cover_image` on submit |
| `src/components/home/HeroSection.jsx` | 2026-04-18 | `pt-10` → `pt-20` padding bump |
| `src/components/magnet/svgStickers.js` | 2026-04-17 PM | **NEW** — 24 Y2K/Pinterest SVG stickers, white die-cut stroke, 64×64 viewBox |
| `src/components/magnet/stickerPacks.js` | 2026-04-17 PM | Sticker System v2 — replaced badge/stamp with svg + 4 text style types (script/retro/handwritten/editorial) |
| `src/components/magnet/MagnetReview.jsx` | 2026-04-17 PM | `drawSticker()` extended: 5 type renderers + base64 SVG→Image cache via `ensureSvgImage()` |
| `src/components/magnet/framePacks.js` | 2026-04-17 PM | +3 new wedding frames (polaroid-tape, deco-gold, hairline-crest) with `isNew: true` flag (+285 lines) |
| `src/components/magnet/FramePicker.jsx` | 2026-04-17 PM | **DELETED** — logic inlined into `CreateMagnetEvent.jsx` FrameThumbnail |
| `index.html` | 2026-04-17 PM | Added font family links (Great Vibes, Parisienne, Bebas Neue, Limelight, Caveat, Patrick Hand, Abril Fatface) |

*Earlier 2026-04-17 AM (POV brand pivot) and 2026-04-16 (silvery home bug, frame system v2) changes preserved in long-term-memory §Design Language and §Canvas Preview Composite Pattern.*
