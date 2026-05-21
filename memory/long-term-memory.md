---
type: long-term-memory
updated: 2026-05-08T19:00Z
---

# Long-Term Memory — Patterns & Distilled Facts

## User Collaboration Style
- **Prefers speed:** Challenges lengthy timelines ("על מה 10 ימי עבודה??"). Compress estimates aggressively.
- **Values quality over shortcuts:** Insists on luxury aesthetic, custom design, not generic/amateurish.
- **Language:** Hebrew for all UI text; English for all code/variables/logs/docs.
- **Feedback style:** Inline, blunt, direct. Not formal reviews.
- **Decision-making:** Ask for options, give recommendation, wait for pick.

## Product Architecture
- **Dual-product platform:** MemoriaShare (legacy, guest-driven) + MemoriaMagnet (new, admin-managed, print quota)
- **Separation principle:** NO HARM rule — `event_type: 'share' | 'magnet'` conditional checks, never break Share flows when building Magnet
- **Auth model:** Super-admin / Host (share only) / Guest (anonymous only)
- **RLS is security:** Client-side checks are UX only
- **Admin:** Efi (effitag@gmail.com) — super-admin role

## Design Language (Memoria Brand — POV Pivot, Canonical 2026-04-17)

**This is the canonical brand. Decided and locked by Efi on 2026-04-17.**
The prior violet-heavy palette was retired. Aesthetic inspiration: POV.camera — cool-dark, editorial, indigo-accented.

### Core Palette (platform-wide)
| Token | Value | Tailwind anchor | Use |
|-------|-------|-----------------|-----|
| Background (primary) | `#1e1e1e` | `cool-900` | Main dark shell |
| Background (deepest) | `cool-950` (≈`#0f0f10`) | `cool-950` | Gradient base + page roots |
| Foreground | `#fcfcfe` | `cool-50` / `foreground` | Body text, high-contrast surfaces |
| Primary accent | `#7c86e1` | `indigo-500` | CTAs, focus rings, active states, editorial labels |
| Muted foreground | `#b4b4b4` | `muted-foreground` | Secondary copy, icons, placeholders |

### Surface Recipes
- **Page root:** `dark bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground`
- **Card:** `bg-card border border-border` (NOT hardcoded `bg-[#111]` or `bg-[#0a0a0a]`)
- **Input:** `bg-card border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`
- **Radial glow:** `radial-gradient(ellipse ..., rgba(124,134,225,0.06) 0%, transparent 70%)` — subtle indigo wash, NEVER warm cream (old `rgba(247,240,228,0.03)` is retired)

### Typography System
- **Display / serif:** `font-playfair` (Playfair Display) — page headers, dialog titles, Empty-state headlines, wizard step titles (2xl–4xl scale)
- **Hebrew body / UI:** `font-heebo` (Heebo) — all paragraphs, form labels, buttons
- **Editorial micro-labels:** Montserrat via `tracking-[0.3em] uppercase text-[10px] font-bold` — section numbering (`01 · ניהול`, `01 · שם האירוע`), tab chrome
- **Numerals in RTL:** Wrap in `<bdi>` for LTR numeral direction inside Hebrew flow

### Dark-Mode Activation Rule
- Semantic tokens (`bg-background`, `text-foreground`, `border-border`) resolve to LIGHT values by default
- Every page root that expects dark appearance **MUST** include the `dark` class: `<div className="dark ...">`
- Without `.dark` ancestor, `bg-background` renders as `#fafafa` (silvery), not dark — this was the root cause of the 2026-04-16 home-page contrast bug

### Sub-brand — MemoriaMagnet (Admin Back-office / Operational Surfaces)
- **Violet `#7c3aed` / `#a78bfa`** is retained as the MemoriaMagnet sub-brand accent — scope narrowed 2026-04-19, softened further 2026-04-20.
- **In-scope (still violet):** `AdminShell` tabs, `AdminOverview`, `AdminEventsList`, `LeadsPanel` (admin status chips), `PrintStation`, `MagnetEventDashboard`, `MagnetCamera` (in-event camera chrome), `MagnetReview` (canvas label strip / chrome).
- **Mixed / under review:** `MagnetGuestPage` — the header "Magnet Premium" violet badge (`bg-violet-500/20 border-violet-500/30 text-violet-300`) was removed in commit `96dbbbe` (2026-04-20) in favor of neutral glass-morphism (`white/10`, `white/7`). Root div now uses `font-heebo` for consistent Hebrew typography. Full re-audit of remaining violet tokens in the page pending.
- **Out-of-scope (indigo/primary now):** `MagnetLead` (public lead form) and `CreateMagnetEvent` (admin wizard rendered on consumer-style shell) — as of commit `18c5966`, these two consumer-facing Magnet intake pages use the same indigo/primary tokens as the Share shell (`bg-primary`, `text-indigo-400`, `focus:ring-primary/20`, `shadow-indigo-soft`).
- Rationale: violet signals "operator/print service" context. Consumer intake flows should feel continuous with the Share brand, not visually fork on step 1.
- Dual-product separation is still maintained by `event_type === 'share' | 'magnet'` at the logic layer — the visual split now kicks in only after the guest / admin crosses into the operational side.

### Segmented-Control Pattern (MagnetLead GUEST_OPTIONS, 2026-04-19)
For 2-column option groups (guest count, quota tiers, etc.) prefer a parent-container + transparent-children pattern over per-button bg switches:
```jsx
<div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary border border-border">
  {OPTIONS.map(opt => (
    <button className={selected
      ? 'bg-transparent text-primary border-primary shadow-indigo-soft'
      : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground/80'}>
  ))}
</div>
```
The container provides the chrome; selected children are marked only by their border + soft shadow (no bg swap). Native-iOS segmented feel, lower visual weight than solid-fill selected pills.

### Frosted Pill Badge Pattern (Quota / Numeric Status, 2026-04-22 PM)
Canonical recipe for any numeric-status indicator on a dark, transparent-over-media surface (camera chrome, gallery overlays, review screens). Precedent: `MagnetCamera.jsx` remaining-prints quota badge (`e5f31ec`).
- Container: `flex flex-col items-center justify-center px-4 py-1.5 rounded-full` with `backdrop-filter: blur(12px)` and translucent bg/border pair.
- **Number-first typography:** `text-xl font-black leading-none tabular-nums` — the number is the primary signal; the label shrinks to `text-[9px] text-white/35 mt-0.5` underneath.
- **Tri-state color:** normal `rgba(255,255,255,0.08)` bg + `text-white` number; warning (`<=3` or other threshold) swap number color to `text-amber-400` only (keep bg neutral); exhausted/error swap BOTH to red `rgba(239,68,68,0.12)` bg + `rgba(239,68,68,0.3)` border + collapsed copy (drop the number, show a short Hebrew status like `המכסה הסתיימה`).
- Use `tabular-nums` so number changes don't jitter the pill width.
- Never hardcode `text-white/60` gray copy — that's the pre-POV aesthetic. Always go through the frosted-pill treatment for quota/status.

### Editorial Panel Header Pattern (2026-04-22 PM)
For any grouped-content panel on either Share or Magnet side (upload queue, photo grid, admin event rows), lead with this 3-element header:
- **Small icon badge:** 32×32 `rounded-xl` with translucent brand-color bg (`rgba(124,134,225,0.12)`) + matching 1px border + 14px Lucide icon (indigo for Share, violet for Magnet admin).
- **Micro-label (eyebrow):** `text-[9px] font-bold tracking-[0.25em] uppercase text-indigo-400 mb-0.5` — short Hebrew uppercase e.g. `ממתינות להעלאה`, `אירועים פעילים`.
- **Bold title:** `text-sm font-bold text-white font-heebo leading-none` — Hebrew phrase incorporating the count e.g. `N תמונות נבחרו`.
- **Optional count pill (right side):** `text-indigo-300 bg-[rgba(124,134,225,0.12)] border-[rgba(124,134,225,0.22)] tabular-nums text-xs font-black px-2.5 py-1 rounded-full` — bare number, mirrors the quota-pill aesthetic at smaller scale.
- Header bottom border: `rgba(255,255,255,0.05)` hairline separates header from content.

Precedent: `UploadManager.jsx` pending-photos panel (`6643fd2`).


### Component Vocabulary (consistent across pages)
- **Wizard step header pattern:** indigo/violet micro-label (`0N · 段名`) → Playfair 2xl title → muted-foreground subtitle
- **Editorial label:** `text-indigo-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-3`
- **Primary CTA:** `bg-indigo-500 text-cool-950 hover:bg-indigo-400 font-semibold` (or `bg-cool-50 text-cool-950` for secondary-strong)
- **Tab underline (active):** 2px border-bottom, color = indigo-500 (share) / violet-500 (admin)
- **Icon containers:** 32px `rounded-xl`, translucent color bg, 16px Lucide icon inside

### Button Component (Layout.jsx DELETED 2026-04-20)
- `src/Layout.jsx` was deleted in commit `4933138`; the `.luxury-button` and `.premium-submit-button` inline-CSS classes it owned are **gone**. Any surviving reference to those selectors is dead code.
- New canonical CTA: import `Button` from `@/components/ui/button` and style via Tailwind props. No more cool-neutral gradients with indigo-tinted shadows — plain semantic-token backgrounds (`bg-primary`, `bg-cool-50`, etc.).
- `tailwind.config.js` (added in the same commit) is now the canonical source for custom animations (e.g. `animate-paper-fly`, formerly an inline `<style>` block in `MagnetReview.jsx`), extended colors, and the `shadow-indigo-soft` utility.

### Shared State Components (2026-04-20, `src/components/ui/`)
Canonical primitives — never hand-roll these in a page:
- `LoadingState.jsx` — spinner with optional `fullScreen` prop
- `ErrorState.jsx` — `AlertCircle` icon + Hebrew message + retry button; optional `fullScreen`
- `EmptyState.jsx` — optional Icon + title + description + `children` slot

Callers migrated in commit `4933138`: `App.jsx`, `Dashboard.jsx`, `Event.jsx`, `EventGallery.jsx`, `MyEvents.jsx`. Going forward, any page that needs a loading/error/empty chrome MUST import these — no inline spinner `<div>` or bespoke error JSX.

## UI Anti-patterns (Explicitly Rejected)
- 3D WebP icons with white backgrounds on dark UI — looks terrible ✗
- Generic emoji-only sticker packs (💍🥂💐) — too amateurish ✗
- Tab nav with icons — user chose text-only variant ✗
- Large decorative icons instead of small contained ones ✗
- Warm cream radial glow `rgba(247,240,228,0.03)` — retired with POV pivot ✗
- Hardcoded hex backgrounds on shell surfaces (`bg-[#0a0a0a]`, `bg-[#111]`, `bg-[#1a1a1a]`) — use semantic tokens (`bg-card`, `bg-secondary`, `bg-background`) ✗
- Page root without `.dark` class when dark appearance is intended ✗
- `bg-background via-cool-900 to-background` gradient — resolves to silvery sheen because `background` defaults to light; use explicit `from-cool-950 via-cool-900 to-cool-950` ✗
- Silver-metallic button gradients with gray shadows — retired; use cool-neutral + indigo-tinted shadows instead ✗
- Duplicating `compressImage()` helpers across pages (currently MagnetLead has an inline copy) — consolidate into `@/functions/processImage` ✗
- Separate picker components that only serve ONE parent page (e.g. the now-deleted `FramePicker.jsx`) — inline the picker into the wizard step that owns it to avoid prop drilling ✗
- `bg-gray-*` / `border-gray-*` / `text-gray-*` Tailwind tokens on Share-side panels — use cool/indigo brand palette + frosted translucency (`rgba(255,255,255,0.02–0.08)` + `backdrop-blur(12px)`). Example retrofit: `UploadManager.jsx` 2026-04-22 PM (`6643fd2`) ✗
- `Wand2` / generic magic-effect icons for photo filters that apply a specific look (film, B&W, vintage) — use `Film` or the specific icon that matches the filter semantics. Precedent: MagnetCamera + UploadManager 2026-04-22 PM (`e5f31ec`, `6643fd2`) ✗
- Inline `subscribe={(cb) => ...}` arg to `useSyncExternalStore` — must be referentially stable (defined outside component or wrapped in `useCallback` with stable deps). Inline functions cause subscribe/unsubscribe loops and silent realtime-event drops. Same rule for `getSnapshot` returning a fresh object literal. See §Performance Patterns. ✗

## Sticker System v2 (Canonical, 2026-04-17 PM)

The badge/stamp aesthetic (§Preferred Sticker Aesthetic below) was **superseded** by a Y2K / Pinterest-inspired system in commit `5583664`. The new system is the active one.

### Types (stored as `def.type` in stickerPacks)
| Type | Source | Canvas render |
|------|--------|---------------|
| `svg` | `SVG_STICKERS[svgKey]` from `svgStickers.js` | base64 encode SVG → `Image` → `ctx.drawImage` at `w * 0.18`. Cache images per `svgKey` via a `useRef(new Map())`. |
| `script-text` | `Great Vibes` / `Parisienne` cursive | `w * 0.065` size, 0.16 stroke ratio, white fill on rgba(0,0,0,0.7) stroke |
| `retro-text` | `Bebas Neue` / `Limelight` | `w * 0.07`, letter-spacing 0.12em, `#facc15` fill on rgba(0,0,0,0.85) stroke |
| `handwritten-text` | `Caveat` / `Patrick Hand` 700 | `w * 0.06`, white fill on rgba(0,0,0,0.75) stroke |
| `editorial-text` | `Abril Fatface` / `Playfair Display` | `w * 0.072`, white fill on rgba(0,0,0,0.8) stroke |
| `emoji` | unicode | `w * 0.13` serif, direct fill |

Legacy types (`badge`, `stamp`, `text`) are preserved in `drawSticker()` for back-compat but no longer used by the 4 stock packs.

### SVG sticker recipe
- 64×64 viewBox, white 3px outer stroke with `paint-order="stroke"` (die-cut look)
- Store as string in `SVG_STICKERS` map; consumer calls `ensureSvgImage(svgKey)` → Promise<Image>
- Base64 encode: `btoa(unescape(encodeURIComponent(svgStr)))` then `data:image/svg+xml;base64,...`
- `addSticker` spreads `svgKey` onto the sticker instance so the canvas renderer can look up the cached Image

### Canvas Font Families (for sticker + frame rendering)
Must be loaded via `<link>` in `index.html`: Great Vibes, Parisienne, Bebas Neue, Limelight, Caveat, Patrick Hand, Abril Fatface, Playfair Display, Secular One. Fallbacks: `cursive`, `sans-serif`, `serif`. Test with `document.fonts.ready` before first canvas draw on slow networks.

---

## Legacy Sticker Aesthetic (Pre-2026-04-17 PM — retained only for back-compat in drawSticker)
- Physical sticker shop feel: badges (pill), stamps (rectangular label), attitude text
- "LEGEND", "ICONIC", "MAIN CHARACTER", "JUST MARRIED ✨" > "💍💕✨🎊"
- `badge` type: `#caff4a` (lime) or `#111` (dark) with `dark: true/false` flag
- `stamp` type: white bg + `#111` border, uppercase

## Cover Image Design Mode Pattern (MagnetLead / CreateEvent)
Both pages support pinch/drag/touch transform on a phone-mockup cover image. Shared contract:
- Props: `coverImage`, `imageTransform: { x, y, scale }`, `isDesignMode`, `onImageTransformChange`
- Measure `screenRef.offsetWidth/Height` vs `imgNaturalSize` to compute **initial scale** = `Math.max(scaleW, scaleH)` (fill) and **min scale** = `Math.min(scaleW, scaleH)` (contain-clamp)
- `didSetInitialTransform` ref prevents re-computing initial on re-render
- Touch events tracked via a single `touchState` ref (`{ isDragging, lastX, lastY, lastPinchDist }`) — don't use state for gesture tracking (re-renders kill framerate)

## Canvas Preview Composite Pattern (MagnetReview, 2026-04-18)

When a review/design surface needs to show **exactly** what the final export will look like — including frame artwork, labels, and chrome — bake the composite to a data URL and render it as an `<img>`. Do NOT mount a live HTML layer that only roughly approximates the final canvas output; users will place stickers in positions that don't survive the export.

Pattern used in `MagnetReview.jsx`:
- `useEffect([imageDataURL, event.overlay_frame_url])` loads the source photo into an `Image`
- Creates an off-screen `<canvas>` sized `photoW × (photoH + labelH)` where `labelH = round(photoW * LABEL_H_RATIO)`
- Fills white, draws photo, calls `eventFrame.drawFrame(ctx, photoW, totalH, photoH, event)` to paint frame + label
- Exports `canvas.toDataURL('image/jpeg', 0.9)` to `previewUrl` state
- Stores `photoFrac = photoH / totalH` in state so the sticker drag zone can be constrained to `height: ${photoFrac * 100}%` of the composite image (stickers must never land on the label strip)

**Rule:** sticker coordinates (`s.x`, `s.y`) are stored **relative to the photo area**, not the total canvas. When calling `drawSticker(ctx, s, w, h, ...)` at submit time, pass `photoW` and `photoH` — NOT `canvas.width` / `canvas.height` (which would include the label strip and shift stickers downward).

## MagnetCamera Hardening Patterns (Canonical, 2026-04-20)

Cluster of defensive patterns introduced in commit `c0d6cfd`. These should be applied to any new camera or long-lived media component (not just MagnetCamera). Inline source markers `F01` … `F17` tag each fix in the file for traceability.

### Cancellation token for overlapping async operations
```js
const startIdRef = useRef(0);
async function startCamera() {
  const id = ++startIdRef.current;
  const stream = await navigator.mediaDevices.getUserMedia(...);
  if (id !== startIdRef.current) {
    stream.getTracks().forEach(t => t.stop()); // stale — clean up
    return;
  }
  // ... apply stream
}
```
Prevents resource leak when user re-triggers the operation (e.g. flips camera mid-stream-setup) before the previous one resolves. Pattern generalizes to any `async` effect where a later invocation should invalidate an earlier one.

### Centralized `setTimeout` tracking (prevents leaked timers on unmount)
```js
const timeoutsRef = useRef([]);
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timeoutsRef.current.push(id);
  return id;
}
useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);
```
EVERY `setTimeout` in the component goes through `later()`. Single unmount cleanup clears them all — no more "missed one timer" leaks.

### In-app browser detection with file-upload fallback
```js
const IN_APP_UA_RE = /Instagram|FBAN|FBAV|Line|Twitter/i;
const [camFailed, setCamFailed] = useState(
  () => IN_APP_UA_RE.test(navigator.userAgent)
);
```
Instagram, Facebook, Line, and Twitter WebViews sandbox `getUserMedia` — it silently fails or returns a blank stream. Detect at mount, flip to a file-upload fallback UI before the user taps shutter. Pairs with the existing "iOS Safari standalone PWA breaks getUserMedia" pitfall.

### Defensive guards around capture
- **Video-ready guard:** `if (!v.videoWidth || !v.videoHeight) return;` — user can tap shutter before `loadedmetadata` fires.
- **Release `capturingRef` in `finally`:** prevents UI lockup if `drawImage` throws (e.g. canvas tainted by cross-origin video).
- **Front-flash at shutter, not toggle:** `if (flash === 'on' && !cap.torch) { setFrontFlash(true); await new Promise(r => later(r, 50)); }` — animation syncs with the capture moment, not when the user flipped the setting.
- **Safe date parsing:** accept `YYYY-MM-DD` string OR ISO, validate `isNaN(d.getTime())`.

### GPU-first image filters with pixel-loop fallback
```js
if (vintage && typeof ctx.filter !== 'undefined') {
  ctx.filter = VINTAGE_FILTER;  // GPU path
}
ctx.drawImage(videoEl, 0, 0, w, h);
if (vintage && typeof ctx.filter === 'undefined') {
  applyVintagePixels(ctx, w, h);  // CPU fallback (Safari <16.4)
}
```
Prefer `ctx.filter` (GPU-accelerated) — pixel-loop fallback only for browsers lacking support. Directly addresses §Performance Patterns Canvas 2D gotcha #3 (fillText re-shaping) on a different axis. Capture-time only — NEVER on live video stream per CLAUDE.md §3.6.

### Recoverable error UX (no terminal states)
- **Retry button in error state:** `<button onClick={startCamera}>נסה שוב</button>` alongside close button — user doesn't have to exit to the dashboard to retry.
- **Haptic on quota exhaustion:** `if (remainingPrints <= 0) { navigator.vibrate([10, 50, 10]); return; }` — tactile feedback that tap was received but blocked.
- **Escape key closes camera:** global keydown listener added for desktop/kiosk use.

---

## Accessibility Conventions (Canonical, 2026-04-20)

Applied consistently to every interactive surface touched in the `pov upgradeALL` series (`EventGallery`, `MagnetCamera`, `Header`, form controls).

### ARIA tab semantics
- Tab button: `role="tab"`, `aria-controls="{panel-id}"`, `aria-selected`, `id="{btn-id}"`
- Tab panel: `<div id="{panel-id}" role="tabpanel" aria-labelledby="{btn-id}">`
- Example (EventGallery): `id="tab-btn-my-photos"` button → `id="tab-my-photos"` panel.

### Icon buttons MUST have Hebrew `aria-label`
Every icon-only button: `aria-label="סגור מצלמה"`, `aria-label="סגור תפריט"`, `aria-label="החלף מצלמה"`, etc.

### Focus rings on interactive elements
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40` — or `ring-white/80` on dark camera chrome where indigo contrast is weak.

### State announcements
- `role="alert"` on error containers — screen reader announces immediately, no refocus required.
- `aria-pressed={boolean}` on toggle buttons (vintage filter, flash toggle).
- Modal surfaces: `role="dialog" aria-modal="true" aria-label="<Hebrew purpose>"` on the root (e.g. camera overlay).

### WCAG AA contrast
- Body text on dark bg: `text-white/60` minimum (was `text-white/40` in older camera chrome — bumped in commit `c0d6cfd`).
- Don't rely on color alone for state — pair with icon or text change.

---

## Storage Upload Pattern — Direct `fetch` with `x-upsert`

`memoriaService.storage.uploadCoverImage()` (2026-04-18) uploads to `covers/{eventId}/cover.{ext}` via direct `fetch` to `${VITE_SUPABASE_URL}/storage/v1/object/photos/{path}` with headers:
```
Authorization: Bearer {jwt from _getJwt()}
apikey: {VITE_SUPABASE_ANON_KEY}
Content-Type: {file.type}
x-upsert: true
```
Use this recipe when the path is **canonical per-resource** (e.g. one cover per event) so re-uploads replace in place instead of piling up orphaned files. Contrast with the per-photo upload path which uses `{event_id}/{timestamp}_{filename}` for append-only semantics.

---

## PNG Frame Overlay Pipeline (Canonical, 2026-04-21 — partially reset 2026-05-05)

Shipped in commit `d0db4cc`, hardened across `f808345` + `d3398ab` + `276562a`. **Hard reset on 2026-05-05** wiped the frame library and the admin batch-ingestion UI; the canvas compositor primitives remain canonical.

### Primitives (current — post 2026-05-05 reset)
- **`src/functions/compositePngFrame.js`** — canvas compositor: photo + PNG overlay + optional text. Accepts `maxWidth`/`maxHeight` caps (required for preview cards). **Retained.**
- **`src/functions/detectHoleBbox.js`** — alpha-channel scan → returns `{ x, y, w, h }` of the transparent cutout. **Retained.**
- **`src/components/admin/FramePngPreview.jsx`** — real-time composite preview (`600×900` cap). **Retained**, now rendered inline by `FramesLibrary.jsx` (no longer wrapped by `FrameCard`).
- **`src/functions/framesUtils.js::findApprovedFrameFromDB()`** — DB-first lookup. **Retained**, but the procedural fallback path is now empty (pack stubbed in `framePacks.js`).
- **`memoriaService.frameMeta.listPngFrames()`** — admin-side query feeding `FramesLibrary.jsx`'s grid.

### Removed in 2026-05-05 reset (`15a6d16`)
- `src/components/admin/frames/FrameCard.jsx` — styling now lives inline in FramesLibrary.
- `src/components/admin/frames/FrameDetailPanel.jsx` — detail-panel UX retired.
- `src/components/admin/frames/FrameUploadDialog.jsx` — batch ingestion UI deleted; new frames added via DB-only flow.

### Hardening rules (learned the hard way)
1. **`crossOrigin='anonymous'` is conditional.** Apply ONLY to Supabase-hosted (cross-origin) URLs. Applying to same-origin SVGs breaks them with CORS errors. Future image-loader code adjacent to this pipeline must enforce the same guard.
2. **Delete failed image-load promises from the cache on reject.** A naïve `imageCache.set(url, promise)` keeps the rejected promise forever — next call returns the same rejection without retrying. Rejection handler must `imageCache.delete(url)` so subsequent calls re-try.
3. **Cap canvas dimensions in preview mode.** Admin grid renders ~20 preview cards; unbounded 2400×3600 canvases per card caused memory thrashing. `compositePngFrame()` takes `maxWidth`/`maxHeight` args (preview = 600×900, export = native dimensions).
4. **CORS headers required on `/FRAMES/` in `vercel.json`.** Cross-origin-anonymous image loads will taint a canvas unless the server responds with `Access-Control-Allow-Origin`. Canvas taint makes `toDataURL` / `getImageData` throw SecurityError. If new public-asset directories ship (e.g. `/STICKERS/`), replicate the header block.

### Admin flow branching
- PNG frames skip the procedural rubric approval gate — they're approved as static assets with metadata, not scored designs.
- `FrameDetailPanel` branches: `frame.isPng ? <FramePngPreview /> : <canvas />`.
- Both paths write to the same `frames` table; `isPng` flag routes rendering.

### Frame library — current state (post 2026-05-05 reset)
- **Total active frames: 1** — `polaroid-classic.png` only (`680785d`, polished `8c27742`).
- 776×1031 portrait, 682×682 centered transparent square hole, white border, r=16 rounded outer corners (regenerated via SVG mask + sharp `dest-out` composite).
- `framesMeta.js` + `framePacks.js` are stubbed (empty exports). Picker (`findApprovedFrameFromDB`) reads from `frames_meta` DB rows; falls through to empty pack if DB row missing.
- **Magnet picker WILL surface near-empty** until library is rebuilt. Track in project-memory tech debt.

### Frame ingestion workflow (post-reset, DB-only)
With `FrameUploadDialog.jsx` deleted, adding a new frame is a 4-step manual flow:
1. Author transparent PNG (Figma / Canva / sharp pipeline). Match the `polaroid-classic` convention: portrait, transparent square or rectangle hole, white frame border, r=16 outer corners.
2. Drop file into `public/FRAMES/`.
3. Hand-author a `frames_meta` row: `INSERT INTO frames_meta (frame_id, png_url, hole_bbox, text_config, status, style, category, aspect, sort_weight) VALUES (...)`. Use `detectHoleBbox.js` locally to compute `hole_bbox` if needed.
4. `FramesLibrary.jsx` picks it up automatically from the live `memoriaService.frameMeta.listPngFrames()` query.

**Decision (open):** rebuild a streamlined upload UI later, or stay DB-only. No deadline; tracked in project-memory.

### Frame library — historical (pre-2026-05-05 reset, archived for reference)
- 7 AI-designed SVG seeds (`06c353e`) — "white-elegant" procedural; lived in code via seed pack.
- 8 transparent PNG polaroids from Figma (`f7def4d`).
- 71 Canva polaroid frames extracted from 6 sheet exports (`4e73962`) — bulk Canva sheet-to-PNG pipeline.
- 30 FRAMES1 photo-print landscape templates in `public/FRAMES-PROCESSED/` (`cbd2058`) — sharp-based webp→PNG-32 pipeline; 28 A2 composite-photo frames pending Figma prep.
- All wiped from DB on 2026-05-05 (`51f28ea`); on-disk PNGs may still linger in `public/FRAMES/` and `public/FRAMES-PROCESSED/` — orphan audit pending in project-memory.

---

## Admin Auth Race Pattern (Canonical, 2026-04-21)

Learned in commit `276562a`. Applies whenever a component's render gating depends on a value enriched asynchronously AFTER auth settles.

**The bug class:** `useAuth()` returns `{ user, isLoadingAuth }` — but `user` may be populated from the JWT (base identity) BEFORE an async `enrichWithProfile()` DB query resolves role/quota/profile fields. A component that checks `!isLoadingAuth && user?.role === 'admin'` can run with `user.role === undefined` during the enrichment window, redirecting away legitimate admins.

**Canonical pattern:** expose a second readiness flag that is only true AFTER all async enrichment completes:
```js
// In AuthContext
const [profileReady, setProfileReady] = useState(false);

useEffect(() => {
  if (!user) { setProfileReady(false); return; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000); // 6s cap
  enrichWithProfile(user.id, controller.signal)
    .then(profile => { setUser(u => ({ ...u, ...profile })); setProfileReady(true); })
    .catch(() => setProfileReady(true)) // fail-open so UI doesn't hang
    .finally(() => clearTimeout(timer));
  return () => { controller.abort(); clearTimeout(timer); };
}, [user?.id]);
```

Also add a hard safety timer (10s) on the whole auth settle — if something hangs, flip to "unauthenticated" rather than perpetual spinner.

Consumers gate on BOTH: `!isLoadingAuth && profileReady && user?.role === 'admin'`. The ordering contract becomes: **auth mutex release → base user from JWT → DB profile enrichment → gate passes**.

**Rule:** never gate on `user?.someField` without confirming that field comes from the JWT (synchronously available) vs. from DB enrichment (async — requires a readiness flag).

## Tech Stack Rules (Non-Negotiable)
- React 18 hooks only (no class components, no HOCs except 3rd-party wraps)
- Tailwind utility-only (no custom .css, no in
---

## Common Pitfalls
*updated: 2026-05-06T06:00Z (Supabase auto-retry semantics + auth.resend implicit-flow regression promoted from research-scout)*

### Supabase JS v2 auto-retries GET/HEAD only — write paths get ZERO automatic retries
`supabase-js` transparently retries GET/HEAD requests up to **3× with exponential backoff** (1s → 2s → 4s, capped at 30s, with jitter) on transient errors (HTTP 408 / 409 / 503 / 504 / 520, network failures). Each retry adds an `X-Retry-Count` header. Enabled by default — no code change. **Only idempotent methods retry — POST / PATCH / PUT / DELETE are NEVER auto-retried.** Memoria is on supabase-js v2.101.1; capability is active.
- **UX consequence:** loading states (CLAUDE.md §3.2 mandates `isLoading` for >200ms ops) silently extend to ~7s on a failing GET. User-facing Hebrew error messages saying "נסה שוב" are misleading on GET-shaped flows — the user has already auto-retried 3×, so a 4th tap won't help. Reword final-error UX for GET paths to suggest a different recovery (refresh / check connection) rather than another tap.
- **Write-side hardening:** every WRITE path (`memoriaService.uploadPhoto`, `requestPhotoDeletion`, `signUp`, RLS-bound INSERTs) gets ZERO automatic retries. Any flaky-network hardening on these must be hand-rolled — wrap in a single retry-with-backoff helper, NOT a tight loop (POST/PATCH retries on a non-idempotent endpoint risk double-writes if the original eventually succeeded server-side).
- **Realtime is independent:** the channel reconnect logic in `useRealtimeNotifications` / `useEventGallery` is NOT covered by this — fetch-side retries don't apply to the websocket layer.
- **Debug:** add an `X-Retry-Count` watcher to dev/debug logs to surface flaky upstream behavior before users report it.
- **Source:** https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js.

### `supabase.auth.resend({ type: 'signup' })` emits implicit-flow URL even on PKCE clients (silent UX dead-end)
**Forward-looking gotcha — Memoria does NOT call `auth.resend(...)` anywhere as of 2026-05-06; documenting now so the bug is caught when the feature lands.** The original `signUp()` correctly emits a PKCE `?code=` confirmation link, but a subsequent `supabase.auth.resend({ type: 'signup', email })` always emits an **implicit-flow** link with `#access_token=...` URL fragment — even on a client configured with `flowType: 'pkce'`. Same inconsistency for `auth.resend({ type: 'email_change' })`. Symptom: first confirmation email opens correctly via `exchangeCodeForSession`; a resent email arrives at the same callback route, the handler sees no `code` query param, silently fails, and the user sees a "link expired" UI even on a fresh click.
- **NOT a security regression** — the resent link is still a legitimate confirmation token — but a silent UX dead-end. Pairs with the existing PKCE single-use, 5-min TTL pitfall (same callback handler, different failure axis).
- **When implementing resend UX (host re-registration retry, "didn't get it" button, OAuth-link recovery):** the callback handler MUST detect BOTH `?code=` (PKCE, standard signUp/recovery) AND `#access_token=...` URL-fragment (implicit, resend-only) — wire two parsing paths until upstream fixes #42527. Hebrew fallback if both parsers fail: `הקישור פג תוקף — בקש/י קישור חדש` (matches existing PKCE-expired UX surface).
- **Subscribe to issue #42527** for upstream fix; remove the implicit-flow parser when resolved.
- **Source:** https://github.com/supabase/supabase/issues/42527 (open, filed Feb 2026).


### Query-param → path-param route refactor requires migrating every consumer at once
When `createPageUrl` (or any route helper) switches from emitting query strings (`/Event?code=ABC`) to path params (`/event/ABC`), EVERY page and hook that previously read `window.location.search` or `new URLSearchParams(...)` for those values must be migrated to `useParams()` in the SAME PR — otherwise freshly-generated URLs resolve the param to `null` and the page silently loads an empty state with no error.
- **Canonical migration pattern:** `const { code: routeCode } = useParams(); const resolved = propCode || routeCode || new URLSearchParams(window.location.search).get('code');` — `useParams()` first, legacy query-param fallback second (keeps pre-refactor QR codes / share links working).
- **Also audit:** share-URL construction sites. Old code often concatenates `${createPageUrl(\`X?code=${c}\`)}&pin=${p}` — after the refactor, `createPageUrl` no longer emits a `?`, so `&pin=...` produces malformed `?&pin=...` URLs.
- **Where it hit Memoria:** `useEventGallery.js`, `Event.jsx`, `EventSuccess.jsx` broke silently from 2026-04-20 (`4933138`) until 2026-04-22 (`9c0924e`) — every new share event after the refactor resolved to null.
- **Rule:** after any `createPageUrl` / routing helper change, grep `window.location.search` across `src/` and migrate each hit in the same PR.

### Canvas image caches must delete failed promises on reject
A naïve `imageCache.set(url, loadImage(url))` traps a rejected promise forever — every subsequent call returns the same cached rejection without retrying, so a transient CDN hiccup permanently bricks a frame URL. The rejection handler must `imageCache.delete(url)` so the next call actually re-loads.
- **Where it hit Memoria:** initial `compositePngFrame.js` implementation (`d0db4cc`) — fixed in `276562a`.
- **Rule:** any image-loader helper that caches in-flight promises must clear failed entries on rejection. Applies equally to font caches, sticker SVG caches, and future blob-URL caches.

### Canvas cross-origin image loads must match server CORS headers — or `getImageData`/`toDataURL` throw SecurityError
Loading an image with `img.crossOrigin = 'anonymous'` tells the browser to fetch it with CORS. If the server does not respond with `Access-Control-Allow-Origin`, the canvas becomes "tainted" the moment the image is drawn — and any subsequent `getImageData` or `toDataURL` call throws SecurityError. Worse: applying `crossOrigin='anonymous'` to a SAME-ORIGIN image is ALSO an error class — it can break the load entirely if the server responds with no CORS headers for same-origin requests.
- **Rule:** apply `crossOrigin='anonymous'` ONLY to cross-origin URLs (Supabase, CDN). Leave it off for same-origin `/FRAMES/`, `/STICKERS/`, etc. — unless you've explicitly added CORS headers to those paths in `vercel.json`.
- **Memoria pattern:** `/FRAMES/` AND `/FRAMES-PROCESSED/` both have explicit CORS headers in `vercel.json` (`d3398ab` + `cbd2058`) so `crossOrigin='anonymous'` works there. If adding a new public-asset path drawn to canvas (e.g. `/STICKERS/`, `/OVERLAYS/`), replicate the header block.

### Async role enrichment can race with route gating
`useAuth()` populates `user` from the JWT synchronously — but role, quota, and profile fields usually come from a separate DB fetch. A component that checks `user?.role === 'admin'` the tick after auth settles can see `role === undefined` and redirect legitimate admins away. See §Admin Auth Race Pattern for the canonical `profileReady` flag fix.
- **Rule:** any gating on `user?.someField` where the field is enriched async must gate on a second readiness flag (`profileReady`). Never trust `user` alone.
- **Where it hit Memoria:** `RequireAdmin` component (`276562a`, fixed 2026-04-21).

### Canvas `willReadFrequently` must be on FIRST `getContext('2d')` call
`getContext('2d', { willReadFrequently: true })` only takes effect on the **first** invocation on a canvas element — later calls silently ignore the option because the rendering backend is already fixed. Any code path that ultimately calls `getImageData` / `putImageData` (EXIF stripping, watermark compositing, pixel-level filters) must set the flag on the first `getContext` call, or perf silently degrades.
- **Where it hits Memoria:** CameraCapture.jsx frame-capture canvas; any future sticker/caption pixel pass.
- **Source:** https://html.spec.whatwg.org/multipage/canvas.html + MDN Optimizing canvas.

### Supabase RLS DELETE silently fails without a matching SELECT policy
With RLS enabled, `supabase.from('t').delete().match(...)` only deletes rows also visible via a SELECT/ALL policy. A DELETE policy alone is insufficient — no error object is returned, the operation just affects zero rows and the UI looks like it silently succeeded.
- **Defensive pattern:** after `.delete()`, verify returned `count > 0`; throw a Hebrew error (`המחיקה נכשלה — אין לך הרשאה`) otherwise. Never trust a missing error object as "success."
- **Schema audit rule:** every table with a DELETE policy in `CLEAN_RESET_SCHEMA.sql` MUST have a matching SELECT/ALL policy covering the same rows.
- **Source:** https://supabase.com/docs/guides/database/postgres/row-level-security + https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv.

### Prefer inline correlated `EXISTS` over `SECURITY DEFINER` helpers in RLS policies
When extending RLS policies with a "is this user a member / editor / X of this row" check, prefer an inline correlated `EXISTS (SELECT 1 FROM <permissions_table> WHERE ...)` subquery over wrapping the check in a `SECURITY DEFINER` helper function. SECURITY DEFINER bypasses the calling user's RLS context (it runs as the function owner) — every call is a hidden privilege-escalation surface and is harder to audit. Inline EXISTS runs under the correct `auth.uid()` context, is visible at the policy level, and is cheap enough with a `(event_id, role)` index.
- **Memoria pattern:** the Phase 1 `event_permissions` migration (`cbd2058`) extends 4 existing photo/event policies with `OR EXISTS (SELECT 1 FROM event_permissions ep WHERE ep.event_id = <table>.id AND ep.user_id = (select auth.uid()) AND ep.role = 'editor')`. **No `is_editor_for_event(UUID)` SECURITY DEFINER function exists** — and explicitly should not be created. Same rule for any future "is_member_of(event_id)", "is_subscriber(event_id)", etc. checks.
- **Index requirement:** every `(table.fk_id, role)` pattern in EXISTS needs a covering index. `event_permissions` ships with `(event_id, role)` for this purpose.
- **Rollback safety:** policy DROP+CREATE is idempotent and rollback-safe. SECURITY DEFINER helpers leak across migrations — easier to forget to drop on rollback.

### Migrating a sharing/permissions system from email-keyed to UUID-keyed: BOTH must coexist for several phases
Memoria's pre-2026-04-26 sharing was an `events.co_hosts text[]` email array. Phase 1 (`cbd2058`) introduced `event_permissions(event_id, user_id UUID, role)`. **Until Phase 7 (drop `co_hosts`), every access decision must check BOTH systems with union logic:** a user can be in `co_hosts[]` by email but have no UUID row yet, or vice versa. Dropping either check before the migration completes silently locks out legitimate users.
- **Canonical priority block (apply verbatim — see `.claude/agent-memory/03-task-decomposer/arch_role_resolution_pattern.md` for the full table + code):**
  - admin > creator > new-system-editor > legacy-cohost > new-system-viewer > guest
  - **Conflict rule:** if a user has a `viewer` row AND their email is in `co_hosts[]`, effective role is **editor** (priority 4 beats 5 — higher privilege wins). The viewer grant does NOT downgrade a legacy co-host. Only Phase 7 can collapse this.
- **Code sites in Memoria using this block (must stay in sync):** `src/hooks/useEventGallery.js` (3 places: code-load, delayed event-load, realtime handler) + `src/pages/Dashboard.jsx`.
- **`isOwner` backward-compat rule:** when migrating from a single boolean (`isOwner`) to a four-value role (`'owner'|'editor'|'viewer'|'guest'`), keep the boolean in the hook return for one full release window. Consumers (e.g. `EventGallery.jsx`, `GalleryHeader.jsx`) migrate at their own pace; remove the legacy field in a separate cleanup PR.
- **Phase 7 simplification preview:** drop `isLegacyCoHost` line; `effectiveIsEditor = isNewEditor`; `effectiveIsViewer = isNewViewer`. Update the priority table to 4 rows.

### Supabase Realtime `postgres_changes` events filtered by RLS SELECT — silently drop for rows the subscribed user can't SELECT
Realtime impersonates the subscribed client and evaluates the table's SELECT RLS policy per-row before broadcasting each change. INSERT/UPDATE/DELETE events for rows the user can't SELECT are silently dropped — no error, subscription stays "connected." Even write-only event-log tables need a SELECT policy purely for Realtime visibility. Symptom: "gallery looks frozen for everyone but the uploader" or "realtime stopped working after I enabled RLS."
- **Memoria impact:** `useRealtimeNotifications`, `useEventGallery`, and any future `PrintStation` channel must verify the subscribed table's SELECT policy covers the same row scope as the realtime filter. If `photos` has an "uploader-only" SELECT but realtime is supposed to broadcast event-wide inserts, gate by `event_members` or a session token instead.
- **Schema audit rule:** for every table referenced in a `supabase.channel().on('postgres_changes', ...)` subscription, confirm a PERMISSIVE SELECT RLS policy matches the subscription filter scope. Same silent-fail class as the RLS DELETE pitfall above.
- **Source:** https://supabase.com/docs/guides/realtime/postgres-changes + supabase issues #35195 / discussion #35196 (reaffirmed 2025).

### Supabase `onAuthStateChange` + async callback + `await supabase.*` = whole-client deadlock
If the `onAuthStateChange` callback is `async` and `await`s any other supabase-js method on the same client (`.from()`, `.storage.upload()`, `.auth.getUser()`, etc.), the internal auth lock is still held when the inner call tries to acquire it → the inner call hangs forever, AND every subsequent supabase-js call from any code path also hangs. App goes silent — no error, no timeout, just frozen data fetches. Symptom: "after the user signs in, all queries stop returning until reload."
- **Workaround:** keep the callback synchronous; dispatch any post-event Supabase work to the next macrotask: `onAuthStateChange((event, session) => { setState({ session, user: session?.user ?? null }); setTimeout(() => loadProfile(session?.user?.id), 0); })`.
- **Memoria audit:** read `@/lib/AuthContext` now — confirm callback either is synchronous, or wraps any post-event Supabase work in `setTimeout(fn, 0)`. Latent P0 across every host-protected page. Pairs with the Realtime cache-stale finding under Future Migrations: any auth-event-triggered `setAuth()` call must also be wrapped in `setTimeout(fn, 0)` to avoid the same lock.
- **Source:** https://supabase.com/docs/reference/javascript/auth-onauthstatechange + auth-js #762.

### Supabase `signUp()` returns obfuscated user when email is taken — never treat `data.user` alone as success
With "Confirm email" enabled (Memoria's default), `supabase.auth.signUp({ email, password })` returns `{ data: { user: <obfuscated>, session: null }, error: null }` even when the email already exists with a different password. The `user` object is fake (`obfuscated id`, `email_confirmed_at: null`, no real claims) — an anti-enumeration measure. Branching on `data.user != null` shows a "check your email" screen that will never deliver an email — silent UX fail.
- **Correct check:** treat success only when `data.session != null` (immediate sign-in path) OR `data.user.identities?.length > 0` (genuinely new user). An empty `identities` array signals email collision — render Hebrew error: `כתובת האימייל כבר רשומה — נסה/י להתחבר או לאפס את הסיסמה` with links to login + password-reset.
- **Source:** https://github.com/supabase/supabase/issues/33325 + https://supabase.com/docs/reference/javascript/auth-signup.

### Supabase PKCE `code` is single-use, 5-minute TTL — guard against React 18 Strict Mode double-mount
Magic-link / OAuth / password-reset callbacks deliver a `code` query param that `supabase.auth.exchangeCodeForSession(code)` accepts exactly once within 5 minutes. A second exchange — Strict Mode double-mount in dev OR a user refreshing the callback page — returns `invalid_grant` / `flow_state_not_found` and kills session setup. Symptom: "magic link works on desktop but fails after a phone refresh."
- **Pattern:** wrap the exchange in a `useRef`-guarded `didExchange.current` flag so Strict Mode's second mount is a no-op. Catch `invalid_grant` and render a recoverable Hebrew UI (`הקישור פג תוקף — בקש/י קישור חדש`) with a re-send link, NOT a terminal white screen.
- **Source:** https://supabase.com/docs/guides/auth/sessions/pkce-flow + https://supabase.com/docs/guides/auth/debugging/error-codes.

### StrictMode `useEffect` cleanup of the FIRST mount references the SECOND mount's locally-generated values (React #30835)
Confirmed React 18/19 dev-only bug: when StrictMode does its mount → unmount → remount stress test, the cleanup function for the "first" cycle does NOT close over the first mount's locally-generated values — it closes over the SECOND mount's. Concrete: `const id = generateUniqueId(); register(id); return () => unregister(id);` unregisters the SECOND id (which was never registered), and the FIRST registration silently leaks. Same trap for `URL.createObjectURL(blob)`, `new AbortController()`, `crypto.randomUUID()` correlation tokens, websocket client-IDs, performance-mark labels, and any per-mount unique value. Production runs each mount once and is unaffected, BUT dev sessions accumulate hundreds of MB of unrevoked blobs over a workday and Vite HMR slows / crashes mid-session — masking real cleanup defects.
- **Workaround patterns:** (a) derive the unique value from a STABLE source (props, `useMemo` keyed on stable input, parent-counter) — don't generate fresh inside the effect. (b) For unavoidable internal generation, lazy-init via `useRef`: `if (!ref.current) ref.current = createThing();` — first mount initializes, second mount reuses, cleanup gets the right value. (c) Stable channel names like `photos-${eventId}` (current Memoria pattern in CLAUDE.md §3.3) ARE correct — same string both mounts, same `removeChannel` target. **Never** name a Supabase channel `channel-${Date.now()}` or `channel-${crypto.randomUUID()}` — the first channel survives the double-mount in dev.
- **Memoria audit:** any `URL.createObjectURL` inside an effect (not just CameraCapture) — confirm either (a) the URL is owned by a parent that manages its lifecycle, or (b) the `if (!ref.current)` lazy-init guard is in place. Same for `AbortController` in the documented `profileReady` auth-race pattern. Pairs with the "Supabase PKCE single-use, 5-min TTL" pitfall above (same StrictMode root cause, broader scope). NOT fixed by upgrading to React 19 — open in 19 too.
- **Source:** https://github.com/facebook/react/issues/30835 + #25614 + #26315.

### Supabase JS v2 multi-tab refresh-token race — auto-mitigated by Web Locks; do NOT call `refreshSession()` manually
Supabase JS v2 has three layered defenses against the "two tabs both refresh the same refresh token, second gets `Invalid Refresh Token: Already Used` and signs the user out" race: (1) **Web Locks API** — supabase-js wraps token refresh in `navigator.locks.request('lock:gotrue:refresh', ...)` so concurrent calls in the same browser serialize; (2) **Foreground-only auto-refresh** — the timer pauses while `document.visibilityState !== 'visible'`, eliminating the race for idle background tabs; (3) **Server-side `GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL`** (~10s default on Supabase Cloud) — same refresh token presented twice within the window returns the SAME freshly-issued token both times. Memoria is a client-only Vite SPA → all three layers are active.
- **Rule:** DO NOT manually call `supabase.auth.refreshSession()` from any Memoria code path. The autorefresh + Web Lock combo handles it; manual calls race the lock and reintroduce the original race.
- **Residual failure mode** (auth-js #755 / supabase-js #1717, still open 2026): `supabase.auth.updateUser(...)` called during an in-flight refresh uses the OLD token, server marks the new token as already-used, downstream calls fail with `Invalid Refresh Token` until next refresh. Wrap host profile-update flows (password change, email change, display-name edit) in try/catch + on `Invalid Refresh Token` force a fresh `getSession()` then retry once.
- **Future Edge Functions / Node SSR** have NO Web Locks — implement an explicit mutex if multiple parallel handlers can refresh simultaneously. PrintStation kiosk mode (future) needs `wakeLock` API + OS sleep suppression — auto-refresh stops while the tab is hidden AND the lock screen breaks the session.
- **Source:** supabase/auth-js #755 + supabase-js #1717 + gotrue-js #213 + auth #466.

### Canvas-element pooling — iOS Safari has a hard ~288MB total-canvas-memory cap; `createElement('canvas')` in hot paths burns it
Each `<canvas>` element wraps a native (GPU- or Cairo-backed) pixel buffer outside the V8 heap; release lags V8 GC by hundreds of milliseconds. `document.createElement('canvas')` per-photo or per-frame allocates faster than the OS can free, and on iOS Safari hitting the ~288MB total-canvas-memory cap makes `getContext('2d')` return `null` with no thrown error — silent black composites mid-event.
- **Pattern:** small bounded pool keyed by `${width}x${height}`, `acquire(w, h)` returns a clean canvas (creates new if pool empty for that size, otherwise reuses), `release(canvas)` returns it. Clear with `canvas.width = canvas.width` (resets backing store + frees cached path data) — `clearRect` alone leaves stale pixels visible on next checkout. Bound the pool to ~6 canvases total with LRU eviction so we don't replace one leak with another.
- **Action:** build `src/utils/canvasPool.js`. Refactor `compositePngFrame.js` to acquire from the pool and `release()` in a `finally` block — never let a thrown error orphan a canvas. Use the same pool for the `stickerTextBitmapCache` offscreen canvases when that work lands (single shared pool, not two).
- **Where it applies to Memoria:** PrintStation evening with 50+ guests cumulatively allocates enough native canvas memory to plausibly hit Safari's cap → operator sees silent black composites with no JS error. Pairs with `setupCanvas(canvas, w, h)` DPR helper from the Performance Patterns Canvas-DPR entry — same `src/utils/` surface, complementary concerns.
- **Source:** https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/ + https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html.

### Supabase SSR session refresh + ISR / CDN caching = cross-user token leak (security incident class)
When `@supabase/ssr` (or any server route) refreshes a session, it emits `Set-Cookie` with the fresh access/refresh JWT on the response. If that response is then cached — Next.js ISR (`revalidate: N`), Vercel/Cloudflare/CloudFront edge cache, static export — every cache hit delivers User A's JWT to User B's browser, which stores it and is now silently signed in as User A. No client error; manifests as "random users see other people's events/photos/emails." This is a confidentiality breach, not a UX bug.
- **Memoria status:** Vite SPA today, NOT exposed (browser-only session refresh; CDN never sees Set-Cookie). The risk lands the moment any auth-touching server route does — magic-link callback moved to Edge Function, future SSR migration for SEO, MagnetLead email-invite handoff.
- **Rule:** any server-rendered or Edge-Function route that reads or refreshes a Supabase session MUST opt out of CDN caching (`export const dynamic = 'force-dynamic'`, or framework equivalent) AS PART OF THE PR THAT INTRODUCES IT. Never ship ISR / static export on auth-reachable routes. Edge Function clients MUST be created inside the request handler (`Deno.serve((req) => { const supabase = createClient(...); ... })`) — module-scope clients reused across warm-container requests leak sessions across users. Companion bullet for CLAUDE.md §5 Git & Deployment Discipline.
- **Source:** https://supabase.com/docs/guides/auth/server-side/advanced-guide + supabase/ssr #36 + supabase-js #1396.

---

## Performance Patterns
*updated: 2026-04-26T22:00Z*

### React 18 — Use `useSyncExternalStore` for external subscriptions; `useDeferredValue` for heavy filter inputs
*updated: 2026-05-06T06:00Z (subscribe/getSnapshot referential-stability rule promoted from research-scout)*

- `useSyncExternalStore` is the canonical hook for subscribing to external stores (`matchMedia`, scroll position, third-party event emitters, Supabase realtime). Plain `useState + useEffect` can tear during concurrent renders; `useSyncExternalStore` is tear-safe.
- `useDeferredValue` / `useTransition` mark state updates as low-priority so typing/filter UIs remain responsive while heavy lists re-render in the background.
- **Referential-stability rule (silent-failure prone):** the `subscribe` argument MUST be referentially stable — defined OUTSIDE the component or wrapped in `useCallback` with stable deps. Inline `subscribe={(cb) => ...}` causes React to call the OLD `unsubscribe` and re-`subscribe` on every render. On chatty external sources (Supabase realtime channels, scroll/resize listeners, `matchMedia`) this produces tear-down/setup loops, **silent realtime-event drops during the gap**, and in rare cases infinite re-render loops. The `getSnapshot` argument has a parallel rule: must return a referentially stable value when nothing changed (memoize/cache the snapshot — do NOT return a fresh object literal each call) — otherwise React thinks state changed every render and re-renders forever. Pair with `useDebugValue` to verify subscription lifecycle in DevTools.
- **Canonical shape for Memoria realtime refactor:** `const subscribe = useCallback((cb) => { const ch = supabase.channel(\`photos-\${eventId}\`).on(...).subscribe(cb); return () => supabase.removeChannel(ch); }, [eventId]);` — keyed on the SCOPED ID per CLAUDE.md §3.3, NOT broad deps. Inline `subscribe` arg goes into UI Anti-patterns.
- **Where it applies to Memoria:** wrap `useRealtimeNotifications` / `useEventGallery` Supabase channel getters in a `useSyncExternalStore`-backed hook (refactor not started as of 2026-05-06); wrap host-dashboard gallery filter query in `useDeferredValue` (measurable FPS win at >300 photos). New surfaces (PrintStation real-time queue, future MagnetReview live status) MUST follow the stable-subscribe shape from day one — the failure mode of "realtime works locally, drops events under load" is nearly impossible to diagnose after the fact.
- **Source:** https://react.dev/reference/react/hooks + https://react.dev/reference/react/useSyncExternalStore + https://www.epicreact.dev/use-sync-external-store-demystified-for-practical-react-development-w5ac0.

### Canvas 2D — Three compounding gotchas that crash tabs on Android
1. **Non-integer `drawImage(x, y)`** coords trigger sub-pixel resampling — wrap placement coords with `Math.floor()` before `drawImage`.
2. **Each loaded font family costs ~15MB of glyph-raster cache**, held for page lifetime. Memoria currently loads 9 display fonts for stickers (~135MB) on top of base canvas (~8MB per 1920×1080). Trim to minimum; lazy-load rest per sticker pack.
3. **`ctx.fillText(sameString, ...)` re-shapes every frame.** For static sticker text, render once to an offscreen canvas keyed by `(text, type, size)`, then `drawImage` the bitmap on subsequent frames.
- **Where it applies to Memoria:** `MagnetReview.drawSticker()` + the canvas sticker renderer — directly affects Sticker System v2 drag/rotate FPS.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas + https://www.mirkosertic.de/blog/2015/03/tuning-html5-canvas-filltext/.

### Canvas 2D — Mobile sharp-text requires DPR scaling AND `ctx.textRendering`
Two compounding issues blur sticker text and frame labels on iPhone (DPR=2) / high-DPR Android:
1. **devicePixelRatio scaling** — a `<canvas width=400 height=400>` rendered at 400×400 CSS px is silently downsampled. Backing store must be `W*dpr × H*dpr`, scale the context with `ctx.scale(dpr, dpr)`, keep CSS size at `W × H`. Wrap in a shared `setupCanvas(canvas, w, h)` helper in `src/utils/` so every new canvas surface (sticker composite, watermarks, future photo-prep pipeline) gets it for free.
2. **`ctx.textRendering`** (Baseline 2023) — default `auto` on mobile Safari leans toward speed and produces softer rasterization. Set `'geometricPrecision'` before any `fillText`/`strokeText` on rotated/transformed sticker layers; `'optimizeLegibility'` for static labels. Do NOT blanket-apply `geometricPrecision` to high-frequency redraw paths — `'optimizeSpeed'` there.
- **Where it applies to Memoria:** `MagnetReview.jsx` sticker composite, `compositePngFrame.js` PNG-frame compositor, future `CameraCapture.jsx` watermark pass. Pairs with the Canvas 2D non-integer drawImage gotcha above (DPR adds a second sub-pixel axis `Math.floor` alone doesn't fix) and with the OffscreenCanvas + ImageBitmap cache pattern below — DPR-scale the offscreen bitmap canvas too, or cached glyphs render blurry when composited onto the DPR-aware main canvas.
- **Source:** https://dev.to/pahund/how-to-fix-blurry-text-on-html-canvases-on-mobile-phones-3iep + https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textRendering.

### Canvas 2D — OffscreenCanvas + ImageBitmap cache for sticker text (~2× FPS on Android)
Two patterns for sticker UIs (Safari 16.4+, 2023): (1) **OffscreenCanvas** transfers rendering to a Web Worker via `canvas.transferControlToOffscreen()` — main thread no longer blocks on paint. (2) **Bitmap cache** — render each static sticker glyph once to an offscreen canvas keyed by `(text, fontFamily, size, fill, stroke)`, store the resulting `ImageBitmap` in an LRU `Map`, then `ctx.drawImage(cachedBitmap, x, y)` per frame instead of re-running `fillText` + `strokeText` (which re-shapes glyphs from scratch every frame). ~2× FPS on mid-range Android with ≥5 stickers on screen.
- **Memory hazard:** unmanaged `ImageBitmap` accounts for ~68% of canvas memory leaks — bound the cache (~100 entries LRU) and `bitmap.close()` on eviction. On component unmount, cleanup `useEffect` sees stale state — close via a shadow `ref` (same pattern as `pendingPhotosRef` in CameraCapture rules).
- **Action:** implement `stickerTextBitmapCache` in `MagnetReview.jsx` / `drawSticker()`. Defer the OffscreenCanvas + Worker tier until sticker count grows past ~15 on screen — Worker message passing + Safari <16.4 fallback complexity isn't justified for ≤10 stickers.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas + https://www.mirkosertic.de/blog/2015/03/tuning-html5-canvas-filltext/ + https://copyprogramming.com/howto/html-canvas-and-memory-usage.

### `useTransition` — keep input state OUTSIDE the transition; only wrap the heavy derived state
Three gotchas not covered by the `useDeferredValue` entry above:
1. **Double render cost** — every `startTransition` triggers two passes (immediate `isPending=true` with old state, then low-priority pass with new state). Wrapping trivial updates makes the component slower, not faster.
2. **Bail-out on fast typing** — if the user types again before the low-priority pass completes, React abandons it and restarts. Wrapping `setQuery` itself negates the feature: the input field lags.
3. **`isPending` stuck `true`** (known React 18.3 / 19 bug with `use()` + suspending components) — a permanent spinner is a real failure mode.
- **Canonical pattern:** `const [query, setQuery] = useState(''); const [results, setResults] = useState([]); const handler = (v) => { setQuery(v); startTransition(() => setResults(filter(v))); };` — input synchronous (outside), derived heavy state inside the transition.
- **Anti-pattern:** `startTransition(() => { setQuery(v); setFilteredList(filter(v)); })` — input field lags on every keystroke.
- **Defensive:** any `isPending` spinner UI must have a 10s safety-timer fallback that force-clears the spinner — same defensive pattern as the 6s AbortController cap in `profileReady` auth enrichment.
- **Where it applies to Memoria:** Dashboard gallery search, AdminDashboard lead search. Do NOT wrap `useRealtimeNotifications` / `useEventGallery` updates — those channels are latency-sensitive and the double-render compounds with canvas/sticker re-renders. Reserve for user-initiated filter/search surfaces.
- **`useDeferredValue` vs `useTransition`:** prefer `useDeferredValue` when the slow consumer is a downstream component reading a value; prefer `useTransition` when the slow producer is a setState call you own.
- **Source:** https://react.dev/reference/react/useTransition + https://www.charpeni.com/blog/dont-blindly-use-usetransition-everywhere + facebook/react #26814 / #28923.

---

## WebRTC Camera Rules (extends CLAUDE.md §3.6)
*updated: 2026-04-26T22:00Z*

### iOS Safari re-prompts for camera permission — treat as normal, not an error
iOS Safari intermittently re-prompts for `getUserMedia` permission on the same origin even after prior grant, with no domain/app version change. The `Permissions` API is NOT supported in Safari, so pre-checking permission state is unreliable.
- **Error handler:** detect `NotAllowedError` on iOS and render a Hebrew re-consent message ("Safari ביקש לאשר שוב גישה למצלמה — גע בסמל ההרשאות בשורת הכתובת") with a retry button. Do NOT terminal-state the UI.
- **Rule:** never gate camera UX on `navigator.permissions.query()` — treat re-prompts as recoverable.
- **Source:** https://discussions.apple.com/thread/256081579.

### `getSupportedConstraints` guard before rendering advanced camera controls
`navigator.mediaDevices.getSupportedConstraints()` reports which constraint *properties* the browser understands at the top level (`torch`, `zoom`, `focusMode`, `exposureMode`, `whiteBalanceMode` vary per browser/OS). This is distinct from `videoTrack.getCapabilities()` which reports per-track hardware support.
- **Rule (dual guard):** before rendering any advanced camera control (zoom slider, torch toggle, focus tap target), check BOTH `navigator.mediaDevices.getSupportedConstraints?.()?.<propName>` AND `videoTrack.getCapabilities?.()?.<propName>`. Render the control only when both are truthy.
- **Do NOT** polyfill via `webrtc-adapter` — added bundle weight not justified by our constraint surface.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia.

### iOS Safari: 2nd `getUserMedia()` silently mutes the prior track — `track.stop()` before re-acquire
On iOS Safari (all versions through 2026), calling `getUserMedia` again (e.g. to switch `facingMode` from `user`→`environment`) sets the previous track's `muted=true` with no programmatic unmute. Any UI still rendering the old track shows a frozen/black feed. Chrome/Firefox desktop and Android do NOT exhibit this behavior — iOS-specific (WebKit fingerprinting/privacy posture).
- **Pattern (camera-switch button):** `streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = await navigator.mediaDevices.getUserMedia(newConstraints);`
- **Or for simultaneous tracks:** branch from a single acquired stream via `MediaStream.clone() + addTrack/removeTrack` — never call `getUserMedia` twice.
- **Test gate:** must verify on a real iPhone before merging — desktop Chrome DevTools device emulation does NOT reproduce.
- **Where it applies to Memoria:** any future front/back toggle in `CameraCapture.jsx` (Share) or `MagnetCamera.jsx` (Magnet — currently environment-only). Not a current bug; ship the stop-before-reacquire pattern *before* the feature lands.
- **Source:** https://webrtchacks.com/guide-to-safari-webrtc/ + jeelizFaceFilter #15.

### iOS Safari standalone PWA mode breaks `getUserMedia` (silent camera failure on home-screen launch) — P0 for MemoriaMagnet
When a user adds Memoria to their iOS home screen and launches it in `display: standalone` mode (per `public/manifest.json`), WebKit silently refuses camera permission and `navigator.mediaDevices.getUserMedia()` fails as if no camera exists. The in-Safari-tab version works fine; only the home-screen-launched PWA mode is broken. Apple has not fixed this through 2026. Android Chrome PWAs are unaffected.
- **Memoria impact:** P0 for MemoriaMagnet — guests scan event QR → "Add to Home Screen" → launch home-screen icon → camera silently fails → empty print queue. Also affects any MemoriaShare guest that adds the site to their iOS home screen before uploading.
- **Detection:** `(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) && /iPhone|iPad/.test(navigator.userAgent)`.
- **Action:** on Magnet guest page / Share upload page, when standalone iOS detected, render a Hebrew banner: `פתח/י את הדף ב-Safari (לא מהקיצור במסך הבית) כדי לאפשר גישה למצלמה` with a "העתק קישור" button. Consider switching `manifest.json` `display` to `browser` or `minimal-ui` for Magnet guest routes specifically (PM call — trades PWA chrome for a working camera).
- **Source:** https://developer.apple.com/forums/thread/89981 + simicart.com/blog/pwa-camera-access.

### iOS Safari randomizes `deviceId` per page load — never persist camera selection by ID
WebKit fingerprinting-resistance regenerates `MediaDeviceInfo.deviceId` on every page load. Storing a chosen `deviceId` in localStorage / Supabase profile for "remember my camera choice" is a no-op on iOS — the saved ID is invalid next session and `getUserMedia({ video: { deviceId: { exact: saved } } })` throws `OverconstrainedError`. Chrome/Firefox desktop + Android persist deviceIds across sessions on the same origin after permission is granted; only iOS Safari randomizes.
- **Rule:** select cameras by `facingMode: 'user' | 'environment'` (current Memoria pattern in `CameraCapture.jsx` + `MagnetCamera.jsx` — correct), or `enumerateDevices()` fresh on every mount and match by `label` + `kind` substring. NEVER write `deviceId` to a persistent profile / localStorage / Supabase as a "preferred camera."
- **Source:** https://webrtchacks.com/guide-to-safari-webrtc/ + webrtc-developers.com/managing-devices-in-webrtc.

### iOS Safari revokes camera permission on URL change — never navigate between camera and review screens (WebKit bug 215884)
WebKit bug 215884 (open since 2020, confirmed active 2026): on iOS Safari, URL changes that the engine classifies as a navigation can revoke the in-memory camera permission grant and force a re-prompt on the next `getUserMedia()`. PWAs in standalone mode are particularly aggressive — hash changes alone trigger revocation. Distinct from the standalone-PWA-camera-fails finding above: that one is "camera silently fails in PWA chrome with no prompt"; this one is "camera works but permission resets on URL change in normal Safari and standalone PWAs alike."
- **Rule:** never wrap a `<video>`-active camera surface in a route that the in-session UX navigates AWAY from and back. Camera capture, review, and resend MUST live in ONE component with internal mode state (`mode === 'capture' | 'review' | 'sent'`) — no `useNavigate()` between phases. The `MagnetCamera → MagnetReview` handoff per CLAUDE.md project map is described as "delegates" — verify in code that this is in-component delegation, not a route navigation. Every iOS guest who takes a 2nd photo via a route boundary re-grants camera permission, and may compound with the "2nd `getUserMedia()` mutes prior track" gotcha.
- **Also:** stream a single combined `{ audio: false, video: {...} }` constraint — never call `getUserMedia({audio})` then `getUserMedia({video})` (two prompts, not one).
- **Test:** real iPhone, take photo → tap "צלם שוב" / back-to-camera → MUST NOT re-prompt for permission. Cannot reproduce on desktop or DevTools emulator.
- **Source:** https://bugs.webkit.org/show_bug.cgi?id=215884 + https://developer.apple.com/forums/thread/669011.

### Capture canvas dimensions come from the live stream, not the constraint object
Mobile cameras report sensor resolution in landscape (e.g. 1920×1080); the OS rotates frames before delivery, so a portrait-held device produces a 1080×1920 stream. `getUserMedia({ video: { width: { exact: 1920 }, height: { exact: 1080 } } })` throws `OverconstrainedError` in portrait. `ideal` silently returns the rotated dimensions instead — but any downstream code that sized its capture canvas from the constraint object then draws stretched/letterboxed/misaligned outputs. Worst case: changing orientation mid-session re-emits device events and stream resolution silently flips, tearing the live preview.
- **Rule:** ALWAYS use `ideal` (never `exact`) for `width`/`height` on mobile. Read actual dimensions from `videoTrack.getSettings()` AFTER stream acquisition, OR use `videoRef.current.videoWidth` / `videoHeight` for DOM-level measurements (these already reflect post-rotation values). Drive canvas sizing and frame compositing from those — never from the constraint object.
- **Memoria audit:** confirm `MagnetCamera.jsx` + `CameraCapture.jsx` capture canvases are sized from `videoRef.current.videoWidth/videoHeight`, not from constants. `compositePngFrame.js` must handle BOTH orientations or gate to portrait-only — naive landscape assumption silently produces "frame corners covering faces" on portrait sources.
- **Subscribe to `orientationchange`** or a ResizeObserver on the video element and re-measure after rotation. Test path: rotate an iPhone mid-session in MagnetCamera and verify the preview still fills without black bars.
- **Source:** https://webrtchacks.com/getusermedia-resolutions-3/ + https://webrtchacks.com/guide-to-safari-webrtc/.

---

## Future Migrations / Hardening Follow-ups
*updated: 2026-05-06T06:00Z (Supabase Data API public-schema GRANT requirement promoted from research-scout — HIGH PRIORITY)*

### Supabase platform default change — `public` schema NO LONGER auto-exposed to Data API / GraphQL (HIGH PRIORITY, hard date 2026-10-30)
**Platform-wide breaking change rolling out across 2026:** Supabase removes the implicit grant that exposes `public` schema tables to the Data API (PostgREST) and GraphQL. Timeline:
- **2026-04-28** — opt-in available on new projects.
- **2026-05-30** — becomes DEFAULT for all NEW projects.
- **2026-10-30** — applied to ALL EXISTING projects, including Memoria's prod.

After Oct 30, every NEWLY-CREATED table in `public` requires explicit `GRANT ... ON TABLE <name> TO anon, authenticated;` (and matching `GRANT USAGE ON SEQUENCE` if applicable) before `supabase.from('<name>').select(...)` returns anything other than an empty result / 404. **Existing tables are grandfathered**, but new tables silently invisible to PostgREST. Failure mode is identical to a missing RLS SELECT policy (no rows, no error) — will be misdiagnosed as RLS unless the team already knows about this default. Pairs with the 2026-platform-default Realtime entry below — same pattern of "new project defaults that don't match what we built against."

**Memoria impact:** entire data layer is `supabase.from('<public_table>')` calls via `memoriaService` (CLAUDE.md §2 hard rule). Any post-Oct-30 schema work — and `print_queue` / `magnet_orders` / `magnet_events` are still on the MagnetMagnet v2 roadmap per `project-memory.md` — will silently break in dev/prod unless the migration includes the explicit grants.

**RULE (load-bearing — add to CLAUDE.md §6 migration template):** every `CREATE TABLE` migration in `public` MUST include both lines in the SAME migration file:
```sql
CREATE TABLE public.<name> (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<name> TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<name> TO anon;  -- only when guest read-paths require it
ALTER PUBLICATION supabase_realtime ADD TABLE public.<name>;  -- existing rule, line 599
```
Sequence grants (`GRANT USAGE ON SEQUENCE public.<name>_id_seq TO authenticated;`) when the table uses a serial/identity PK with client-side INSERT.

**Pre-Oct-30 audit task:** enumerate any tables added to `public` between 2026-05-30 and 2026-10-30 and verify they have explicit grants — these are the silent-break risk window. New project provisioning (staging, branch DBs) after 2026-05-30 will hit this immediately, not in October.

**Source:** https://supabase.com/changelog + https://releasebot.io/updates/supabase.

### Future Migrations / Hardening Follow-ups (other entries below)

These are validated opportunities that are not actionable today but should be remembered when the relevant migration or hardening pass is scoped.

### iOS Safari address-bar collapse — switch `min-h-screen` → `min-h-dvh` on page roots (actionable today on v3.4)
CSS dynamic viewport units (`dvh` / `svh` / `lvh`) reached Baseline Widely Available June 2025 and Tailwind v3.4+ already ships `h-dvh` / `h-svh` / `h-lvh` / `min-h-dvh` etc. — no config change. `vh` resolves to `lvh` (chrome-collapsed) on iOS Safari, so `min-h-screen` cuts off the bottom CTA by the address-bar height on first paint. Bulk-replace `min-h-screen` → `min-h-dvh` on `MagnetLead`, `EventSuccess`, `MagnetGuestPage`, `Home`, `CreateEvent`, `Dashboard`, `EventGallery` page roots. Use `min-h-svh` for tightly-sized centered forms (login, 1-step modals) where growth would push the card off-center when chrome hides. Camera screens (`fixed inset-0` per CLAUDE.md §3.6) are insulated — leave them. Continue using `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + Npx)` for floating bottom bars (the viewport-unit swap complements but does not replace safe-area insets). Add to UI Anti-patterns: bare `h-screen` / `min-h-screen` on iOS-reachable surfaces.
- **Source:** https://ishadeed.com/article/new-viewport-units/ + https://tailscan.com/blog/tailwind-css-dynamic-viewport-unit-classes.

### RTL logical inline-axis utilities (`ms-*` / `me-*` / `ps-*` / `pe-*` / `start-*` / `end-*`) — actionable today on v3.4
Tailwind v3.3+ ships logical-property inline-axis utilities mapped to `margin-inline-start`/`-end`, `padding-inline-start`/`-end`, `inset-inline-start`/`-end`. They auto-flip based on the nearest `dir="rtl"` ancestor — `ms-4` becomes `margin-right` in RTL, `margin-left` in LTR, no per-component `rtl:` overrides needed. Border-radius logical equivalents `rounded-s-*` / `rounded-e-*` / `rounded-ss-*` / `rounded-se-*` / `rounded-es-*` / `rounded-ee-*` and border-side `border-s-*` / `border-e-*` also flip automatically. Block-axis utilities (`mt-*` / `mb-*` / `pt-*` / `pb-*` / `top-*` / `bottom-*`) are unchanged — top/bottom is the same regardless of script direction.
- **Why it matters for Memoria:** the entire UI is Hebrew RTL (per CLAUDE.md "ALL user-facing UI text in Hebrew (RTL)"), so every physical-axis horizontal class authored from a left-to-right mental model is a latent bidi bug. A "leading" gold accent meant for the start edge that's coded `ml-*` ends up on the visual left in RTL — wrong side. Logical utilities make bidi-correctness automatic.
- **Rule (add to CLAUDE.md §3.1 or new §3.7 "RTL & Bidi Correctness"):** for every horizontal-axis spacing/positioning/border-radius utility, prefer the logical equivalent: `ms-*` over `ml-*`, `me-*` over `mr-*`, `ps-*` over `pl-*`, `pe-*` over `pr-*`, `start-*` over `left-*`, `end-*` over `right-*`, `rounded-s-*` / `rounded-e-*` over `rounded-l-*` / `rounded-r-*`, `border-s-*` / `border-e-*` over `border-l-*` / `border-r-*`. Reserve physical classes only when a visual-LTR effect is specifically required regardless of script direction (rare in Memoria).
- **Add to UI Anti-patterns:** physical-axis horizontal classes on Hebrew UI surfaces — use logical inline-axis equivalents so layout flips correctly under `dir='rtl'`.
- **Refactor strategy:** opportunistic — on any Hebrew-RTL component touch, swap physical→logical for that component. Do NOT bulk-sed across the codebase — risk of breaking RTL-corrected `rtl:` modifier pairs already done by hand. New surfaces (PrintStation operator dashboard, AdminDashboard CRM expansions) START with logical utilities, never `ml-*` / `mr-*` first-draft. Pairs with the existing `<bdi>` numeral guidance — both are bidi-correctness rules at different layers (this one layout, that one text).
- **Source:** https://tailwindcss.com/blog/tailwindcss-v3-3 + https://flowbite.com/docs/customize/rtl/ + tailwindlabs/tailwindcss#10166.

### Tailwind one-off arbitrary breakpoints `min-[Npx]:` / `max-[Npx]:` (v3.4 — actionable today)
For iPhone-SE (375px), PrintStation kiosk (1600px+), and other true outliers that don't fit `sm:`/`md:`/`lg:`, Tailwind v3.2+ supports inline arbitrary variants: `min-[375px]:text-sm max-[600px]:bg-card`. No `tailwind.config.js` `screens` extension needed. `max-md:` (desktop-first override) is also supported. Always use `px` (matches existing `@screen` values), never mix `rem` + `px` — generated utilities sort in unexpected order. Constraint: do NOT use as a replacement for the standard `md:`/`lg:` ladder — only for true outliers.

### Tailwind stacked range variants `md:max-lg:*` for single-breakpoint bands (v3.4 — actionable today)
For tablet-only / lg-only styling, stack a `max-*` variant after the breakpoint: `md:max-lg:text-sm` applies from md through pixel-before-lg and is reset above lg. Pure CSS, zero runtime cost — replace `useWindowSize` JS branching for `EventCard` grid count, `AdminShell` sidebar width, `PrintStation` queue density on the next layout touch. Different from the `min-[Npx]:` / `max-[Npx]:` arbitrary-value variants — those are for one-off pixel thresholds; stacked range is for the standard breakpoint ladder. Add a one-line note under CLAUDE.md §3.1 Mobile-First Design: "for single-breakpoint bands (e.g. tablet-only), prefer stacked range variants `md:max-lg:*` over JS-side `useWindowSize`."

### Tailwind v4 — multi-improvement migration block (when we migrate from v3.4)
*updated: 2026-05-11T18:00Z (config.js removal + bg-gradient-to rename + border-color default change added from research-scout nightly hunt #1)*

When v4 is scoped, audit and apply together rather than in scattered passes:
- **STEP 0 (P0, do FIRST in the migration PR) — `darkMode` config key is REMOVED in v4.** v3's `darkMode: 'class'` is silently a no-op after migration; every `dark:` utility flips to its v4 default `prefers-color-scheme: dark` media-query mode. Without explicit migration, `<html class="dark">` no longer activates dark utilities — the design system silently follows the OS theme. The fix is one CSS line in `src/index.css` alongside `@import "tailwindcss"`: `@custom-variant dark (&:is(.dark *));` (or `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` for an attribute-based selector). **This protects the locked Memoria brand palette (CLAUDE.md §0.6 "Every dark page root MUST include the `dark` class") — forgetting this line re-introduces the 2026-04-16 silvery-gradient bug.** Failure mode is invisible during local dev IF the dev's OS is set to dark mode (`prefers-color-scheme: dark` makes `dark:` styles apply by accident). **Pre-merge checklist for the v4 migration PR:** force-toggle OS to LIGHT mode and verify dark surfaces still render dark. Add a CSS comment after the variant line: `/* DO NOT REMOVE — v3 darkMode:'class' equivalent. CLAUDE.md §0.6 brand-locked. */`.
- **STEP -1 (PRE-MIGRATION GATE) — v4 minimum browser support: Safari 16.4+ (Mar 2023) / Chrome 111+ (Mar 2023) / Firefox 128+ (Jul 2024).** v4 leans on `@property`, `color-mix()`, native cascade layers, and native `@container` — none polyfill cleanly. Browsers below the cutoff render an **un-styled page** (no graceful degradation). v3.4 by contrast supports back to ~Safari 14 / Chrome 88. Memoria's audience is Israeli wedding/bar-mitzvah/birthday guests scanning QR codes on whatever phone they own — including older iOS devices still on Safari 15.x (iOS 15, last release for iPhone 6s/7/SE-1). **Required pre-PR check:** pull a Vercel Analytics / Plausible report on Safari version distribution from the last 30 days. If iOS Safari <16.4 is **>2% of guest sessions**, defer the migration OR ship a v3.4 fallback bundle. The failure mode lands at the worst possible moment — a guest scans the QR, the camera flow renders un-styled, and the moment is unrecoverable. Pairs with the STEP 0 dark-mode gotcha — both are "looks fine in dev, silently breaks in prod for a slice of users."
- **STEP 1 — `tailwind.config.js` is ENTIRELY REPLACED by a CSS `@theme` block in `src/index.css` (no JS config file is processed by v4).** Memoria's config owns: custom animations (`animate-paper-fly`), extended color palette (`cool-950`, brand tokens), `shadow-indigo-soft` utility, and `fontFamily` extensions (`heebo`, `playfair`) — all locked by CLAUDE.md §0.6 Design Language. The official codemod converts ~90% automatically to `@theme { --color-cool-950: ...; --animate-paper-fly: ...; ... }` entries, but custom `plugins:` blocks need manual conversion. **Pre-migration procedure:** run `npx @tailwindcss/upgrade` as a STANDALONE commit ("chore: migrate config to @theme") before any feature work — easier to review and bisect. PostCSS config simultaneously switches from `plugins: { tailwindcss: {} }` to `plugins: { '@tailwindcss/postcss': {} }`.
- **STEP 2 — `bg-gradient-to-*` utilities renamed `bg-linear-to-*` in v4 (CSS-native linear-gradient naming).** Memoria's brand palette uses `bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950` on EVERY page root and in the radial-glow recipe (CLAUDE.md §0.6 — brand-locked). Without the codemod, **all page-root gradients silently disappear** on v4 upgrade — every page renders as a flat block with no gradient, breaking the locked brand visual. The codemod handles this rename automatically. **Post-codemod verification gate:** `grep -r "bg-gradient-to" src/` MUST return zero results after migration. Also covers: `bg-radial-*` and `bg-conic-*` directional variants follow the same new naming convention.
- **STEP 3 — Default border color changed from `currentColor` (inherited text color) to `--color-gray-200` in v4.** Any bare `border`, `border-t`, `divide-*` etc. that relied on text-color inheritance now renders `gray-200` (light) instead. On Memoria's dark surfaces this is subtle but violates the brand hairline spec (`rgba(255,255,255,0.07)` per CLAUDE.md §0.6). The codemod does NOT auto-fix this — it's a semantic behavior change. **Post-codemod audit:** grep `className="[^"]*\bborder\b[^"]*"` in `src/` and confirm every bare `border` carries an explicit `border-{color}` or `border-border` companion; if not, add `border-border` (which maps to the brand hairline token).
- **`scheme-dark` utility** — adds to `<body>` to force native chrome (scrollbars, form inputs, system dialogs, date pickers) into dark mode. Eliminates the silvery light-scrollbar paper-cut. One-line fix.
- **Native `@container` queries** (`tailwindcss-container-queries` plugin no longer required in v4) — convert `EventCard`, `MagnetEventCard`, KPI tiles, `PrintStation` queue cards from viewport breakpoints (`md:`/`lg:`) to `@container`. Fixes the "card looks great in grid, breaks in sidebar" failure mode without per-context wrapper overrides. **Note (clarified 2026-05-06):** the v4 native `@container` is a *simplification* (no plugin needed) — the *capability* is available TODAY on v3.4 via the official `@tailwindcss/container-queries` plugin (Tailwind Labs, v3.2+). Don't gate adoption on the v4 migration if you have a real parent-vs-viewport sizing pain. **Current Memoria recommendation:** do NOT adopt the plugin yet — present pain is iPhone-SE narrow widths (handled via `min-[Npx]:` arbitrary variants per the entry above), not parent-vs-viewport mismatch. Re-evaluate when `PrintStation` ships kiosk-side cards in variable sidebar widths. **NEVER set `container-type: size`** on content-sized cards — forces block-axis containment and collapses auto-height to 0 (storybook fixed-height looks fine, in-grid breaks). Keep the `inline-size` default. Only use `size` on fixed-height wrappers that truly need `@height-*` variants. **Same gotcha applies on the v3.4 plugin** — never use `@container/{name}/size`, default `inline-size` only. Add a migration PR checklist item: "no `container-type: size` on content cards."
- **v4.1 utilities** — `user-valid:` / `user-invalid:` variants apply styles only AFTER user interaction; replace JS-side `touched` form-validation tracking in `MagnetLead` 4-step wizard + `CreateEvent`. `text-shadow-2xs` … `text-shadow-lg` for sticker preview / cover-image labels (currently requires custom CSS or plugins). `mask-*` utilities for cover-image fade-out treatments in `MagnetGuestPage`. `wrap-break-word` cleanly breaks long Hebrew words / URLs inside cards. Safe alignment (`justify-start-safe`, `items-center-safe`) prevents flex/grid children from overflowing when content exceeds the track — may fix existing overflow bugs without bespoke `min-w-0` workarounds.
- **Source:** https://tailwindcss.com/blog/tailwindcss-v4-1 + https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/ + https://tailwindcss.com/docs/upgrade-guide + https://github.com/tailwindlabs/tailwindcss-container-queries.

### React 19 + Compiler v1.0 — bundled migration (when React 19 is scoped)
*updated: 2026-05-06T06:00Z (useEffectEvent stable-in-19.2 details + audit-grep promoted from research-scout)*

React Compiler shipped stable Oct 2025 (Babel/SWC plugin, build-time). Replaces almost all manual `useMemo` / `useCallback` / `React.memo` with finer-grained auto-memoization. Real-world Meta Quest Store: +12% initial load, +2.5× interaction speed, neutral memory. Bundle React 19 upgrade WITH Compiler adoption — don't run on React 18 (too much churn for one-version lifespan). Pre-req audit: run `eslint-plugin-react-compiler` on a branch to surface Rules-of-React violations (non-pure render, mutation-during-render) — fixing these is valuable BEFORE Compiler. Post-adoption, delete manual hooks only where the linter confirms compiler handled it (don't bulk-strip). Keep `useMemo` / `useCallback` as documented escape hatches.
- **Same migration unlocks `useEffectEvent` (stable in React 19.2)** — graduated from experimental. Lets you extract non-reactive logic out of an Effect: the returned event callback always sees the latest props/state on every render but does NOT count as a dependency, so the Effect never re-runs because of values used only inside the event. **Hard rules:** declare ONLY at top level of a component; NEVER pass to children/hooks/refs (it's tied to the declaring component's render). Replaces the `useRef`-shadow boilerplate currently used in `useRealtimeNotifications`, `useEventGallery`, and `CameraCapture` cleanup (e.g. `pendingPhotosRef` pattern in CLAUDE.md §3.6 ObjectURL lifecycle rule). **Migration audit when 19.2+ lands:** `Grep -r "Ref = useRef" src/hooks src/components/magnet` and migrate refs whose ONLY purpose is "see latest value inside an effect cleanup" to `useEffectEvent`. **Skip refs whose purpose is identity stability** (canvas pooling, `AbortController` carriers, the `pendingPhotosRef` shadow specifically when its job is to survive unmount cleanup capture) — `useEffectEvent` is wrong for those. Also pair with the `useSyncExternalStore` subscribe-stability rule under §Performance Patterns: realtime channel handlers that today use `useRef` to read stale `eventId` / `userId` get cleaner with `useEffectEvent`.
- **Do NOT introduce `useEffectEvent` in the codebase yet** — CLAUDE.md §2 hard-locks React 18; the hook does not exist there and would not type-check.
- **Compiler does NOT auto-insert `useTransition`** — that hook remains a manual decision (see Performance Patterns entry on `useTransition` for the canonical "input outside, derived state inside" pattern).
- **Source:** https://react.dev/blog/2025/10/07/react-compiler-1 + https://react.dev/learn/separating-events-from-effects + https://react.dev/reference/react/useEffectEvent.

### Supabase Realtime cache + RLS — `setAuth()` for mid-session policy/claims changes
Realtime caches its access-policy snapshot per-client at two moments only: (a) channel-subscribe time, (b) `realtime.setAuth(jwt)` call. Between those events, the server evaluates inbound WAL changes against the CACHED policy — NOT the live policy. Consequence: if an admin runs `ALTER POLICY` / `DROP POLICY ... CREATE POLICY`, every currently-connected subscriber continues to see events filtered by the OLD policy until reconnect or JWT rotation. Same applies to role/claim changes (e.g. promoting a user to admin mid-session). Symptom: "I updated the RLS in SQL and it works in queries, but my dashboard still doesn't see new rows." Fix is page reload OR a forced `setAuth()`.
- **NOT actionable today** — no Memoria workflow currently depends on live RLS / claim changes.
- **When scoped:** host tier upgrades or mid-session admin promotion must include an explicit `supabase.realtime.setAuth(jwt)` call in the flow — don't rely on the next JWT auto-refresh (up to 1h). Pairs with the `onAuthStateChange` deadlock pitfall: if `setAuth` is called from an auth event handler, wrap it in `setTimeout(fn, 0)` to sidestep the auth-lock re-entrancy bug.
- **Source:** https://supabase.com/docs/guides/realtime/authorization + https://supabase.com/docs/reference/javascript/v1.

### Supabase `getClaims()` — local JWT verification (vs. `getUser()` server round-trip)
`supabase.auth.getClaims()` (paired with Supabase's asymmetric JWT signing keys, 2025) verifies the access-token JWT locally against the cached `/.well-known/jwks.json` — no Auth-server round-trip per call. `getUser()` always hits the Auth server (DB query). `getSession()` reads localStorage with NO server-side validation and is unsafe to trust as identity. Switching the per-render identity check in `@/lib/AuthContext` from `getUser()` to `getClaims()` would eliminate one Auth-server round-trip per protected page navigation — meaningful at scale and on slow mobile.
- **Action plan:** (1) Audit `@/lib/AuthContext` to confirm which method is currently called; if `getUser()` runs on every protected mount, plan a swap to `getClaims()` (keep `getUser()` only for the post-login refresh path). (2) When Edge Functions are introduced, default to `getClaims()` for caller verification. (3) **Pre-req:** confirm Memoria's Supabase project has migrated to **asymmetric** JWT signing keys (Project Settings → JWT Keys) — `getClaims()` requires this.
- **Source:** https://supabase.com/docs/reference/javascript/auth-getclaims + https://supabase.com/docs/guides/auth/signing-keys.

### New Supabase Project Setup — Realtime 3-step gate (2026 platform default change)
2026 platform default: Realtime is DISABLED by default on NEW projects. Existing projects (Memoria's production included) are unaffected — this is forward-looking, not breaking. But: any staging / preview / branch project Efi spins up will have Realtime off, and every realtime-dependent dev flow will appear broken until enabled. Before any `postgres_changes` subscription works, verify (a) Realtime enabled in Project Settings → API → Realtime, (b) target table in `supabase_realtime` publication via `ALTER PUBLICATION supabase_realtime ADD TABLE <name>`, (c) table has a PERMISSIVE SELECT RLS policy covering the subscription filter scope (per the Common Pitfalls entry on RLS-filtered Realtime).
- **When adding** `print_queue` / `magnet_orders` / `magnet_events` to the schema (pending MagnetMagnet v2 work per project-memory.md), include the `ALTER PUBLICATION supabase_realtime ADD TABLE ...` line in the SAME migration as `CREATE TABLE` — don't rely on automatic membership, even on the existing prod project.
- **Realtime Broadcast/Presence** has its own separate enable flag on new projects.
- **Source:** https://supabase.com/blog/supabase-security-2025-retro + https://supabase.com/changelog.

### Tailwind v4 — `scheme-dark` utility (when we migrate from v3.4)
*(Subsumed into the Tailwind v4 multi-improvement migration block above as of 2026-04-26 promotion. Retained as a stub for backlinks.)*

### Supabase realtime — private channels with RLS on `realtime.messages`
Realtime Broadcast/Presence Authorization on private channels requires `@supabase/supabase-js ≥ v2.44.0`. Memoria is on v2.101.1 — capability is unlocked. Current `useRealtimeNotifications` / `useEventGallery` use public channels filtered by `event_id`. For share events requiring authenticated-host-only realtime visibility, private channels + RLS policy on `realtime.messages` would be a stronger security posture. Tracked as a hardening follow-up — not urgent.

---


## New Learnings (research-scout nightly — pending review)
*Last refreshed: 2026-05-11T22:00Z (nightly hunt 5-topic comprehensive sweep added 1 finding; saturation continues but Tailwind dark-mode + portal axis surfaced a latent silent-fail in shadcn modals) — also 18:00Z hunt #1 added 2 findings (Supabase signOut global-default + iOS PWA 100dvh cold-start contradiction) + 3 Tailwind v4 breaking-change facts promoted DIRECTLY to v4 migration block (config.js removal, bg-gradient-to rename, border-color default) | Next review: 2026-05-12*

> Nightly hunt 2026-05-11T18:00Z (3-topic React/Tailwind/Supabase sweep — hunt #1) added: (1) Supabase `auth.signOut()` defaults to `scope: 'global'` — silently kills user's sessions on every device; AND has known hang/silent-fail modes (auth-js #936 hangs on success, auth-js #902 doesn't fire SIGNED_OUT on other instances, community #31017 `scope: 'local'` sometimes behaves as global, auth #2036 multi-session local-scope still invalidates all). Memoria's Dashboard.jsx + AdminDashboard.jsx sign-out flows need `{ scope: 'local' }` explicit + 8s Promise.race timeout + manual UI state-clear instead of relying on `onAuthStateChange` SIGNED_OUT round-trip. (2) iOS Safari PWA standalone mode: `100dvh` / `min-h-dvh` REPORTS WRONG VALUES on cold start — only `100vh` / `min-h-screen` resolves correctly on first paint; `100dvh` self-corrects only after a portrait→landscape→portrait rotation cycle. Partial CONTRADICTION of the existing §Future Migrations entry recommending bulk `min-h-screen → min-h-dvh` swap — for routes likely to be installed as home-screen PWAs (MagnetGuestPage in particular per the existing standalone-PWA-camera-fail entry), the dvh swap may regress cold-start layout. Pending real-device measurement before promoting either way. Skipped duplicates: (React) useEffect dep arrays, useState top-level rule, useMemo over-use (all generic); useSyncExternalStore tearing fundamentals (already in §Performance Patterns with subscribe-stability rule); useDeferredValue "fresh object every render causes background re-renders" (minor extension to existing useTransition/useDeferredValue entry, not a silent-fail class). (Tailwind) RTL via `dir="rtl"` ancestor + `rtl:` modifier (already covered in §Future Migrations logical inline-axis entry); foldable Z Fold 7 / ultra-wide 3xl/4k breakpoints (Memoria targets event-guest mobile per existing skip pattern); breakpoint unit consistency rem vs px (already in §Future Migrations Tailwind one-off arbitrary breakpoints entry); mobile-first base/sm: distinction (CLAUDE.md §3.1); viewport-fit=cover meta-tag requirement (foundational — must be verified in `index.html` as part of the 100dvh PWA finding above, but not a separate gotcha). (Supabase) cookieOptions removed in v2 createClient (Memoria is Vite SPA browser-only — N/A; SSR-only concern); persistSession localStorage fallback (default behavior, not actionable); session-not-persisting-after-refresh (Next.js SSR-only, N/A). Yield ratio: 2 stored from 3 topics (~66%) — both findings extend existing categories. signOut → pair with existing Web Lock orphan in §Common Pitfalls; 100dvh PWA → caveat on existing §Future Migrations dvh entry. High-yield axes remain auth-flow edges and PWA standalone semantics.

> Nightly hunt 2026-05-11T22:00Z (5-topic comprehensive sweep — React/Tailwind/Supabase/Canvas/WebRTC) added: (1) Tailwind dark-mode `dark` class on a wrapper div is BYPASSED by Radix/shadcn portals — every shadcn Dialog/AlertDialog/Popover/Tooltip/Select/Sheet in Memoria today renders LIGHT-themed because portals mount to `document.body`, outside the `dark` wrapper on individual page roots. Confirmed by inspection: `index.html` has bare `<html lang="he">` (no `dark` class), and Home.jsx / MyEvents.jsx / MagnetLead.jsx / AdminShell.jsx / MagnetLead.jsx all place `dark` on the page-root `<div>`. Fix: hoist `dark` to `<html>` (either statically in `index.html` or via `document.documentElement.classList.add('dark')` in a top-level mount). Pairs with §0.6 Dark-Mode Activation MANDATORY rule — that rule says the `dark` class MUST be present but doesn't specify WHERE; the where matters for portals. Skipped duplicates: (React) useEffect dumping-ground / StrictMode warnings on useDeferredValue/useTransition (speculative blog, no upstream signal) / standardized useForm hook (speculative future direction) — all generic, no data. (Tailwind) v4 `@custom-variant` darkMode config replacement (already in v4 migration block STEP 0); variant stacking order `md:dark:hover:` (already skipped 2026-05-07T22:00Z — not a silent-fail axis); class vs media-query "pick one source of truth" (already aligned with §0.6 — Memoria explicitly chose class). (Supabase) Data API public-schema GRANT Oct 30 2026 (already in §Future Migrations HIGH PRIORITY); RLS+grants separate layers (foundational, already implicit); Realtime RLS row-filtering (already in §Common Pitfalls); OAuth `/v1/oauth/token` 201→200 (already skipped multiple cycles — supabase-js abstracts). (Canvas) iOS 384MB pool + 46-simultaneous-2D-canvas ceiling (already in pending-verification CONTRADICTION entry; 46-count is a consequence of the 384MB cap at ~8MB per 1920×1080, not a separate axis); batch rendering 95% improvement / `Math.floor(drawImage)` / GC lag for canvas (all in §Performance Patterns). (WebRTC) iOS 14 audio+video OverconstrainedError two-prompt (already in §WebRTC Camera Rules line 573 — Memoria uses `audio: false` and combined constraints); cross-origin iframe `allow="camera;microphone"` (Memoria runs on own origin, not iframed — N/A); iOS 14.3 WKWebView baseline (operational metadata); WebKit bug 252465 "video element can't play stream in PWA standalone" (same user-visible symptom + same mitigation as already-documented 185448 — augmenting source list of existing entry would be the right action, NOT a new entry). Yield ratio: 1 stored from 5 topics (~20%) — saturation high but the dark-mode portal axis is a real latent UX bug visible to any user who triggers an AlertDialog/Sheet/Popover today (silent light-themed modal on dark page).

> Nightly hunt 2026-05-08T22:00Z (5-topic comprehensive sweep — React/Tailwind/Supabase/Canvas/WebRTC) added: (1) Supabase legacy `anon`/`service_role` JWT keys deprecated end of 2026 — replaced by non-JWT `sb_publishable_*` / `sb_secret_*` keys. **Critical migration trap:** new keys CANNOT go in the `Authorization` header (not JWTs); must remain in `apikey` header, with user-session JWT (or empty) in `Authorization`. Memoria's direct-`fetch` storage upload pattern (`memoriaService.storage.uploadCoverImage()`, lines 273-285) sets BOTH headers explicitly today — that pattern survives migration UNCHANGED for Authorization (always was the user JWT) but the `apikey` value swap is what flips. Skipped duplicates: (React) useEffect dep arrays, hooks-rules, useMemo over-use, Strict Mode double-invoke (all generic / already in CLAUDE.md §3.3 + §Common Pitfalls). (Tailwind) v4 CSS-first + `@custom-variant` (already in v4 migration block STEP 0); `color-mix()` opacity + `forced-colors:` accessibility variant (low Memoria relevance — no Windows-kiosk audience, mobile-PWA event-guest demographic on iOS/Android); breakpoint defaults (CLAUDE.md §3.1). (Supabase) public-schema GRANT requirement (already in §Future Migrations HIGH PRIORITY entry); OAuth `/v1/oauth/token` 201→200 (already skipped 2026-05-06T22:00Z — supabase-js abstracts); Node 18 EOL (browser-only, N/A). (Canvas) iOS 384MB pool (already in pending-verification CONTRADICTION entry); whole-number `drawImage(x,y)` faster than decimal (already in §Performance Patterns "Three compounding gotchas" with `Math.floor(drawImage)` recipe at line 502); OffscreenCanvas batch rendering (already in §Performance Patterns); GC doesn't immediately free canvas (already implicit in §Common Pitfalls "Canvas image caches must delete failed promises"). (WebRTC) Safari iOS re-prompts (§WebRTC Camera Rules); WebKit bug 215884 hash-change re-prompt (§WebRTC Camera Rules); WebKit bug 185448 PWA standalone silent-fail (§WebRTC Camera Rules); HTTPS requirement (fundamental, not a 2026 gotcha); iOS 14.3 WKWebView baseline (operational metadata, Memoria targets iOS 16.4+ per Tailwind v4 browser cutoffs). Yield ratio: 1 stored from 5 topics (~20%) — saturation high but the API key migration is a real upcoming P0 (hard deadline ~7 months out, end of 2026).

> Nightly hunt 2026-05-08T18:00Z (3-topic React/Tailwind/Supabase sweep) added: (1) Tailwind `landscape:`/`portrait:` orientation variants are aspect-ratio gated (NOT device-gated) — fire on desktop browsers resized tall/narrow, producing false positives for any "mobile-only landscape" styling. Solution: combine with `max-h-[1024px]` or custom `mobileLandscape` variant. Augmented existing 2026-05-07 Web Lock finding with new sibling source — supabase-js #2013 (signInWithPassword + setSession deadlock from internal _acquireLock race between setItemAsync + deepClone, distinct mechanism from #2111 orphan but same defensive recipe applies). Skipped duplicates: useEffect race / AbortController / cleanup-flag pattern (all in CLAUDE.md §3.2 + §Common Pitfalls), Tailwind mobile-first base/breakpoint mental model (CLAUDE.md §3.1), `onAuthStateChange` intermittent + `refreshSession` hang #41968 (already cited in 2026-05-07 Web Lock entry), session-not-persisting-after-refresh (generic, not a 2026 gotcha), OAuth /v1/oauth/token 201→200 (already skipped 2026-05-06T22:00Z — supabase-js abstracts), signInWithPassword no error code on invalid creds #1662 (UX, not a silent-fail class). Yield ratio: 1 stored + 1 merge from 3 topics (~25%) — consistent with prior runs; landscape-variant gotcha is the second Tailwind-orientation finding this week (pairs with safe-area-inset-left/right) so MagnetCamera review should bundle both fixes.

> Nightly hunt 2026-05-07T22:00Z (5-topic comprehensive sweep — React/Tailwind/Supabase/Canvas/WebRTC) added: 0 findings stored. Full saturation run — every signal surfaced matched an already-promoted or already-pending entry. Skipped duplicates: (React) useEffect cleanup + dep arrays + conditional-hooks rule + useCallback over-use → all generic well-known + already in CLAUDE.md §3.3 / §Common Pitfalls (StrictMode #30835, async-callback deadlock #762, Web Lock orphan #2111). (Tailwind) media-query vs class-based dark mode → already locked in §0.6 Dark-Mode Activation mandatory `dark` class rule; mobile-first → CLAUDE.md §3.1; v4 CSS-first / `@custom-variant` → already in v4 migration block; variant-ordering `md:dark:hover:` → not a silent-fail axis. (Supabase) auto-retries GET/HEAD → already in §Common Pitfalls (promoted 2026-05-06); Realtime RLS row-filtering → already in §Common Pitfalls; JWT-RLS integration → fundamental. (Canvas) ImageData/getImageData 68% leak share → already in §Performance Patterns "OffscreenCanvas + ImageBitmap cache"; `Math.floor(drawImage)` → already in §Performance Patterns "Three compounding gotchas"; `willReadFrequently` first call → already in §Common Pitfalls; `imageSmoothingEnabled=false` trade-off → would degrade Memoria's photo/sticker compositing quality, N/A. (WebRTC) iOS re-prompts → already in §WebRTC Camera Rules; getCapabilities() ranges → already in "getSupportedConstraints guard" entry; PWA camera silent-fail → already in "iOS Safari standalone PWA mode" entry; webrtc-adapter → already explicitly rejected in §WebRTC Camera Rules. Yield ratio: 0/5 (~0%) — saturation signal: existing memory now covers the public-internet 2025-2026 surface for Memoria's stack at the level of detail research-scout can surface. Recommendation: next nightly hunt should narrow to NEW search axes (e.g. Vite-specific gotchas, Supabase Edge Functions, Image Transformation API readiness) rather than re-sweeping the same 5 topics.

> Weekly promotion run on 2026-05-06 reviewed 9 findings: **6 promoted** to permanent sections (Supabase JS auto-retries → Common Pitfalls; auth.resend implicit-flow → Common Pitfalls; Supabase Data API GRANT requirement → Future Migrations + project-memory HIGH; Tailwind v4 browser cutoffs + container-queries-today → v4 migration block; useSyncExternalStore subscribe stability → Performance Patterns + UI Anti-patterns; React 19.2 useEffectEvent details → React 19 migration block). **1 kept as pending-verification** (canvas memory pool contradiction — needs real-device measurement). **2 archived** (CSS Dynamic Viewport Units — already tracked in Future Migrations and project-memory.md tech debt; auth-js repo archived — operational metadata, captured below as a reference note).

> Nightly hunt 2026-05-06T18:00Z added: Tailwind v4 `@source` + `.gitignore` silent content-detection trap (forward-looking, v4 migration); Supabase Storage `storage.foldername()`/`filename()` path-parsing trap (actionable on Memoria's `{event_id}/{ts}_{name}` upload path); Supabase MFA TOTP unverified-factor 5-min auto-expiry (forward-looking, pairs with auth.resend pattern). Skipped duplicates: useSyncExternalStore referential identity (already promoted to Performance Patterns this morning), Tailwind mixed-units sort order (already covered at §Tailwind one-off arbitrary breakpoints), Supabase getSession/getUser/getClaims (already in Common Pitfalls + dedicated entry), React StrictMode double-mount cleanup (already in Common Pitfalls entry on React #30835).

> Nightly hunt 2026-05-06T22:00Z (5-topic comprehensive sweep) added: Supabase `.insert()`/`.update()` default returning runs implicit SELECT under RLS — silent empty-data on missing SELECT policy (extends the existing RLS DELETE silent-fail pattern to mutations that round-trip data). Skipped 14+ duplicates across all 5 topics: React hook fundamentals (cleanup, deps, single-responsibility — generic) + React Compiler/code-splitting (already in React 19 migration block) + View Transitions API (Memoria is SPA, no SSR, not applicable); Tailwind v4 container queries / `scheme-dark` / Oxide engine (all in v4 migration block); Supabase `/v1/oauth/token` 201→200 status code change (supabase-js abstracts; no custom fetch in Memoria) + Apr/May 2026 schema-not-exposed default (already in Future Migrations) + Node 18 EOL (browser-only project); Canvas iOS 384MB / 4096² (already in pending-verification CONTRADICTION entry) + `Math.floor(drawImage)` / OffscreenCanvas / batch-rendering / `getImageData` memory (all in Performance Patterns) + WebKit 219780 WebGL canvas resize leak (Memoria is 2D canvas, not WebGL); WebRTC deviceId randomization / iOS re-prompt / `exact` vs `ideal` constraints / WebKit-mandated browser engine on iOS (all already in §WebRTC Camera Rules). Yield ratio: 1 stored from 5 topics (~20%) — consistent with quality-over-quantity target.

> Nightly hunt 2026-05-07T18:00Z (3-topic React/Tailwind/Supabase sweep) added: (1) Supabase Web Lock orphaning after long idle / StrictMode unmount mid-auth-op → `AbortError: signal is aborted without reason`, then `getSession`/`getUser`/`refreshSession` hang forever (extends the existing multi-tab Web Lock entry with a new orphaned-lock failure mode); (2) Tailwind safe-area-inset-left/right required for landscape iOS notch on full-bleed camera (current MagnetCamera handles bottom only, ships visible black notch column when phone rotates); (3) Supabase Storage global `Content-Type: application/json` client header silently overrides per-upload `contentType: 'image/jpeg'`, saving photos as JSON blobs (audit lib/supabase.js client config now). Skipped duplicates: React useEffect race conditions / AbortController / StrictMode double-mount (all in §Common Pitfalls); useState child-from-prop staleness (generic well-known, not a 2026 gotcha); useId hydration mismatch (React 18 SSR-only, Memoria is Vite SPA — N/A); Tailwind v4.2.1 + Next.js 16.1.6 Turbopack arbitrary-value classes ignored (Turbopack-specific, Memoria uses Vite — N/A); Supabase #762 async-callback deadlock (already in §Common Pitfalls — separate root cause from #2111 orphaned-lock); supabase-js server-side onAuthStateChange not firing after refresh (Next.js SSR-only, Memoria is browser-only Vite SPA — N/A); Tailwind foldable / 4K breakpoints (Memoria targets event-guest mobile, not tablets/foldables). Yield ratio: 3 stored from 3 topics (~25% of all signals reviewed) — high-quality run.

### Reference note — Supabase auth-js repo archived (2026-01-23)
Operational metadata only — no behavioral rule. The standalone `supabase/auth-js` GitHub repo was archived on 2026-01-23; all source moved into the `supabase/supabase-js` monorepo at `packages/core/auth-js`. The `@supabase/auth-js` npm package is still published (no consumer change). Existing long-term-memory entries linking `auth-js #762`, `#755`, `#1717`, `#873`, `#898` resolve (read-only) but won't gain new comments — re-validate by searching the monorepo for issues filed past 2026-01-23. Future bug filings target `supabase/supabase-js` or `supabase/auth` (server-side), NOT the archived repo. Research-scout source policy updated.

### Finding: 2026-05-06 — Tailwind v4 `@source` directive silently respects nested `.gitignore` (silent missing-classes in production)
- **Source:** https://github.com/tailwindlabs/tailwindcss/issues/15452 + https://tailwindcss.com/docs/detecting-classes-in-source-files
- **Finding:** Tailwind v4's automatic content detection via `@source` directives **respects every `.gitignore` file in the scanned tree** — so adding `@source "../packages/ui";` to pull in a workspace UI library that contains its own `.gitignore` (or scanning a `node_modules` vendor with one) produces a silent "scanned 0 files" outcome. No build error, no warning — only missing utilities at runtime. Open issue #15452, no fix as of 2026-05-06; the upstream-recommended workaround is `@source not "{path}"` exclusions (deny-list) instead of relying on .gitignore inversion.
- **Relevance:** Memoria is on v3.4 today and has no monorepo / workspace-package fanout, so NOT actionable now. But forward-looking: Efi has mentioned future "extract `MagnetCamera` + `stickerPacks` into a shared package" (project-memory.md known-issues backlog). The moment Memoria adopts a workspace layout AND v4 in the same migration window, this trap fires — every shared-package class (especially admin-only Magnet violet utilities) silently disappears in prod.
- **Action:** When the v4 migration block lands (currently scoped behind the iOS Safari 16.4 browser-cutoff gate at §Tailwind v4 multi-improvement migration block), add a STEP 0.5 to the migration PR checklist: "If any `@source` path points at a directory containing `.gitignore`, EITHER use explicit `@source not '{path/dist}' '{path/build}'` deny-list rules OR move the shared package out from under any `.gitignore` umbrella. Verify locally by running `npx tailwindcss -o probe.css` and grepping for representative shared-package classes (`bg-violet-500`, `font-playfair`) before pushing." Pre-merge canary: load `MagnetEventDashboard` in a production build and confirm violet accents render.
- **Status:** pending-review

### Finding: 2026-05-06 — Supabase Storage RLS: `storage.foldername(name)` returns ARRAY, `storage.filename(name)` returns LAST segment — easy to swap and silently authorize the wrong scope
- **Source:** https://supabase.com/docs/guides/storage/security/access-control + https://supabase.com/docs/guides/troubleshooting/supabase-storage-inefficient-folder-operations-and-hierarchical-rls-challenges-b05a4d
- **Finding:** Two helper functions are commonly used in storage RLS path-based policies and are easy to confuse: `storage.foldername(name)` returns the path as a **text array** (use `[1]` for first segment, `[2]` for second, etc.), `storage.filename(name)` returns ONLY the last path segment as text. Writing `(storage.foldername(name))[1] = auth.uid()::text` correctly scopes "user can only write to a folder named after their UID"; writing `storage.filename(name) = auth.uid()::text` instead requires the UPLOAD FILENAME to equal the UID — a far weaker (and almost certainly unintended) check that lets any path through as long as the basename matches. Errors are silent at policy creation; only manifest when the wrong file lands in the wrong scope. Path performance footnote: hierarchical folder operations are inherently O(N) on object count under that prefix — keep folder fanout flat where possible.
- **Relevance:** Memoria's storage upload contract per CLAUDE.md is `{event_id}/{timestamp}_{filename}` — first segment is the event UUID. The current upload path uses `memoriaService.storage.upload()` which is bucket-scoped, but does NOT today have a path-segment RLS check beyond bucket-level INSERT permission. When the planned "guest can only re-upload their own pending photos" or "host can DELETE only photos from their own event" tightening lands (project-memory.md backlog), the policy MUST use `(storage.foldername(name))[1] = <event_id_lookup>` — NOT `storage.filename(name)`. Same trap will recur if MagnetMagnet introduces operator-scoped print spool buckets.
- **Action:** (1) Add a §Common Pitfalls entry on the next storage-RLS touch — paired with the existing "RLS DELETE silently fails without matching SELECT" entry, both are silent-fail RLS classes. (2) Schema audit rule for `CLEAN_RESET_SCHEMA.sql`: every storage policy that references a path segment must use `(storage.foldername(name))[N]` with explicit array index, NOT `storage.filename`; reject any reviewable PR that uses `storage.filename` for an authorization decision (vs. for display/logging). (3) Test pattern: before merging any storage-RLS migration, run `SELECT (storage.foldername('a/b/c.jpg'))[1], storage.filename('a/b/c.jpg');` against the migration branch — confirm the function used returns what the policy assumes.
- **Status:** pending-review

### Finding: 2026-05-06 — Supabase MFA TOTP unverified factors auto-expire after ~5 minutes; orphan factors block re-enrollment (forward-looking — Memoria has no MFA today)
- **Source:** https://supabase.com/docs/guides/auth/auth-mfa/totp + https://github.com/orgs/supabase/discussions/16067 + https://github.com/orgs/supabase/discussions/43045
- **Finding:** When `supabase.auth.mfa.enroll({ factorType: 'totp' })` succeeds, an **unverified factor** is created and a QR code returned. If the user closes the page, navigates away, or refreshes before completing `mfa.challengeAndVerify`, the unverified factor lingers for ~5 minutes before server-side cleanup. During that window, a second `enroll()` call from the same user often errors (factor-slot collision) OR creates a duplicate that confuses `listFactors()`. Related open discussion #43045: enroll succeeds but listFactors omits the freshly-enrolled TOTP factor in some race conditions. Mirrors the auth.resend implicit-flow pattern: the API surface looks fine but a UX edge silently dead-ends users.
- **Relevance:** **Memoria has no MFA flow as of 2026-05-06** — documenting now so the trap is caught when the feature lands. MFA is a plausible near-term ask for two surfaces: (a) admin/operator dashboard (PrintStation operator should not be a one-password-away unlock), (b) host accounts on premium tier. Both flows would benefit from getting the enroll/verify lifecycle right the first time.
- **Action:** When MFA enrollment is implemented (no current ticket): (1) Place QR-display and OTP-input on the SAME screen — never split across navigation. Hebrew copy: `הזן/י את הקוד מהאפליקציה תוך 5 דקות`. (2) On enrollment-component mount, ALWAYS call `mfa.listFactors()` first; for any factor with `status === 'unverified'`, call `mfa.unenroll({ factorId })` before issuing a fresh `enroll()` — prevents factor-slot collision from a prior abandoned enrollment. (3) Wrap the verify call in an explicit timeout error UI (`הקוד פג תוקף — סרוק/י את הברקוד מחדש`) — distinct from "wrong code" so users know they must re-enroll, not just retry. (4) For listFactors race (#43045), poll once with 250ms backoff if the just-enrolled factor isn't returned on first call — open upstream issue, no fix yet.
- **Status:** pending-review

### Finding: 2026-05-06 — iOS Safari canvas memory pool (CONTRADICTION — pending real-device measurement)
- **Source:** https://copyprogramming.com/howto/html-canvas-and-memory-usage + https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- **Finding:** Multiple 2026 sources cite **iOS Safari total-canvas-memory pool of ~384MB**, with a per-canvas hard cap of 4096×4096 (~64MB at 4 bytes/pixel RGBA). This **contradicts the existing Common Pitfalls entry** (canvas-pooling pitfall) which cites "~288MB" as the iOS Safari hard cap. Both numbers appear in independent technical sources; the discrepancy likely reflects iOS-version-dependent limits (288MB pre-iOS 16; 384MB iOS 17+). Per-canvas 4096×4096 cap appears stable across versions.
- **Why kept in new_learnings:** the existing 288MB figure is load-bearing for the OffscreenCanvas + ImageBitmap cache LRU cap (~100 entries). At 384MB headroom, that cap could safely grow to ~150-180; at 288MB it should stay at 100. Promoting either number without measurement would lock in a wrong figure.
- **Action — DO NOT promote until measured:** (1) On the next canvas-pooling touch (likely when implementing `stickerTextBitmapCache`), write a synthetic canvas-allocation probe (`while (true) new <canvas width=2048 height=2048>`) and measure the actual pool ceiling on a real iOS 17 device and a real iOS 18 device. (2) Update BOTH the existing Common Pitfalls canvas-pooling entry AND the OffscreenCanvas cache entry with the measured number + iOS version measured. (3) Add the measurement script to `scripts/` for future re-validation when iOS 19 ships. (4) Until measured, keep the existing 100-entry LRU cap (conservative under both numbers).
- **Status:** pending-verification (kept across review cycles until real-device measurement is performed)

### Finding: 2026-05-06 — Supabase JS `.insert()`/`.update()` default returning runs implicit SELECT under RLS — silent empty-data on missing SELECT policy
- **Source:** https://supabase.com/docs/reference/javascript/insert + https://supabase.com/docs/reference/javascript/update + https://supabase.com/docs/guides/database/postgres/row-level-security
- **Finding:** Default `.insert(row)` and `.update({...})` calls in supabase-js v2 use the SQL `RETURNING *` clause to round-trip the just-mutated row(s) into `data`. If RLS is enabled and the calling user has INSERT/UPDATE permission BUT NOT a matching SELECT permission for the row(s) just written, the mutation succeeds at the DB level but the client's `data` field is empty/null — and on some surfaces no error is set, so consumer code branching on `error` succeeds and consumer code branching on `data[0].id` silently breaks. Generalizes the existing §Common Pitfalls "RLS DELETE silently fails without matching SELECT policy" entry: every RLS-protected mutation surface that round-trips data is a silent-fail class when SELECT RLS doesn't cover the affected rows. Workaround per Supabase docs: skip the implicit returning round-trip when the client doesn't need the row back (via the supabase-js options surface — exact param has shifted between minor versions, so verify against the changelog at the time of use; conceptual rule "don't ask for data back if SELECT RLS won't return it" is what's stable). Affects INSERT and UPDATE; DELETE is the existing entry's scope.
- **Relevance:** Memoria's `memoriaService` INSERT paths (uploadPhoto, createEvent, requestPhotoDeletion, etc.) all default-return the inserted row. Today these mostly work because creator/owner is automatically covered by the table's SELECT RLS. The trap fires when a future flow inserts a row OWNED BY ANOTHER USER (host inserts a guest's `event_permissions` invite row, admin inserts a magnet operator's print job, system inserts a transient log row not user-readable, MagnetMagnet operator inserts a print-queue entry with a different `created_by`). Insert succeeds at DB; immediate SELECT returns empty; UI relying on `data[0].id` to navigate / show toast breaks silently with no error toast. Pairs especially with the email→UUID permissions migration (§Common Pitfalls entry on coexisting permissions phases): cross-user inserts across that boundary are exactly the shape that fires this trap.
- **Action:** (1) Add as a paired §Common Pitfalls entry next to "RLS DELETE silently fails without matching SELECT" on the next RLS touch — same silent-fail class, different mutation. (2) Schema audit rule extension for `CLEAN_RESET_SCHEMA.sql`: every table with INSERT or UPDATE RLS MUST also have a matching SELECT/ALL policy covering the post-mutation row scope, OR the corresponding `memoriaService` call MUST opt out of returning data. (3) Defensive client pattern: after any default-returning `.insert()`/`.update()`, treat empty `data` (no error, no rows) as a recoverable error — render Hebrew `הפעולה הצליחה אך לא נטען מידע — רענן/י את הדף` and log the table name + operation context, NOT silent success. (4) Audit pass on next memoriaService touch: enumerate every `.insert()` / `.update()` call site, confirm SELECT RLS covers the target row scope. Cross-reference the policy list in `CLEAN_RESET_SCHEMA.sql` rather than relying on memory.
- **Status:** pending-review

### Finding: 2026-05-07 — Supabase auth Web Lock orphaning after long idle / StrictMode mid-op unmount → `AbortError: signal is aborted without reason`, then every auth call hangs forever
- **Source:** https://github.com/supabase/supabase/issues/41968 + https://github.com/supabase/supabase-js/issues/2111 + https://github.com/supabase/supabase-js/issues/2013 (sibling — `signInWithPassword`/`setSession` hang AFTER 200 OK due to internal `_acquireLock` race between `setItemAsync` + `deepClone`; distinct root cause from #2111 orphan but same defensive recipe — `Promise.race` + reload affordance covers both)
- **Finding:** New failure mode separate from the existing async-callback deadlock (#762) and from the multi-tab refresh-token race. supabase-js v2 wraps every auth call (`getSession`, `getUser`, `refreshSession`, internal autorefresh) in `navigator.locks.request('lock:gotrue:refresh', ...)`. If the lock is acquired but NEVER RELEASED — caused by (a) React 18 StrictMode unmounting a component mid-auth-op in dev, (b) tab being backgrounded for 30 min – 1 h then resuming when an autorefresh signal aborts mid-flight, or (c) any abort signal firing while the lock is held — every subsequent auth call queues behind the orphaned lock and hangs FOREVER (no timeout, no error). The hung call surfaces in the console as `Uncaught (in promise) AbortError: signal is aborted without reason` originating from supabase-js `locks.ts`, with no network requests reaching the Supabase backend. Symptom: user opens previously-logged-in tab after lunch → infinite loading spinner → console shows AbortError → reload is the ONLY recovery (Web Lock dies with the document). Distinct from #762 (async callback + await within `onAuthStateChange` deadlocks the same client) — the new mode happens with a perfectly correct synchronous callback and is purely a browser+lifecycle interaction.
- **Relevance:** **Latent P0 surface for two Memoria flows:** (1) Host Dashboard sessions routinely stay open 1h+ during event setup / live event monitoring — exactly the idle-then-resume pattern that orphans the lock. The current "loading spinner forever" UX provides no recovery path; users will think the site broke. (2) Future PrintStation operator kiosk mode is intentionally idle for hours between bursts of activity → guaranteed to hit this trap. Pairs with the existing §Common Pitfalls "Supabase JS v2 multi-tab refresh-token race" entry (same Web Lock layer, healthy-path behavior) and with the StrictMode #30835 entry (StrictMode mid-mount unmount is the dev-time trigger). Memoria runs in StrictMode in dev → every auth-touching component re-mount can transiently orphan a lock; production runs once and is far less affected, but the long-idle case fires in prod.
- **Action:** (1) Add a §Common Pitfalls entry on next auth touch, paired with #762: "supabase-js auth Web Lock can orphan after long idle / StrictMode mid-op unmount → AbortError, every subsequent auth call hangs". (2) Defensive client pattern in `@/lib/AuthContext`: wrap `getSession`/`getUser` calls in a `Promise.race([call, timeout(8000)])`; on timeout OR `err.name === 'AbortError'` originating from supabase-js, render Hebrew recovery toast `החיבור נתקע — טען/י את הדף מחדש` with a "טען מחדש" button that calls `window.location.reload()` — reload is the ONLY way to release an orphaned Web Lock, since `navigator.locks` has no public release API for foreign holders. (3) On Dashboard mount, if the page has been visible for >30 min AND `document.visibilityState` just transitioned `hidden → visible`, proactively `Promise.race` an `auth.getSession()` against an 8s timer — if it loses, show the reload toast preemptively before the user clicks anything. (4) When PrintStation kiosk mode lands, add the same defensive race + visible reload affordance to the operator shell. (5) Subscribe to supabase-js #2111 / supabase #41968 (open PR as of 2026-01) and remove the timeout race when fixed upstream. (6) Add `X-Retry-Count` watcher (already in §Common Pitfalls "auto-retries" entry) — surge of retries near a hang is the early-warning signature.
- **Status:** pending-review

### Finding: 2026-05-07 — Tailwind safe-area-inset utilities cover top/bottom but landscape iOS notch requires `safe-area-inset-left/right` — full-bleed camera ships a black column when phone rotates
- **Source:** https://medium.com/@developerr.ayush/understanding-env-safe-area-insets-in-css-from-basics-to-react-and-tailwind-a0b65811a8ab + https://github.com/tailwindlabs/tailwindcss/discussions/12536
- **Finding:** `env(safe-area-inset-{top,right,bottom,left})` is a four-axis API. Most Tailwind setups (and CLAUDE.md §3.6 today) only wire bottom-inset (iOS home-indicator suppression). In **landscape orientation on iPhone X / 11 / 12 / 13 / 14 / 15 / 16 with the notch or Dynamic Island**, the notch occupies the LEFT or RIGHT screen edge (depending on rotation direction). A `fixed inset-0` full-bleed camera with no left/right inset padding either: (a) lets the notch occlude UI controls placed near the rotated edge (capture button, switch-camera icon), OR (b) on Safari with `viewport-fit=cover`, ships a visible black column in the safe-area where content cannot render. There is no Tailwind core utility for `padding-left: env(safe-area-inset-left)` — needs an explicit arbitrary-value class `pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]` OR a custom utility extension OR the `tailwindcss-safe-area` plugin (open Tailwind discussion #12536 has been requesting first-class `safe:` modifier since 2024, no merge as of 2026-05-07).
- **Relevance:** **MagnetCamera.jsx is full-bleed `fixed inset-0` per CLAUDE.md §3.6** and explicitly designed for landscape capture (event guests rotate to capture wider scenes). The current control bar uses `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + Npx)` — bottom only. Any landscape user on a notched iPhone today either has the notch obscuring the leftmost control OR sees a black column on one side of the viewfinder. CameraCapture.jsx (Share) has the same shape but is portrait-only by current UX, so less acute. Pairs with the existing §WebRTC Camera Rule "Full-screen camera = `fixed inset-0`, all layers `absolute`. Never `flex flex-col`" — this is the missing fourth-axis padding for those absolute layers when rotated.
- **Action:** (1) Update CLAUDE.md §3.6 "Bottom floating bar" rule to read "ALL fixed-position camera UI layers must include four-axis safe-area padding: `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + Npx)`, `paddingTop: env(safe-area-inset-top, 0px)`, `paddingLeft: env(safe-area-inset-left, 0px)`, `paddingRight: env(safe-area-inset-right, 0px)`. Apply to the camera control bar AND the camera header overlay, NOT to the `<video>` element itself (video is intentionally full-bleed and the OS draws the notch over it cleanly)." (2) Audit MagnetCamera.jsx + CameraCapture.jsx control-bar style props now; add `paddingLeft`/`paddingRight` env() expressions in the same inline-style object that already sets `paddingBottom`. (3) Confirm `<meta name="viewport" content="...,viewport-fit=cover">` is set in `index.html` — without `viewport-fit=cover`, env() returns 0 in Safari and the padding is a no-op. (4) Test gate: real iPhone with notch (12+), launch MagnetCamera, rotate to BOTH landscape orientations, verify capture button + switch-camera icon are reachable and not under the notch. Desktop devtools landscape emulation does NOT reproduce the notch; must be on-device. (5) Long-term: when migrating to Tailwind v4 (already-tracked migration block), evaluate adopting the `tailwindcss-safe-area` plugin OR custom `pe-safe`/`ps-safe` utilities so future surfaces get four-axis safe areas by default.
- **Status:** pending-review

### Finding: 2026-05-07 — Supabase Storage: global `Content-Type: application/json` header on the supabase client SILENTLY overrides per-upload `contentType` — every photo saved as a JSON blob (broken thumbnails, broken transformations)
- **Source:** https://github.com/orgs/supabase/discussions/34982 + https://github.com/supabase/storage/issues/639 + https://github.com/supabase/storage/issues/816 + https://supabase.com/docs/guides/storage/uploads/standard-uploads
- **Finding:** When `createClient(url, key, { global: { headers: { 'Content-Type': 'application/json' } } })` is set (a common pattern for forcing JSON on `from()` queries when migrating from another stack), that global header is propagated to EVERY request including `storage.from(bucket).upload(path, file, { contentType: 'image/jpeg' })`. The per-call `contentType` option becomes the request's body declaration, but the global `Content-Type: application/json` request header wins on the wire — the storage backend persists the file with mime `application/json`. Symptom: `<img src={publicUrl}>` renders broken-image icon, browser network tab shows `Content-Type: application/json` on the GET, image-transformation API errors with "unsupported mime type", AND if RLS / bucket policy has `allowed_mime_types: ['image/*']` the upload sometimes succeeds anyway because storage validates by FILENAME EXTENSION not file body (storage issue #639 — the validator inspects only the path, never the bytes; renaming `script.js` to `image.jpg` passes). Two separate gotchas, both in the same upload path: (a) wrong saved mime via the global-header hijack, (b) bucket mime allowlist is bypassable by extension spoofing. Storage issue #816 documents that `charset=utf-8` parameters on the contentType string are ALSO silently stripped at S3 layer — `contentType: 'text/csv; charset=utf-8'` saves as `text/csv` plain.
- **Relevance:** **Memoria's hot upload path is `memoriaService.storage.upload()`** — every photo (JPEG from camera capture, WebP after browser-native compression, PNG-frame composites from `compositePngFrame.js`). If `lib/supabase.js` has any global `headers: { 'Content-Type': 'application/json' }` block — common copy-paste from older Supabase tutorials — every photo is saved as JSON, the gallery renders broken-image icons for everyone, and the future Image Transformation API integration (auto-WebP serving, on-the-fly thumbnail generation, watermark via storage transformations) breaks at the API layer. Risk surface: as of 2026-05-07 Memoria's photos appear to render correctly (would be visible in any QA session), so the global header is presumably NOT set today — but a future migration / tutorial copy could introduce it silently. Extension-spoofing risk applies more weakly: Memoria uses MIME validation + RLS, but if a guest uploads `evil.html` renamed to `evil.jpg`, storage accepts it; downstream `<img src>` won't execute it, but a future "share photo via direct URL" flow could surface the HTML if Content-Type lookup at serve time picks up the actual response header.
- **Action:** (1) Audit `@/lib/supabase.js` NOW (this finding's first deliverable) — open the file, confirm the `createClient()` call has NO `global: { headers: { 'Content-Type': ... } }` block. If present, REMOVE it. If you genuinely need a default header for `from()` queries, scope it to `db.headers` not `global.headers` (newer supabase-js exposes per-area headers). (2) Add a dev-time canary in `memoriaService.uploadPhoto`: after upload, call `storage.getPublicUrl(path)` and then `fetch(url, { method: 'HEAD' })` — log a console.warn if the response `Content-Type` does not start with `image/`. Keeps the silent-fail mode out of production. (3) Defensive: ALWAYS pass explicit `contentType: file.type || 'image/jpeg'` on every `.upload()` call — never rely on auto-detection from filename extension when a `File` object's MIME is available. (4) Schema-side: confirm `CLEAN_RESET_SCHEMA.sql` photo bucket policy has `allowed_mime_types` set to a strict allowlist (`image/jpeg`, `image/png`, `image/webp`) — but treat that as defense-in-depth, NOT as the primary check (storage validator inspects filename, not bytes per #639). (5) Forward-looking: if Image Transformation API integration lands, the saved Content-Type IS load-bearing — wrong mime breaks every transformation URL. Re-run the audit before the migration PR.
- **Status:** pending-review

### Finding: 2026-05-08 — Supabase legacy `anon` / `service_role` JWT API keys deprecated end of 2026 — new `sb_publishable_*` / `sb_secret_*` keys are NOT JWTs and CANNOT live in the `Authorization` header
- **Source:** https://supabase.com/docs/guides/getting-started/api-keys + https://github.com/orgs/supabase/discussions/29260 + https://supabase.com/changelog/29260-upcoming-changes-to-supabase-api-keys + https://github.com/orgs/supabase/discussions/40300 + https://github.com/supabase/supabase/issues/37648
- **Finding:** Supabase is replacing the JWT-based `anon` and `service_role` API keys (the long base64 strings stored as `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` today) with a new asymmetric scheme: a single project-scoped publishable key formatted `sb_publishable_xxxxxxxx...` (replaces `anon`) and one or more rotatable secret keys formatted `sb_secret_xxxxxxxx...` (replace `service_role`). **Hard timeline:** legacy keys keep working until end of 2026, then are removed. **Critical migration trap:** the new keys are NOT JWTs, so passing them in the HTTP `Authorization: Bearer <key>` header — a common pattern when the legacy `anon` key was double-used as the bearer token for unauthenticated requests — breaks. Per upstream docs: `Authorization` must hold the USER's session JWT (`session.access_token`) or be empty; the `apikey` request header is where the new publishable/secret value lives. Sibling gotcha (issue #37648): after migrating a project, Edge Function environment variables silently keep the old `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` values until the function is REDEPLOYED — calls from edge functions appear to work for hours/days off cached env, then break when the function cold-restarts. Discussion #40300 confirms multiple secret keys can coexist (proper rotation without downtime — a security feature legacy keys never had: rotating the legacy `service_role` invalidates EVERY existing token). Self-hosted instances need explicit asymmetric-auth setup; Supabase Cloud projects auto-provision both old + new keys during the rollout window.
- **Relevance:** **Memoria's auth surface today uses the legacy keys exclusively** — `VITE_SUPABASE_ANON_KEY` is consumed by `@/lib/supabase.js` (`createClient()` second arg) and ALSO injected as a literal header value in the direct-`fetch` storage upload path documented at lines 273-285 (`apikey: {VITE_SUPABASE_ANON_KEY}` + `Authorization: Bearer ${session.access_token}`). The good news: Memoria's existing direct-`fetch` pattern is ALREADY correct — `apikey` carries the publishable-class value, `Authorization` carries the user JWT. So the migration is a value swap on the apikey line, NOT a header restructure. The bad news: any future code path that copy-pastes the legacy "use the anon key as the bearer token" anti-pattern (common in older Supabase tutorials when there's no logged-in user) silently breaks after the swap. Service-role usage (currently zero in client per CLAUDE.md §3.5 — `Never expose VITE_SUPABASE_SERVICE_ROLE_KEY in frontend code`) is unaffected on the client; if any Edge Function is added on the MagnetMagnet roadmap (project-memory.md backlog: server-side print spool, admin notification fan-out), it must use `sb_secret_*` AND be redeployed after any key rotation per #37648. Pairs with the existing forward-looking entry on `getClaims()` + asymmetric JWT signing keys (line 660-662) — that entry covers the JWT signing-key infrastructure; this entry covers the orthogonal API key naming/format change. Both migrations land in the same Supabase Settings → API panel; do them as ONE coordinated PR when scoped, NOT in two passes.
- **Action:** (1) Track the deadline in project-memory.md as MEDIUM priority with hard date 2026-12-31 (~7 months runway). Pairs with the existing HIGH-priority Supabase Data API public-schema GRANT migration (Oct 30, 2026) — ideally bundle both into a single "Supabase 2026 platform compliance" PR in Q3. (2) Pre-migration audit: `grep -rn "VITE_SUPABASE_ANON_KEY\|SUPABASE_SERVICE_ROLE_KEY" src/ vercel.json` — enumerate every consumption site. Confirm each one places the value in `apikey` (or in the `createClient(url, key)` positional arg, which supabase-js normalizes to `apikey` internally) and NEVER in `Authorization: Bearer`. Reject any reviewable PR that introduces a new `Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}` pattern — that survives in legacy mode, breaks silently after migration. (3) Migration steps when scoped: (a) Supabase Dashboard → Settings → API → Generate new `sb_publishable_*` and `sb_secret_*` keys (keys auto-coexist with legacy during rollout — no downtime). (b) Update Vercel env vars: rename `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` (or keep the old var name with the new value — naming is local choice, but `_PUBLISHABLE_` self-documents) for all environments (prod / preview / dev). (c) Update `@/lib/supabase.js` and the direct-fetch storage path to read the new env var; ship Vercel preview deploy. (d) Smoke-test login + photo upload + photo download on preview. (e) Promote to prod. (f) **Crucial post-deploy:** for any Edge Function (none today, but when added), redeploy explicitly per #37648 — env-var update alone does not propagate. (4) Defensive client pattern: when the migration lands, add a build-time assertion in `@/lib/supabase.js` that throws a Hebrew dev-mode error if `VITE_SUPABASE_PUBLISHABLE_KEY` starts with `eyJ` (legacy JWT prefix) AND the env var name says publishable — catches the "renamed env var, forgot to swap value" mistake. (5) Forward-looking: when `getClaims()` migration (line 660 entry) is scoped, do the API key swap in the SAME PR — both touch the same Supabase Settings panel, both want a single Vercel env-var deploy cycle, both want the same post-deploy smoke test pass. (6) Do NOT pre-emptively migrate today — Memoria has runway until end of 2026 and the migration carries non-zero regression risk on the storage upload hot path; bundle with other 2026 Supabase platform compliance work for one coordinated cutover.
- **Status:** pending-review

### Finding: 2026-05-11 — Tailwind `dark` class on a wrapper `<div>` is BYPASSED by Radix/shadcn portals — every shadcn modal in Memoria renders LIGHT-themed today
- **Source:** https://tailwindcss.com/docs/dark-mode + https://abrarqasim.com/blog/tailwind-dark-mode-v4-setup-i-actually-use/ + https://www.tailwindready.com/blog/tailwind-css-dark-mode + https://github.com/tailwindlabs/tailwindcss/discussions/15083 + Radix UI Portal docs (https://www.radix-ui.com/primitives/docs/utilities/portal)
- **Finding:** Tailwind's `dark:` variant resolves by walking ANCESTORS of the element being styled to find the `dark` class (or `[data-mode=dark]`, depending on `@custom-variant` config). Radix UI portals (`DialogPrimitive.Portal`, `AlertDialogPrimitive.Portal`, `PopoverPrimitive.Portal`, `TooltipPrimitive.Portal`, `SelectPrimitive.Portal`, `SheetPrimitive.Portal`, `DropdownMenuPrimitive.Portal`, `HoverCardPrimitive.Portal`) — and shadcn/ui re-exports all of them — mount their content as a direct child of `document.body`, NOT inside the component tree. So if the `dark` class lives on a wrapper `<div>` somewhere INSIDE the React tree, portal content ends up OUTSIDE that wrapper and Tailwind semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.) resolve to LIGHT-palette values — silently producing jarring white modals/dropdowns/tooltips on dark pages. No build error, no runtime warning, no console output — the modal just renders light. Universal 2026 Tailwind dark-mode guidance: "put the class on `documentElement` and stop second-guessing it" — the only ancestor that BOTH the React tree AND `document.body` share is `<html>` (and `<body>`). The same gotcha applies to Tailwind v4 if `@custom-variant dark` is configured to look at an ancestor class.
- **Relevance:** **CONFIRMED LATENT BUG in Memoria today.** Inspection (2026-05-11T22:00Z): `index.html` ships bare `<html lang="he">` with NO `dark` class. The `dark` class is placed on individual page-root `<div>`s in at least: `src/pages/Home.jsx` line 21, `src/pages/MyEvents.jsx` lines 182/190/207, `src/pages/MagnetLead.jsx` line 411, `src/components/admin/AdminShell.jsx` line 19. Memoria uses Radix portals via shadcn/ui — confirmed in `src/components/ui/dialog.jsx` (`DialogPrimitive.Portal`), `src/components/ui/alert-dialog.jsx` (`AlertDialogPrimitive.Portal`), plus 20+ other ui/* files (popover, tooltip, sheet, select, dropdown-menu, hover-card, etc.). Therefore: every `AlertDialog` (delete confirmations on Dashboard, AdminDashboard), every `Dialog` (forms, modals), every `Popover` (date pickers, options menus), every `Tooltip`, every `Select` dropdown, every `Sheet` (mobile drawers) on every page in Memoria today renders with LIGHT-palette resolved Tailwind semantic tokens. Visible symptom: white modal on dark page, near-invisible text where `text-foreground` resolves to dark-gray on white bg, jarring color regression as soon as user opens any shadcn primitive. Pairs directly with §0.6 Dark-Mode Activation MANDATORY rule which says the `dark` class MUST be present but does NOT specify WHERE — the canonical answer is `<html>`, not wrappers. Same trap applies to Magnet sub-brand violet — any future `dark` toggle on AdminShell will fail to theme operator-side modals.
- **Action:** (1) Pick a fix strategy and apply: (a) Static — edit `index.html` to `<html lang="he" class="dark">`. Simplest, but locks all routes to dark; if any future light-mode admin route is needed, switch to (b). (b) Mount-time — in `src/main.jsx` or `App.jsx`, on initial render, `document.documentElement.classList.add('dark')` so SSR-less SPA root carries the class globally. (c) Per-route — `useEffect(() => { document.documentElement.classList.add('dark'); return () => document.documentElement.classList.remove('dark'); }, []);` in each dark page root — preserves the current page-by-page dark intent but applies it at the document level. Recommend (a) for shipping speed since every current Memoria route is dark-themed; defer (b)/(c) until a light-mode surface is actually scoped. (2) After fix lands, REMOVE the `dark` class from the page-root wrapper `<div>`s in `Home.jsx`, `MyEvents.jsx`, `MagnetLead.jsx`, `AdminShell.jsx` — once `<html>` has it, the wrapper-div copies are redundant (no harm but confuses future readers). (3) Update CLAUDE.md §0.6 Dark-Mode Activation rule to specify "The `dark` class MUST be on `<html>` (or set on `document.documentElement` at mount), NOT on a wrapper `<div>`. Radix/shadcn portals (Dialog, AlertDialog, Popover, Tooltip, Select, Sheet, DropdownMenu, HoverCard) mount to `document.body` and only inherit `dark` if it lives on an ancestor that both the React tree AND `document.body` share — `<html>` is the only such ancestor." (4) Test gate before merge: open EVERY shadcn primitive used in Memoria (AlertDialog confirm-delete on Dashboard, every Dialog modal, every Sheet drawer, every Select dropdown, every Popover, every Tooltip) and verify dark-palette renders. Desktop Chrome with `prefers-color-scheme: light` set in DevTools is the cleanest test — without the fix, modals render light; after the fix, modals render dark regardless of OS preference. (5) When Tailwind v4 migration lands (already in migration block), the v4 default `@custom-variant dark (&:where(.dark, .dark *))` selector still walks ancestors — same rule applies. (6) Forward-looking: when a light-mode admin / settings surface is scoped (no current ticket), implement an explicit toggle that swaps `<html>` class — never revert to wrapper-div placement, even partially.
- **Status:** pending-review

### Finding: 2026-05-08 — Tailwind `landscape:`/`portrait:` orientation variants are aspect-ratio gated (NOT device-gated) — fire on desktop browsers resized tall/narrow, polluting "mobile-only landscape" styling
- **Source:** https://github.com/tailwindlabs/tailwindcss/discussions/2397 + https://github.com/tailwindlabs/tailwindcss/discussions/9950 + https://github.com/tailwindlabs/tailwindcss/discussions/5436 + https://github.com/tailwindlabs/discuss/issues/309 + https://tailwindcss.com/docs/responsive-design
- **Finding:** Tailwind's built-in `landscape:` and `portrait:` variants compile to the CSS `@media (orientation: landscape|portrait)` media query, which the browser evaluates purely from **viewport width-to-height ratio** — NOT from any device-class signal. Chrome / Firefox / Safari on Windows / macOS / Linux all flip orientation media as a tall-narrow desktop browser window is resized: a 600×900 dev-tools side panel triggers `portrait:`, a 1600×800 split-screen triggers `landscape:`. So `<div className="landscape:rotate-90 landscape:w-screen landscape:h-screen">` written for "phone in landscape capture mode" ALSO fires for any QA tester who happens to have a wide-but-short browser window — silently injecting rotated/full-bleed UI into desktop testing. The only way to scope `landscape:` to actual mobile devices is to **stack with a size constraint** (e.g., `landscape:max-h-[1024px]:rotate-90`) OR define a custom `mobileLandscape` variant in `tailwind.config.js` that combines orientation + `(max-width: 1024px) and (max-height: 600px)`. Open Tailwind discussion #2397 (Sep 2020, still open as of 2026-05-08) requests a first-class `mobileLandscape:` modifier; #9950 documents users hitting the inverse problem ("mobile + landscape scoping doesn't seem to work"). Subtle: `min-aspect-ratio: 13/9` in custom variants is more reliable than `(orientation: landscape)` for "wide-vs-tall" intent because it lets you set the threshold instead of relying on the browser's any-degree-past-square evaluation.
- **Relevance:** **MagnetCamera.jsx is explicitly designed for landscape capture per CLAUDE.md §3.6** — guests rotate phones to capture wide event scenes. If any current or future styling on MagnetCamera, MagnetReview, the rotation hint overlay, or the operator's PrintStation preview pane uses bare `landscape:` to apply rotation/sizing, it ALSO fires for the admin tester running the Vercel preview in a tall-narrow Chrome window during QA — masking real-device bugs and producing UI states the tester thinks are mobile-only. Pairs directly with the 2026-05-07 finding on `safe-area-inset-left/right` for landscape iOS notch — both are about MagnetCamera + landscape correctness, both should be bundled in the same camera audit PR. Forward-looking risk surfaces: (1) MagnetReview rotation handling for landscape-captured photos (PRD backlog), (2) PrintStation preview pane that auto-rotates landscape submissions (project-memory.md operator UX), (3) any future "rotate device for better experience" hint overlay.
- **Action:** (1) Audit `src/` for any `landscape:` or `portrait:` class usage today — `grep -rn "landscape:\|portrait:" src/` (already confirmed 2026-05-08: only `src/components/ui/carousel.jsx` matches today, which is a third-party shadcn carousel using `aria-orientation`, NOT a Tailwind orientation variant — so the trap is currently latent, not active). (2) Add a §Tailwind quirks entry on next Tailwind touch (or fold into the §0.6 design system block as a "MagnetCamera landscape rules" subsection): "Bare `landscape:` / `portrait:` variants are aspect-ratio gated, NOT device-gated. NEVER use bare `landscape:` for mobile-landscape-only styling. Use `landscape:max-h-[1024px]` or a custom `mobileLandscape` variant." (3) On the next MagnetCamera / MagnetReview touch, define `mobileLandscape` and `mobilePortrait` custom variants in `tailwind.config.js` ahead of need — combining `(orientation: landscape) and (max-width: 1024px) and (max-height: 600px)` — so future authors reach for `mobileLandscape:` instead of `landscape:`. (4) Bundle this fix with the safe-area-inset-left/right fix from 2026-05-07 in a single MagnetCamera PR — both are landscape-correctness gaps, both touch the same component, single test pass on real iPhone covers both. (5) Add to QA test gate: "verify any orientation-conditional styling does NOT activate when the developer resizes the desktop Chrome window tall/narrow." (6) Documentation note: when `tailwindcss-safe-area` plugin or `(min-aspect-ratio: 13/9)` migration arrives in v4 (already-tracked migration block), revisit this finding and prefer aspect-ratio-based variants over orientation media queries.
- **Status:** pending-review

---

### Finding: 2026-05-11 — Supabase `auth.signOut()` defaults to `scope: 'global'` (signs user out of EVERY device) + multiple silent-fail / hang modes
- **Source:** https://supabase.com/docs/guides/auth/signout + https://supabase.com/docs/reference/javascript/auth-signout + https://github.com/supabase/auth-js/issues/936 + https://github.com/supabase/auth-js/issues/902 + https://github.com/orgs/supabase/discussions/31017 + https://github.com/supabase/auth/issues/2036
- **Finding:** Two compounding gotchas in one call:
  - **(a) Default scope mismatch with developer expectations:** `supabase.auth.signOut()` without args defaults to `scope: 'global'` — terminates EVERY active session for the user across all devices and tabs, not just the current one. This is the inverse of auth0/clerk/firebase/most-other-providers' default. A user signing out on their phone unintentionally kills the desktop session they had open in another tab — UX surprise reported as "the site logged me out everywhere when I just clicked sign out on my phone." Documented in upstream docs but easy to miss; the three options are `global` (default), `local` (current session only — what most devs assume is the default), and `others` (every-other-session, keep current).
  - **(b) Silent-fail / hang modes:** Open issues confirm `signOut()` can return successfully (HTTP 200) but neither resolve the promise nor throw — the page UI hangs on a "signing out…" spinner forever; manual page reload is required for the SIGNED_OUT event to fire (auth-js #936). Sibling: a `scope: 'global'` signOut from one tab does NOT fire `SIGNED_OUT` on `onAuthStateChange` listeners in OTHER same-browser tabs/instances (auth-js #902) — those tabs remain in `SIGNED_IN` state with a now-invalid token, every subsequent supabase call returns 401, and the UI looks logged-in until something tries to fetch. Discussion #31017 reports `scope: 'local'` sometimes behaves as `'global'` (server-side bug, intermittent). Auth #2036 documents the inverse: multi-session-enabled accounts where `scope: 'local'` STILL invalidates all sessions (server-side bug). Same Web Lock layer as the existing §Common Pitfalls Web Lock orphan entry (line 735) — `signOut` acquires the lock; on hang, every subsequent auth call queues forever behind the orphaned lock.
- **Relevance:** Memoria has two sign-out surfaces today — host `Dashboard.jsx` and admin `AdminDashboard.jsx` (also possible top-bar sign-out in `AdminShell.jsx`). Both presumably call `supabase.auth.signOut()` bare with no scope. Three live failure modes:
  - Host signs out on phone after event → desktop session at home dies → user thinks site broke. Especially bad for the MemoriaMagnet operator persona who may have PrintStation open on a kiosk concurrently with their admin browser.
  - User clicks sign out → spinner forever (issue #936) → no error UI → presses sign out again → stacks behind the orphaned lock → page now unresponsive.
  - Sign out completes in one tab → other open Memoria tabs (multi-event host monitoring) keep stale session → next fetch 401s with no recovery UX.
  Pairs with existing §Common Pitfalls Web Lock orphan entry (line 735, signIn-side) — same lock, signOut-side variant. Pairs with §Common Pitfalls `onAuthStateChange` deadlock entry (line 444) — if a sign-out handler `await`s any supabase call inside an `onAuthStateChange('SIGNED_OUT')` callback, the same client-wide deadlock fires.
- **Action:** (1) On next auth touch, add a §Common Pitfalls entry paired with the existing Web Lock orphan: "`auth.signOut()` defaults to global scope + has known hang and silent-fail modes — always pass explicit scope and wrap in a timeout race". (2) Audit Memoria sign-out call sites now — `grep -rn "auth.signOut" src/` — and migrate to:
  ```js
  const handleSignOut = async () => {
    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SIGNOUT_TIMEOUT')), 8000))
      ]);
      if (result?.error) throw result.error;
    } catch (err) {
      console.error('[Auth] signOut failed:', err.message);
    } finally {
      // Manual state clear — never rely solely on onAuthStateChange SIGNED_OUT round-trip (auth-js #902/#936)
      setUser(null);
      navigate('/', { replace: true });
    }
  };
  ```
  Hebrew error toast on `SIGNOUT_TIMEOUT`: `הניתוק נתקע — טען/י את הדף מחדש` with reload affordance, identical pattern to the existing 2026-05-07 Web Lock recovery recipe. (3) Default `scope: 'local'` is the Memoria UX expectation (host on phone signing out should NOT kill desktop session). The one exception is the admin "force sign out everywhere" affordance if/when added — that call site explicitly passes `scope: 'global'`. (4) For multi-tab consistency (issue #902 — other tabs don't get SIGNED_OUT event on global signOut), use the BroadcastChannel API alongside signOut to notify peer tabs: `new BroadcastChannel('memoria-auth').postMessage({ type: 'SIGNED_OUT' })`, and on every host page mount subscribe to that channel and trigger the local sign-out cleanup on receipt. Bridges the auth-js #902 gap without waiting for upstream fix. (5) Subscribe to auth-js #936, #902, supabase #31017, auth #2036; remove the timeout race when #936 is fixed.
- **Status:** pending-review

### Finding: 2026-05-11 — iOS Safari PWA standalone mode: `100dvh` / `min-h-dvh` reports wrong values on cold start; only `100vh` works from first paint (CONTRADICTION-pending-verification — partial conflict with existing dvh-swap recommendation)
- **Source:** https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14 + https://dev.to/maciejtrzcinski/100vh-problem-with-ios-safari-3ge9 + https://www.w3tutorials.net/blog/is-viewport-fit-cover-no-longer-working-on-the-ios-safari/ + https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units
- **Finding:** When a Memoria-like web app is added to iOS home screen and launched in `display: standalone` mode (per `public/manifest.json`), with `viewport-fit=cover` set in the `<meta name="viewport">` tag, `100dvh` and `min-h-dvh` resolve to the WRONG value on the very first paint after a cold launch — typically letterboxing the page content or producing a partially-collapsed viewport. The dvh number only self-corrects after the user performs a portrait→landscape→portrait rotation cycle, which forces Safari to re-compute the dynamic viewport. `100vh` / `min-h-screen` does NOT have this cold-start issue in standalone PWA mode — it resolves correctly on first paint. Additional related cold-start landmines documented in the same sources: `height: 100%` on `html`/`body` BREAKS `viewport-fit=cover` entirely (content never extends behind notch/Dynamic Island); `window.innerHeight` and `screen.height` also converge to the correct value AFTER initial layout but report stale values during the first frame; the entire safe-area-inset system silently no-ops if `viewport-fit=cover` is missing from the viewport meta.
- **Relevance — partial CONTRADICTION with existing entry:** The existing §Future Migrations entry "iOS Safari address-bar collapse — switch `min-h-screen` → `min-h-dvh` on page roots (actionable today on v3.4)" recommends a bulk swap from `min-h-screen` to `min-h-dvh` on `MagnetLead`, `EventSuccess`, `MagnetGuestPage`, `Home`, `CreateEvent`, `Dashboard`, `EventGallery`. That recommendation is correct for in-Safari-tab browsing (where address-bar collapse is the bug) — but it may REGRESS the experience for users who install Memoria as a home-screen PWA, particularly `MagnetGuestPage` (which is explicitly the PWA install target per the existing standalone-PWA-camera-fail entry on line 558-563). The two failure modes (in-Safari address-bar overflow vs. PWA cold-start dvh letterbox) want OPPOSITE solutions. Neither finding is wrong; they describe different surfaces. Memoria has guests on BOTH paths: most users open via QR scan in regular Safari (dvh helps), some install to home screen (dvh hurts). Pre-existing pairing: the standalone-PWA-camera-fail entry already recommends `display: browser` or `display: minimal-ui` for Magnet guest routes specifically; if that mitigation is shipped, this finding becomes moot for those routes — but for any other route the user might Add-to-Home-Screen, the trap remains.
- **Why kept in new_learnings (not promoted yet):** Three uncertainties: (a) the cold-start dvh-wrong-value claim is sourced primarily from a community gist + secondary blogs, not a WebKit bug tracker entry — could be device/version-specific to older iOS (pre-17?). (b) The existing dvh entry has been actionable-today for weeks; promoting a contradiction without on-device measurement would muddy the recommendation. (c) The combined fix is non-trivial: detect standalone PWA at runtime (`window.matchMedia('(display-mode: standalone)').matches`) and conditionally swap dvh→vh, OR ship a `@media (display-mode: standalone) { .min-h-dvh { min-height: 100vh; } }` CSS escape hatch globally. Both add complexity that should only land after measurement confirms.
- **Action — DO NOT promote until measured:** (1) Test path: on a real iPhone (12+, iOS 17+ AND iOS 18+ if available), Add Memoria to Home Screen from `MagnetGuestPage`, force-quit the PWA, cold launch, observe whether `min-h-dvh` page roots render with correct full-screen height on first paint OR letterbox. Repeat on `Home.jsx` and `Dashboard.jsx`. (2) If reproducible: add a `useStandalonePWA()` hook returning `boolean`, conditionally apply `min-h-screen` (vh) instead of `min-h-dvh` for PWA-installed routes, prioritizing `MagnetGuestPage` first. Document in CLAUDE.md §3.1 under a new "iOS PWA standalone exception" footnote pointing back to §Future Migrations dvh entry. (3) If NOT reproducible (older-iOS-only artifact, fixed in iOS 17+): leave the existing dvh recommendation intact and demote this finding to a brief "tested 2026-05, no regression observed on iOS 17/18" reference note. (4) Crosscheck `index.html` confirms `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — without `viewport-fit=cover`, neither vh nor dvh-on-PWA discussion matters; safe-area-inset env() values resolve to 0 and the entire layered camera-control UX in §3.6 silently breaks (also covered in the 2026-05-07 landscape notch finding). (5) Pair this measurement with the same-PR fix for the landscape `safe-area-inset-left/right` finding (2026-05-07) and the bare `landscape:`/`portrait:` aspect-ratio gating finding (2026-05-08) — all three are camera-flow / PWA-shell correctness checks that benefit from a single real-iPhone QA session.
- **Status:** pending-verification (kept across review cycles until real-device measurement is performed; CONTRADICTION axis with existing §Future Migrations dvh entry — do not promote either way without on-device data)

### .archive.2026-05 — promoted findings (pruned 2026-05-06)
For traceability: the 2026-04-26 / 2026-04-27 / 2026-05-06 findings on Supabase JS auto-retries, auth.resend implicit-flow, Tailwind container-queries-today, Supabase Data API public-schema GRANT, Tailwind v4 browser cutoffs, useSyncExternalStore subscribe stability, and React 19.2 useEffectEvent were promoted into the relevant permanent sections during the 2026-05-06 weekly run. The CSS Dynamic Viewport Units (`h-dvh` / `h-svh` / `h-lvh`) finding was already covered by the existing "iOS Safari address-bar collapse" entry under §Future Migrations and the corresponding project-memory.md HIGH-priority known issue ("iOS Safari address-bar cuts off page CTAs (`vh` → `dvh`)") — duplicate, not re-promoted.
