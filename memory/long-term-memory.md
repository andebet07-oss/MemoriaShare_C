---
type: long-term-memory
updated: 2026-04-21T22:00Z
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

## PNG Frame Overlay Pipeline (Canonical, 2026-04-21)

Shipped in commit `d0db4cc`, hardened across `f808345` + `d3398ab` + `276562a`. Runs alongside the procedural (SVG `drawFrame()`) system — PNG frames are static-asset-authored designs; procedural frames are generated at runtime.

### Primitives
- **`src/functions/compositePngFrame.js`** — canvas compositor: photo + PNG overlay + optional text. Accepts `maxWidth`/`maxHeight` caps (required for preview cards).
- **`src/functions/detectHoleBbox.js`** — alpha-channel scan → returns `{ x, y, w, h }` of the transparent cutout. Replaces per-frame hand-coded coordinates for well-authored transparent PNGs.
- **`src/components/admin/FramePngPreview.jsx`** — real-time composite preview in admin grid (`600×900` cap).
- **`src/components/admin/FrameUploadDialog.jsx`** — batch ingestion + per-frame `text_config` JSONB metadata.
- **`src/functions/framesUtils.js::findApprovedFrameFromDB()`** — DB-first lookup with graceful local procedural fallback.

### Hardening rules (learned the hard way)
1. **`crossOrigin='anonymous'` is conditional.** Apply ONLY to Supabase-hosted (cross-origin) URLs. Applying to same-origin SVGs breaks them with CORS errors. Future image-loader code adjacent to this pipeline must enforce the same guard.
2. **Delete failed image-load promises from the cache on reject.** A naïve `imageCache.set(url, promise)` keeps the rejected promise forever — next call returns the same rejection without retrying. Rejection handler must `imageCache.delete(url)` so subsequent calls re-try.
3. **Cap canvas dimensions in preview mode.** Admin grid renders ~20 preview cards; unbounded 2400×3600 canvases per card caused memory thrashing. `compositePngFrame()` takes `maxWidth`/`maxHeight` args (preview = 600×900, export = native dimensions).
4. **CORS headers required on `/FRAMES/` in `vercel.json`.** Cross-origin-anonymous image loads will taint a canvas unless the server responds with `Access-Control-Allow-Origin`. Canvas taint makes `toDataURL` / `getImageData` throw SecurityError. If new public-asset directories ship (e.g. `/STICKERS/`), replicate the header block.

### Admin flow branching
- PNG frames skip the procedural rubric approval gate — they're approved as static assets with metadata, not scored designs.
- `FrameDetailPanel` branches: `frame.isPng ? <FramePngPreview /> : <canvas />`.
- Both paths write to the same `frames` table; `isPng` flag routes rendering.

### Frame library (as of 2026-04-21)
- 7 AI-designed SVG seeds (`06c353e`) — "white-elegant" procedural; live in code via seed pack.
- 8 transparent PNG polaroids from Figma (`f7def4d`).
- 71 Canva polaroid frames extracted from 6 sheet exports (`4e73962`) — bulk Canva sheet-to-PNG pipeline.
- All placeholder SVG seeds purged from `public/FRAMES/` (`c1df70f`).

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
*updated: 2026-04-22T18:00Z*

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
- **Memoria pattern:** `/FRAMES/` has explicit CORS headers (`d3398ab`) so `crossOrigin='anonymous'` works there. If adding a new public-asset path, replicate the header block.

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

---

## Performance Patterns
*updated: 2026-04-19T06:00Z*

### React 18 — Use `useSyncExternalStore` for external subscriptions; `useDeferredValue` for heavy filter inputs
- `useSyncExternalStore` is the canonical hook for subscribing to external stores (`matchMedia`, scroll position, third-party event emitters, Supabase realtime). Plain `useState + useEffect` can tear during concurrent renders; `useSyncExternalStore` is tear-safe.
- `useDeferredValue` / `useTransition` mark state updates as low-priority so typing/filter UIs remain responsive while heavy lists re-render in the background.
- **Where it applies to Memoria:** wrap `useRealtimeNotifications` / `useEventGallery` Supabase channel getters in a `useSyncExternalStore`-backed hook; wrap host-dashboard gallery filter query in `useDeferredValue` (measurable FPS win at >300 photos).
- **Source:** https://react.dev/reference/react/hooks.

### Canvas 2D — Three compounding gotchas that crash tabs on Android
1. **Non-integer `drawImage(x, y)`** coords trigger sub-pixel resampling — wrap placement coords with `Math.floor()` before `drawImage`.
2. **Each loaded font family costs ~15MB of glyph-raster cache**, held for page lifetime. Memoria currently loads 9 display fonts for stickers (~135MB) on top of base canvas (~8MB per 1920×1080). Trim to minimum; lazy-load rest per sticker pack.
3. **`ctx.fillText(sameString, ...)` re-shapes every frame.** For static sticker text, render once to an offscreen canvas keyed by `(text, type, size)`, then `drawImage` the bitmap on subsequent frames.
- **Where it applies to Memoria:** `MagnetReview.drawSticker()` + the canvas sticker renderer — directly affects Sticker System v2 drag/rotate FPS.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas + https://www.mirkosertic.de/blog/2015/03/tuning-html5-canvas-filltext/.

---

## WebRTC Camera Rules (extends CLAUDE.md §3.6)
*updated: 2026-04-19T06:00Z*

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

---

## Future Migrations / Hardening Follow-ups
*updated: 2026-04-19T06:00Z*

These are validated opportunities that are not actionable today but should be remembered when the relevant migration or hardening pass is scoped.

### Tailwind v4 — `scheme-dark` utility (when we migrate from v3.4)
Tailwind v4 ships `scheme-dark` / `scheme-light` utilities mapping to CSS `color-scheme`. Adding `scheme-dark` to `<body>` forces native chrome (scrollbars, form inputs, system dialogs, date pickers) into dark mode — eliminates the known "silvery light scrollbar on a dark page" paper-cut. Currently on `tailwindcss ^3.4.17`. When v4 migration is scoped, add `scheme-dark` to Layout `<body>` as a one-line fix.

### Supabase realtime — private channels with RLS on `realtime.messages`
Realtime Broadcast/Presence Authorization on private channels requires `@supabase/supabase-js ≥ v2.44.0`. Memoria is on v2.101.1 — capability is unlocked. Current `useRealtimeNotifications` / `useEventGallery` use public channels filtered by `event_id`. For share events requiring authenticated-host-only realtime visibility, private channels + RLS policy on `realtime.messages` would be a stronger security posture. Tracked as a hardening follow-up — not urgent.

---

## New Learnings (research-scout nightly — pending review)
*Last refreshed: 2026-04-22T22:00Z | Next review: 2026-04-27*

### Finding: 2026-04-21 — Supabase Realtime `postgres_changes` silently drops events for rows the subscribed user cannot SELECT via RLS — even if the table has INSERT/UPDATE/DELETE policies and is added to the publication
- **Source:** https://supabase.com/docs/guides/realtime/postgres-changes + https://github.com/supabase/supabase/issues/35195 + https://github.com/orgs/supabase/discussions/35196 + https://www.technetexperts.com/realtime-rls-solved/ + https://supabase.com/blog/realtime-row-level-security-in-postgresql
- **Finding:** The Realtime service listens to the database WAL via the `supabase_realtime` publication using a privileged internal role, then — before broadcasting each change to a subscribed client — impersonates that client and evaluates the table's RLS SELECT policy against the affected row. If the user cannot SELECT that row, the event is silently dropped. No error surfaces on the client; the subscription stays "connected" and other events continue to flow for rows the user CAN see. Symptom: "my subscription works for some rows but not others" or "realtime stopped working after I enabled RLS." Crucially, even apps that never call `.select()` on the table (e.g. write-only event logs) MUST still define a SELECT policy purely for Realtime visibility. Confirmed active behavior through 2026 — Supabase engineers reaffirmed it in issue #35195 and discussion #35196 this year.
- **Relevance:** Memoria's `useRealtimeNotifications` and `useEventGallery` subscribe to `postgres_changes` on the `photos` table filtered by `event_id`. If `photos` has a SELECT RLS policy that limits a guest to photos they uploaded (common design), real-time inserts by OTHER guests in the same event silently won't propagate — the gallery will look "frozen" for everyone but the uploader. This matches the no-error-but-nothing-happens failure class of the existing "Supabase RLS DELETE silently fails" and "signUp obfuscated user" entries. Potentially explains any prior "why isn't the gallery updating live?" intermittent report we haven't investigated. Also directly impacts MemoriaMagnet `PrintStation` if the operator's RLS SELECT scope is narrower than the realtime stream it subscribes to.
- **Action:** (1) Audit `CLEAN_RESET_SCHEMA.sql` — for every table subscribed to in `useRealtimeNotifications`, `useEventGallery`, and `PrintStation`, confirm a PERMISSIVE SELECT RLS policy exists that matches the realtime subscription filter scope. Specifically `photos`, `print_queue` (if present), and any notification table. (2) If a table has an "owner only" SELECT policy but the realtime feed needs to broadcast to ALL event guests, create a secondary policy like `CREATE POLICY "event_members_can_see_photos" ON photos FOR SELECT USING (event_id IN (SELECT event_id FROM event_members WHERE user_id = auth.uid()))` — or for anonymous-guest events, gate by a session token column. (3) Add to `Common Pitfalls`: "Supabase Realtime `postgres_changes` events are filtered by RLS SELECT — even INSERT/DELETE events require a matching SELECT policy for the row, or they silently never fire. No error, no warning." (4) When writing any new realtime subscription, the schema-audit checklist gains a line: "does the subscribed user have RLS SELECT visibility into every row the subscription will broadcast?"
- **Status:** pending-review

### Finding: 2026-04-21 — Supabase Realtime caches the access policy per-client at channel-subscribe time — RLS policy changes do NOT propagate to live subscribers until they reconnect or send a fresh JWT via `realtime.setAuth()`
- **Source:** https://supabase.com/docs/guides/realtime/authorization + https://supabase.com/docs/guides/realtime/getting_started + https://supabase.com/docs/reference/javascript/v1 (realtime authorization section)
- **Finding:** Supabase Realtime builds its RLS access-policy cache for a given client at two moments: (a) when the client first connects to a channel, and (b) when the client sends a new `access_token` message (via `supabase.realtime.setAuth(jwt)` or automatic JWT refresh). Between those events, the server evaluates inbound WAL changes against the CACHED policy snapshot — NOT the live policy. Consequence: if an admin runs `ALTER POLICY` or `DROP POLICY ... CREATE POLICY ...` on a table, every currently-connected subscriber continues to see events filtered by the OLD policy until their client reconnects or rotates its JWT. The same applies to role/claim changes (e.g. promoting a user to admin): Realtime won't honor the new permissions mid-session. Client-perceived symptom: "I updated the RLS and it works in SQL queries, but my dashboard still doesn't see new rows" — the fix is a page reload (which reconnects) or a forced `setAuth()` call.
- **Relevance:** Directly relevant to Memoria admin workflows. When Efi toggles a `photos` RLS policy, or when a host's role/claims change mid-session (e.g. upgrading from free to paid tier unlocks broader event visibility), the live dashboard WILL lag behind the database until refresh. Not a P0, but worth knowing before we ship any "live role change" feature. Also interacts with the already-documented "Supabase `getClaims()` uses JWKS locally" finding — rotating claims server-side doesn't invalidate any in-flight JWT until its TTL expires, compounding the stale-cache window. Companion to the Realtime SELECT-gate finding above (same day).
- **Action:** (1) NOT actionable today — no workflow currently depends on live RLS/claim changes. (2) When we scope host tier upgrades or mid-session admin promotion, add an explicit `supabase.realtime.setAuth(jwt)` call in the flow to force the Realtime server to re-evaluate access against the new claims — don't rely on the next JWT auto-refresh (can be up to 1h). (3) Document as a sub-bullet under `Future Migrations / Hardening Follow-ups`: "mid-session RLS / claims change requires explicit `realtime.setAuth()` to refresh per-client policy cache, otherwise Realtime filters against stale snapshot until reconnect." (4) Pairs with the `onAuthStateChange` deadlock finding — if we DO call `setAuth` in response to an auth event, wrap it in `setTimeout(fn, 0)` to sidestep the known auth-lock re-entrancy bug.
- **Status:** pending-review

### Finding: 2026-04-20 — iOS Safari: a 2nd `getUserMedia()` call silently mutes the prior track — must `track.stop()` before switching cameras
- **Source:** https://webrtchacks.com/guide-to-safari-webrtc/ + https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia + https://github.com/jeeliz/jeelizFaceFilter/issues/15
- **Finding:** On iOS Safari (all versions through 2026), if `getUserMedia()` is invoked a second time for a media type already in use by a previously-acquired track, WebKit sets the previous track's `muted` property to `true` with no way to programmatically unmute. Symptom: calling `getUserMedia({ video: { facingMode: 'environment' } })` to switch from front to back camera produces a new stream AND mutes the existing stream — if any other component still references the old track, its video feed freezes black. Documented in multiple libraries (jeeliz, twilio-video) as the root cause of "camera works once, breaks on second tap." Correct pattern: `currentStream.getTracks().forEach(t => t.stop())` BEFORE the second `getUserMedia()` call, OR use `MediaStream.clone() / addTrack() / removeTrack()` to branch from a single acquired stream without re-calling `getUserMedia()`. Chrome/Firefox desktop + Android do NOT exhibit this behavior — iOS-specific.
- **Relevance:** CameraCapture.jsx (Share) and MagnetCamera.jsx (Magnet) both use `facingMode` constraints. If/when we add a front/back toggle button (currently Magnet is environment-only, Share may add selfie support), the naive implementation — "call `getUserMedia` again with flipped facingMode" — will silently mute the previous preview on every iOS tap, producing a frozen viewfinder that looks like a crashed camera. This is a companion gotcha to the existing "iOS standalone PWA breaks getUserMedia" and "iOS randomizes deviceId" entries — same root cause (WebKit fingerprinting/privacy posture) but a distinct failure mode.
- **Action:** (1) Before ANY camera-switch feature is shipped (front/back toggle, device picker), implement the stop-then-reacquire pattern: `streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = await navigator.mediaDevices.getUserMedia(newConstraints);`. (2) Add to CLAUDE.md §3.6 WebRTC Camera Rules as a new rule: "Before re-calling `getUserMedia` with changed constraints (e.g. facingMode flip), stop all tracks on the existing stream. Failing to do so silently mutes the old track on iOS Safari." (3) If a future feature needs both tracks simultaneously (e.g. PiP selfie + main scene), use `MediaStream.clone()` on a single acquired stream — do NOT call `getUserMedia` twice. (4) Test any camera-switch flow on a real iPhone BEFORE merging — the failure mode does NOT reproduce on desktop Chrome DevTools device emulation.
- **Status:** pending-review

### Finding: 2026-04-20 — Tailwind CSS v4.1 ships `user-valid:` / `user-invalid:` variants, `text-shadow-*`, `mask-*`, `wrap-break-word`, safe alignment
- **Source:** https://tailwindcss.com/blog/tailwindcss-v4-1 + https://tailwindcss.com/docs (v4 docs) + https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md
- **Finding:** Tailwind v4.1 (released 2025) adds several utilities relevant to Memoria's surfaces: (a) **`user-valid:` / `user-invalid:` variants** — apply styles only AFTER the user has interacted with a form field, fixing the "everything red on page load" anti-pattern that plain `:invalid` produces for required fields. (b) **`text-shadow-2xs` … `text-shadow-lg`** — five preset text shadows in the default theme (previously required custom CSS or plugins). (c) **`mask-*` utilities** — compose gradient/image masks with ergonomic APIs (useful for photo fade-outs and sticker-edge feathering). (d) **`wrap-break-word` / `overflow-wrap` utilities** — cleanly break long Hebrew words or URLs inside cards. (e) **Safe alignment** utilities (`justify-start-safe`, `items-center-safe`, etc.) prevent flex/grid children from overflowing the container when content exceeds the track. (f) New variants: `noscript:`, `user-valid:`, `inverted-colors:` (maps to macOS/iOS display accommodation), `details-content:`. Currently on `tailwindcss ^3.4.17` — none of these are available yet.
- **Relevance:** Two immediate Memoria wins waiting on v4 migration: (1) MagnetLead 4-step wizard + CreateEvent form — swapping `:invalid` styling for `user-invalid:` eliminates the "red borders on empty form" jarring first-render state (current workaround is JS-side `touched` state per field, adds complexity). (2) Sticker text rendering in MagnetReview could use `text-shadow-*` utilities in any future HTML-preview mode (the canvas composite path has its own stroke logic, unrelated). The `mask-*` utilities are also a candidate for cover-image fade-to-black treatments in `MagnetGuestPage`. This is an enrichment of the existing "Tailwind v4 — `scheme-dark`" and "Tailwind v4 native `@container` queries" follow-ups, not a new migration driver.
- **Action:** Append a sub-bullet to `Future Migrations / Hardening Follow-ups → Tailwind v4`: "when v4 migration is scoped, ALSO (a) replace any JS-side `touched` form-validation tracking with `user-valid:` / `user-invalid:` variants (start with MagnetLead + CreateEvent), (b) evaluate `text-shadow-*` and `mask-*` for cover-image and sticker-preview surfaces, (c) audit flex/grid overflow bugs — the `-safe` alignment suffixes may fix them without bespoke `min-w-0` workarounds." NOT actionable today.
- **Status:** pending-review

### Finding: 2026-04-20 — React Compiler v1.0 stable (Oct 2025) auto-memoizes; replaces manual `useMemo` / `useCallback` / `React.memo`
- **Source:** https://react.dev/blog/2025/10/07/react-compiler-1 + https://react.dev/learn/react-compiler/introduction + https://certificates.dev/blog/react-compiler-no-more-usememo-and-usecallback
- **Finding:** React Compiler v1.0 shipped stable October 2025 (previously "React Forget"). It's a build-time Babel/SWC plugin that analyzes components and inserts memoization automatically — at finer granularity than the manual hooks. Replaces almost all hand-written `useMemo`, `useCallback`, and `React.memo`. Hooks remain as escape hatches for edge cases where the compiler can't infer intent (e.g. referential equality required across a library boundary). Real-world measurements from Meta Quest Store: +12% initial load, +2.5× interaction speed, neutral memory. Works with React 17+ in opt-in mode, default-on with React 19. Opt-out per-file with `'use no memo'` directive; opt-in per-file with `'use memo'` directive.
- **Relevance:** Memoria currently hand-writes `useCallback`/`useMemo` across `useEventGallery`, `useRealtimeNotifications`, `CameraCapture.jsx`, `MagnetReview.jsx`, and `Dashboard.jsx` — both for correctness (stable refs feeding effect dep arrays) and for perf. The compiler would eliminate most of that boilerplate AND catch cases where we forgot (which are currently invisible FPS losses on mid-range Android). Also directly complements the existing "Canvas 2D — three compounding gotchas" performance rule — the compiler can't fix canvas-side perf, but it does fix the React-side re-render pressure that currently compounds with canvas cost. NOT actionable today (we're on React 18; compiler usable but pairs best with the React 19 upgrade already tracked in the `useEffectEvent` finding above).
- **Action:** (1) Bundle React Compiler adoption INTO the React 19 upgrade plan (don't introduce separately on React 18 — too much churn for one-version lifespan). (2) Pre-req audit: run `react-compiler-runtime`'s ESLint plugin (`eslint-plugin-react-compiler`) against the current codebase on a branch to surface Rules-of-React violations that block auto-memoization (non-pure render paths, mutation-during-render, etc.) — fixing these is valuable even BEFORE compiler adoption. (3) Post-adoption, delete manual `useCallback`/`useMemo` only where the linter confirms the compiler handled it — don't bulk-strip. (4) Keep `useMemo` / `useCallback` as documented escape hatches.
- **Status:** pending-review

### Finding: 2026-04-20 — Tailwind stacked range variants `md:max-lg:` target a single breakpoint band (no config change)
- **Source:** https://tailwindcss.com/docs/responsive-design (Targeting a breakpoint range section) + https://v3.tailwindcss.com/docs/responsive-design
- **Finding:** Tailwind's min-width-only breakpoints mean `md:text-sm` cascades up to lg, xl, 2xl. To apply a utility ONLY in a single band (e.g. tablet-but-not-desktop), stack a `max-*` variant: `md:max-lg:text-sm` applies from md through the pixel before lg and is reset automatically above lg. Also `max-md:text-sm` alone applies from 0 through the pixel before md. This is DIFFERENT from the `min-[Npx]:` / `max-[Npx]:` arbitrary-value variants already documented (2026-04-19 finding) — those are for one-off pixel thresholds; the stacked `md:max-lg:` pattern is for the standard breakpoint ladder. No config change; works in Tailwind v3.2+. Common pitfall: developers reach for JS-side window-width checks to get "tablet only" styling when `md:max-lg:` does it in pure CSS with zero runtime cost.
- **Relevance:** Memoria has several surfaces that render differently at tablet widths vs. phone AND vs. desktop — `EventCard` grid column count, `AdminShell` sidebar width, `PrintStation` queue card density. Current approach is either an explicit `lg:` override (which leaks into wider screens) or a `useWindowSize` hook + JS branching (which tears during resize). The stacked range variants give a clean declarative way to scope tablet-band styling without resorting to JS or bespoke `min-[Npx]:` thresholds.
- **Action:** (1) Add a one-line note under CLAUDE.md §3.1 Mobile-First Design: "for single-breakpoint bands (e.g. tablet-only), prefer stacked range variants `md:max-lg:*` over JS-side `useWindowSize`". (2) No immediate refactor — apply opportunistically on the next `EventCard` / `PrintStation` layout touch. (3) This complements, does not replace, the existing `min-[Npx]:` / `max-[Npx]:` guidance — both have their slot (arbitrary variants for true outliers, stacked range for standard breakpoint bands).
- **Status:** pending-review

### Finding: 2026-04-20 — Supabase `signUp()` with unverified email returns a `user` object with no `session` — must NOT treat presence of `user` as "signed in"
- **Source:** https://github.com/supabase/supabase/issues/33325 + https://supabase.com/docs/guides/auth/passwords + https://supabase.com/docs/reference/javascript/auth-signup
- **Finding:** When "Confirm email" is enabled in the Supabase dashboard (Memoria's default, per our brand-protected host onboarding), `supabase.auth.signUp({ email, password })` returns `{ data: { user: <obfuscated user object>, session: null }, error: null }` — even when the password is wrong or the email already exists with a different password. The `user` object is populated with a fake identity (`obfuscated id`, `email_confirmed_at: null`, no real claims) as a security measure to prevent email enumeration attacks. If the front-end treats `data.user != null` as a successful signup, the user sees a "check your email" confirmation screen but never receives an email (because the address was already taken or the password mismatched), producing a silent-fail UX. The correct signal is `data.session != null` for immediate sign-in, or `data.user && !data.user.identities?.length` to detect the "email already exists" case. Also: passwords <6 chars return a clear error, but the obfuscated-user response path is the subtle trap.
- **Relevance:** Memoria host signup flow (and any future MagnetLead host-claim flow) uses Supabase email + password. If we currently branch on `if (data?.user) showConfirmEmailScreen()`, this finding means we've been silently swallowing the "email already in use" case and showing a confirmation screen that will never deliver an email — a plausible cause of support-contact volume we haven't investigated. Directly relevant to the `Common Pitfalls` section (companion to the existing "Supabase RLS DELETE silently fails" entry — same pattern of no-error-but-nothing-happens).
- **Action:** (1) Audit the host signup handler (likely `@/lib/AuthContext` or a signup page calling `supabase.auth.signUp`) — verify it checks `data.session` AND `data.user.identities?.length > 0`, not just `data.user`. (2) If email-already-taken is detected (user object with empty `identities` array), render a Hebrew error: `כתובת האימייל כבר רשומה — נסה/י להתחבר או לאפס את הסיסמה` with links to login + password-reset. (3) Document under `Common Pitfalls`: "Supabase `signUp()` returns obfuscated user for security — never treat `data.user` alone as signup success. Check `data.session` (immediate sign-in) or `data.user.identities.length` (new email vs. collision)."
- **Status:** pending-review

### Finding: 2026-04-19 — React `useEffectEvent` (stable in 19, experimental in 18.3) for latest-value access inside effects
- **Source:** https://react.dev/learn/separating-events-from-effects + https://allthingssmitty.com/2025/12/01/react-has-changed-your-hooks-should-too/
- **Finding:** `useEffectEvent` wraps a function so it always sees the latest props/state when the wrapped Effect runs, WITHOUT being added to the effect's dependency array. This replaces the old "stale closure workaround" of stuffing every referenced value into deps (which re-runs the effect) or using `useRef` to shadow state (which bypasses reactivity). In React 18.3 it is still under `experimental_useEffectEvent`; promoted to stable in React 19.
- **Relevance:** Memoria's `useRealtimeNotifications`, `useEventGallery`, and the `CameraCapture` WebRTC cleanup all have dependency-array gymnastics where a handler needs the latest `event`/`photos` but must not re-subscribe when they change. Current pattern uses `useRef` shadows (see e.g. the `pendingPhotosRef` pattern in the CameraCapture rules). `useEffectEvent` would make intent explicit and remove the shadow-ref boilerplate.
- **Action:** NOT actionable today — Memoria is on React 18 and the hook is experimental there. Promote to active rule when the React 19 upgrade is scoped. In the meantime, continue the `useRef`-shadow pattern and document it as the React-18-era equivalent.
- **Status:** pending-review

### Finding: 2026-04-19 — Tailwind arbitrary breakpoint variants `min-[Npx]:` / `max-[Npx]:` (works in v3.4, no config change)
- **Source:** https://tailwindcss.com/docs/responsive-design (Arbitrary values section) + https://v3.tailwindcss.com/docs/responsive-design
- **Finding:** Tailwind v3.2+ supports arbitrary min/max variants inline: `<div class="min-[375px]:text-sm max-[600px]:bg-card">`. No `tailwind.config.js` `screens` extension needed. Also supports `max-sm:` / `max-md:` (desktop-first overrides) which were NOT in v3.0. Crucially, mixing px/rem across breakpoints can cause generated utilities to sort in an unexpected order — always use one unit.
- **Relevance:** Memoria's mobile-first rule (CLAUDE.md §3.1) is strict — but there are ~5 places where a feature needs a *between-375-and-414px* iPhone-SE-specific tweak that doesn't fit `sm:`/`md:`. Current workaround is bespoke wrapper divs or inline `style`. The `min-[Npx]:` variant lets us handle one-off breakpoints without polluting the Tailwind config or violating the "utility-only" rule.
- **Action:** (1) Green-light `min-[Npx]:` / `max-[Npx]:` for one-off breakpoints where adding a named screen would be overkill. (2) Constrain: do NOT use them as a *replacement* for the standard `md:`/`lg:` ladder — only for true outliers (iPhone-SE 375px, PrintStation 1600px+ kiosk, etc.). (3) Always use `px` (matches our existing `@screen` values), never mix `rem` + `px`. Add a one-line clarification to CLAUDE.md §3.1 once reviewed.
- **Status:** pending-review

### Finding: 2026-04-19 — Supabase PKCE auth-code validity is 5 minutes, single-use; failed exchange invalidates the code
- **Source:** https://supabase.com/docs/guides/auth/sessions/pkce-flow + https://supabase.com/docs/guides/auth/debugging/error-codes
- **Finding:** When using the PKCE flow (the default for magic-link, OAuth, and password-reset callbacks in Supabase JS v2), the `code` query param delivered to the redirect URL is valid for **5 minutes** and can be exchanged **exactly once** via `supabase.auth.exchangeCodeForSession(code)`. A second exchange attempt — e.g. React 18 Strict Mode double-mount, or a user who refreshes the callback page — returns `invalid_grant` / `flow_state_not_found` and kills the session setup. Symptom: "magic link worked on desktop but fails on my phone" (user opened the link, got to the app, then refreshed).
- **Relevance:** Memoria host login flow uses Supabase email (magic-link-capable) auth. The host callback route MUST guard against a double `exchangeCodeForSession` call in React 18 Strict Mode dev, AND must render a recoverable "הקישור פג תוקף — בקש/י קישור חדש" Hebrew error state on refresh rather than a blank/auth-error white screen. Also relevant for any future MagnetLead "invite by email" flow.
- **Action:** (1) Audit the Auth callback route in `@/lib/AuthContext` or the callback page that calls `exchangeCodeForSession` — wrap in a `useRef`-guarded `didExchange.current` flag to survive Strict Mode double-mount. (2) Catch the `invalid_grant` error and render a Hebrew re-request UI (link to re-send magic link), NOT a terminal error. (3) Document as a rule under `Common Pitfalls`.
- **Status:** pending-review

### Finding: 2026-04-19 — Tailwind CSS v4 native `@container` queries (component-level responsiveness)
- **Source:** https://tailwindcss.com/docs/responsive-design + https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/
- **Finding:** Tailwind v4 ships container queries natively (`@container` parent + `@sm:`/`@lg:` child variants); the `tailwindcss-container-queries` plugin is no longer required. Variants are mobile-first and support `@max-*` ranges.
- **Relevance:** Memoria has reusable cards/components (e.g. `EventCard`, `MagnetEventCard`, KPI tiles) that render in BOTH wide gallery grids and narrow side panels — viewport breakpoints (`md:`, `lg:`) misfire because they react to viewport, not container width. Container queries fix the "card looks great in grid, breaks in sidebar" failure mode without per-context wrapper overrides.
- **Action:** Append a sub-bullet to the existing `Future Migrations / Hardening Follow-ups → Tailwind v4` block: when v4 migration is scoped, audit `EventCard` / KPI tiles / `MagnetEventCard` for viewport-keyed Tailwind classes that should become `@container`-keyed. NOT actionable today (still on `tailwindcss ^3.4.17`); promote to active rule only after v4 cutover.
- **Status:** pending-review

### Finding: 2026-04-19 — Supabase `getClaims()` is the new preferred verification method (asymmetric JWT signing keys)
- **Source:** https://supabase.com/docs/reference/javascript/auth-getclaims + https://supabase.com/docs/guides/auth/signing-keys + https://github.com/supabase/supabase/issues/40985
- **Finding:** `supabase.auth.getClaims()` (added alongside Supabase's asymmetric JWT signing keys, 2025) verifies the access-token JWT **locally** against the cached `/.well-known/jwks.json` JWKS endpoint — no Auth-server round-trip per call. `getUser()` always hits the Auth server (DB query); `getSession()` reads localStorage with NO server-side validation and is unsafe to trust as identity. The Supabase team is actively recommending `getClaims()` in place of `getUser()` whenever real-time ban/deletion detection is not required.
- **Relevance:** Memoria's `useAuth()` (in `@/lib/AuthContext`) almost certainly currently relies on `getSession()` / `getUser()` for the host-dashboard auth gate. Switching the per-render identity check to `getClaims()` would eliminate one Auth-server round-trip per protected page navigation — meaningful at scale and on slow mobile connections. Also relevant if/when Memoria adds Edge Functions that need to verify the caller JWT (use `getClaims()` not `getUser()`).
- **Action:** (1) Audit `@/lib/AuthContext` to confirm which method it currently calls; if `getUser()` is invoked on every protected mount, plan a swap to `getClaims()` (keep `getUser()` only for the post-login refresh path). (2) When Edge Functions are introduced, default to `getClaims()` for caller verification. (3) Pre-req: confirm Memoria's Supabase project has migrated to **asymmetric** JWT signing keys (Project Settings → JWT Keys) — `getClaims()` requires this.
- **Status:** pending-review

### Finding: 2026-04-19 — iOS Safari standalone PWA mode breaks `getUserMedia` (camera silently unavailable)
- **Source:** https://developer.apple.com/forums/thread/89981 + https://simicart.com/blog/pwa-camera-access/
- **Finding:** When a user adds Memoria to their iOS home screen and launches it in **standalone PWA mode** (`display: standalone` in `manifest.json`), WebKit does NOT prompt for camera permission and `navigator.mediaDevices.getUserMedia()` silently fails — the OS behaves as if no camera exists. The in-Safari-tab version works fine; only the home-screen-launched PWA mode is broken. Apple has not fixed this as of 2025/2026. Android Chrome PWAs are unaffected.
- **Relevance:** This is a **P0 bug for MemoriaMagnet** — guests scan the event QR, tap "Add to Home Screen" on iPhone (per luxury UX guidance), then launch the home-screen icon → camera silently fails → empty print queue. Also affects any MemoriaShare guest that adds the site to their iOS home screen before uploading. Memoria's `public/manifest.json` uses `display: standalone`.
- **Action:** (1) Detect standalone PWA mode via `window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true` AND `navigator.userAgent` includes `iPhone|iPad`. (2) On Magnet guest page / Share upload page, if standalone iOS detected, render a Hebrew banner: "פתח/י את הדף ב-Safari (לא מהקיצור במסך הבית) כדי לאפשר גישה למצלמה" with a "העתק קישור" button. (3) Consider switching `manifest.json` `display` to `browser` OR `minimal-ui` for Magnet guest routes specifically — trades off PWA chrome for a working camera. Needs PM call. (4) Add to `Common Pitfalls` once reviewed.
- **Status:** pending-review

### Finding: 2026-04-19 — iOS Safari randomizes `deviceId` per page load — never persist camera selection
- **Source:** https://webrtchacks.com/guide-to-safari-webrtc/ + https://www.webrtc-developers.com/managing-devices-in-webrtc/
- **Finding:** As a WebKit fingerprinting-resistance measure, `MediaDeviceInfo.deviceId` values are **regenerated on every page load** in iOS Safari. Storing a user's selected `deviceId` in localStorage / Supabase profile for "remember my camera choice" is a no-op on iOS — the stored ID is invalid on the next session and `getUserMedia({ video: { deviceId: { exact: saved } } })` throws `OverconstrainedError`. Chrome/Firefox desktop/Android persist deviceIds across sessions on the same origin after permission is granted; only iOS Safari randomizes.
- **Relevance:** If/when Memoria adds a front/back or multi-camera picker UI (Android tablets in `PrintStation`, iPad kiosk mode), we cannot rely on `deviceId` for persistent selection on iOS. We must select by `facingMode: 'user' | 'environment'` (already does this for Magnet/Share guest cameras — correct) or by enumerating devices fresh on every mount. Relevant now: any code that caches the `deviceId` of the chosen camera across navigations will break silently on iOS.
- **Action:** (1) Audit `CameraCapture.jsx` and `MagnetCamera.jsx` — confirm camera selection uses `facingMode`, NOT cached `deviceId`. (2) If future multi-camera picker is built for `PrintStation`, always `enumerateDevices()` on mount and match by `label` + `kind` substring, never by stored `deviceId`. (3) Never write `deviceId` to Supabase user profile / localStorage as a "preferred camera" — document under WebRTC Camera Rules.
- **Status:** pending-review

### Finding: 2026-04-19 — OffscreenCanvas + ImageBitmap cache for canvas text rasterization (~2× FPS in sticker UIs)
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas + https://www.mirkosertic.de/blog/2015/03/tuning-html5-canvas-filltext/ + https://copyprogramming.com/howto/html-canvas-and-memory-usage
- **Finding:** Two compounding canvas performance patterns now broadly supported (Safari 16.4+, 2023): (1) **OffscreenCanvas** transfers rendering to a Web Worker via `canvas.transferControlToOffscreen()` — main thread no longer blocks on paint. (2) **Text bitmap caching**: render each static sticker text glyph once to a 1× offscreen `<canvas>` keyed by `(text, fontFamily, size, fill, stroke)`, cache the resulting `ImageBitmap` in a `Map`, then `ctx.drawImage(cachedBitmap, x, y)` on every frame instead of re-running `ctx.fillText()` + `ctx.strokeText()` (which re-shapes glyphs from scratch every frame). Measured ~2× FPS on mid-range Android for draggable text overlays with ≥5 stickers on screen. Note: unmanaged `ImageBitmap` / `Image` objects account for ~68% of canvas memory leaks — always `bitmap.close()` (or drop the Map reference) when cache size exceeds a cap.
- **Relevance:** Directly applicable to `MagnetReview.jsx` sticker drag/rotate. Our existing Canvas 2D rules already note that `fillText(sameString, ...)` re-shapes every frame — this finding provides the concrete implementation pattern (OffscreenCanvas + ImageBitmap cache, with a bounded LRU) and adds the Web Worker offload angle. The Web Worker tier is extra work and NOT needed for ≤10 stickers, but the bitmap cache pattern IS worth implementing now.
- **Action:** (1) Implement a `stickerTextBitmapCache` Map in `MagnetReview.jsx` / `drawSticker()` keyed by sticker signature; bound to ~100 entries (LRU evict + `bitmap.close()`) to avoid the Image-object memory-leak class. (2) Defer the OffscreenCanvas + Worker tier until/unless sticker count grows past ~15 on screen — adds complexity (message passing, fallback for Safari <16.4) that isn't justified today. (3) Document the bitmap-cache pattern as a concrete companion to the existing "Canvas 2D — Three compounding gotchas" rule.
- **Status:** pending-review

### Finding: 2026-04-21 — CSS `dvh` / `svh` / `lvh` viewport units fix the "iOS Safari address-bar jumps and cuts off camera UI" bug — now Baseline Widely Available (Tailwind v3.4+ ships `h-dvh` / `h-svh` / `h-lvh` utilities)
- **Source:** https://ishadeed.com/article/new-viewport-units/ + https://zenn.dev/tonkotsuboy_com/articles/svh-dvh-lvh-for-all-browser?locale=en + https://tailscan.com/blog/tailwind-css-dynamic-viewport-unit-classes + https://developer.mozilla.org/en-US/docs/Web/CSS/length
- **Finding:** Three viewport-height units specifically designed for mobile browser chrome: (1) **`svh`** = Small viewport height — computed AS IF the browser chrome (address bar, toolbar) is fully expanded. Use for "must fit on first paint" surfaces. (2) **`lvh`** = Large viewport height — computed AS IF chrome is fully collapsed. Use for "can fill the screen once user scrolls". (3) **`dvh`** = Dynamic viewport height — re-computed in real time as chrome shows/hides. Use for live-full-screen surfaces that must stay full-screen regardless of scroll state. All three reached **Baseline Widely Available** in June 2025 (Chrome 108+, Firefox 101+, Safari 15.4+, Edge 108+) — ~95%+ of Memoria's mobile audience by 2026-04. The long-standing `vh` unit is broken on iOS Safari because it resolves to `lvh` (chrome-hidden height), so `h-screen` / `min-h-screen` on a full-page layout causes the bottom ~50-80px to be cut off below the expanded address bar on page load until the user scrolls. Tailwind v3.4+ ships utilities out of the box: `h-dvh`, `h-svh`, `h-lvh`, `min-h-dvh`, `min-h-svh`, `min-h-lvh`, and their width cousins `w-dvw` / `svw` / `lvw`. No config change required on our `tailwindcss ^3.4.17`.
- **Relevance:** Direct hit on two known Memoria pain points. (1) **CameraCapture.jsx + MagnetCamera.jsx** — both use `fixed inset-0` (per CLAUDE.md §3.6) so they're insulated from the `vh` bug. But any full-screen modal or dialog that uses `min-h-screen` on iOS Safari Mobile IS cut off by the expanded address bar. (2) **Page roots across the app** — `MagnetGuestPage`, `EventGallery`, `Dashboard`, `Home`, `MagnetLead`, `CreateEvent`, `EventSuccess` all use `min-h-screen` somewhere in the page shell gradient. On iOS Safari on first load, the bottom CTA button on `MagnetLead` step 4 and the "בקש קישור" button on `EventSuccess` can both be cut by the address bar — matches support-contact reports we haven't investigated. Pairs with the existing "iOS Safari randomizes deviceId" / "iOS standalone PWA breaks getUserMedia" family of iOS WebKit paper cuts.
- **Action:** (1) Append a rule to CLAUDE.md §3.1 Mobile-First Design: "for full-page shells, prefer `min-h-dvh` over `min-h-screen` so iOS Safari's collapsing address bar doesn't cut off bottom CTAs. Use `min-h-svh` when the surface must NOT grow (e.g. login card — shouldn't gain dead space when chrome hides)." (2) Bulk-replace `min-h-screen` → `min-h-dvh` on: `MagnetLead`, `EventSuccess`, `MagnetGuestPage`, `Home`, `CreateEvent`, `Dashboard`, `EventGallery` page roots. Leave `min-h-svh` for tightly-sized centered forms (login, 1-step modals) where growth would push the card off-center when the address bar hides. (3) For the floating bottom bar pattern in `MagnetLead` step 4 + `MagnetCamera` controls, continue using `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + Npx)` as already documented — the viewport unit swap complements but does not replace safe-area insets. (4) Add to UI Anti-patterns: "bare `h-screen` / `min-h-screen` on iOS-reachable surfaces — use `h-dvh` / `min-h-dvh` instead".
- **Status:** pending-review

### Finding: 2026-04-21 — Supabase `onAuthStateChange` callback deadlocks the entire client if it awaits ANY supabase-js method — officially-warned foot-gun, one-line workaround with `setTimeout(..., 0)`
- **Source:** https://supabase.com/docs/reference/javascript/auth-onauthstatechange + https://github.com/supabase/auth-js/issues/762 + https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0 + https://github.com/supabase/supabase-js/issues/2013
- **Finding:** There is a documented re-entrancy deadlock in `supabase-js`: if the `onAuthStateChange` callback is `async` and `await`s any other method on the same Supabase client (`.from()`, `.storage.upload()`, `.auth.getUser()`, etc.), the internal auth lock is still held when the inner call tries to acquire it → the inner call hangs forever, AND every subsequent call from any other code path using that client ALSO hangs indefinitely. The app goes silent — no error, no timeout, just frozen data fetches. Symptom diagnosed from user reports: "after the user signs in, all queries stop returning; reload fixes it until next auth event". The Supabase team officially warns against async callbacks here, and the sanctioned workaround is to defer any Supabase work to a new macrotask: `onAuthStateChange((event, session) => { setTimeout(async () => { /* supabase calls here */ }, 0); })`. Confirmed active bug in supabase-js as of 2026; present in all v2.x releases.
- **Relevance:** `@/lib/AuthContext` almost certainly subscribes to `onAuthStateChange` to populate host profile on sign-in (fetching the user's events, quotas, role). If that callback is `async` and awaits a `supabase.from('profiles').select()` or `memoriaService.getMyEvents()`, Memoria is one race away from a production hang affecting every host post-login — no error in Sentry, no crash, just a dead dashboard. This is the same "no-error-but-nothing-happens" failure class as the existing "Supabase RLS DELETE silently fails" and "signUp with unverified email returns obfuscated user" entries — deserves a peer slot in `Common Pitfalls`.
- **Action:** (1) Audit `@/lib/AuthContext` NOW — read the `supabase.auth.onAuthStateChange` subscription and confirm either (a) the callback is synchronous and schedules nothing that awaits supabase-js, or (b) any post-event Supabase work is wrapped in `setTimeout(fn, 0)`. If async + awaits-supabase is present, this is a latent P0. (2) If a refactor is needed, the canonical shape is: `onAuthStateChange((event, session) => { setState({ session, user: session?.user ?? null }); setTimeout(() => loadProfile(session?.user?.id), 0); })` — update auth state synchronously, dispatch async profile fetch to next tick. (3) Add to CLAUDE.md §2 Tech Stack Rules → Authentication: "never await a supabase-js method inside an `onAuthStateChange` callback; wrap in `setTimeout(fn, 0)` to avoid the internal auth-lock deadlock". (4) Add to `Common Pitfalls`: "Supabase `onAuthStateChange` + `async` callback + `await supabase.*` = whole-client deadlock with no error. One-tick setTimeout is the workaround."
- **Status:** pending-review

### Finding: 2026-04-22 — Supabase SSR session refresh + ISR / CDN caching = cross-user token leak (cached Set-Cookie served to the wrong user signs them in as someone else)
- **Source:** https://supabase.com/docs/guides/auth/server-side/advanced-guide + https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV + https://github.com/supabase/supabase-js/issues/1396 + https://github.com/supabase/ssr/issues/36
- **Finding:** When `@supabase/ssr` (or any server-side Supabase code path) refreshes a session token, it emits a `Set-Cookie` header on the response carrying the fresh access/refresh JWT. If that response is then cached — by Next.js ISR (`revalidate: N`), a static export at the edge, Vercel Edge Cache, Cloudflare, or CloudFront — the cached HTTP response **includes the Set-Cookie header**. Every subsequent cache hit delivers User A's refreshed JWT to User B's browser, which stores it and is now silently signed in as User A. The bug is invisible client-side (no error, successful navigation), manifests as "random users report seeing other people's events/photos/emails," and is classed as a critical data-exposure incident. Prevention: (a) `export const dynamic = 'force-dynamic'` on any auth-touching route, (b) `Cache-Control: no-cache="Set-Cookie"` to scope the no-cache to that header (CloudFront syntax), (c) never enable ISR/static-rendering on routes that can trigger a session refresh. A second, related server-side risk on Vercel Fluid Compute: module-scoped Supabase clients are reused across warm-container requests from different users — one user's session object can leak into another user's request. Always create the client inside the request handler, never at module scope.
- **Relevance:** Memoria is a Vite SPA today (client-only, no SSR), so the ISR variant of this bug CANNOT hit us in current production — session refresh happens in the browser, and the Vercel CDN never sees a `Set-Cookie` from our app. BUT: (1) we are one "move auth callback to an Edge Function / server route" refactor away from introducing the risk — e.g. magic-link callback, MagnetLead email invite handoff, or any future SSR migration for SEO. (2) The module-scope-client warning DOES apply to any Supabase Edge Functions we ship (Magnet order webhook, print-queue notifier) — if any of those construct a `createClient(...)` at the top of the file and ever set a user session on it, that instance can be reused across cold-start reuse. (3) This is the same no-error-silent-failure class as the existing "Supabase RLS DELETE silently fails" and "signUp obfuscated user" findings, BUT it's a confidentiality breach rather than a UX bug — warrants a stronger placement than Common Pitfalls. Note that the "Vercel auto-deploys on main" rule in CLAUDE.md §5 means any future SSR/Edge Function landing on main ships to production immediately — the guard must be in place BEFORE the refactor, not after.
- **Action:** (1) Do NOT introduce Next.js or any SSR framework to Memoria without adding `export const dynamic = 'force-dynamic'` (or Remix/Router equivalent) to every auth-touching route AS PART OF THAT PR. Document the rule inline in the migration plan. (2) Add to CLAUDE.md §5 Git & Deployment Discipline as a new bullet: "any server-rendered or Edge-Function route that can read/refresh a Supabase session MUST opt out of CDN caching. Never ship ISR / static export on auth-reachable routes." (3) Any Supabase Edge Function we write must create the Supabase client *inside* the handler (`Deno.serve((req) => { const supabase = createClient(...); ... })`), never at module scope — reusing a client across requests with different users is a cross-tenant auth leak. (4) When writing the magic-link callback handler (currently SPA-side; if we ever move it), PKCE token exchange must set the session on a per-request client. (5) Add to `Common Pitfalls` once reviewed: "Supabase SSR + ISR/CDN cache = cross-user token leak. Force dynamic on auth routes. Module-scope clients on warm containers leak sessions."
- **Status:** pending-review

### Finding: 2026-04-22 — Tailwind `@container` queries: `container-type: size` breaks auto-height layouts — always use `container-type: inline-size` (the Tailwind `@container` utility default) unless you specifically need `@height-*`
- **Source:** https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/ + https://strapi.io/blog/replace-complex-media-queries-with-tailwind-container-queries + https://tailwindcss.com/docs/responsive-design + https://developer.mozilla.org/en-US/docs/Web/CSS/container-type
- **Finding:** CSS container-query support has two container-type modes: `inline-size` (queries the container's width only, preserves intrinsic block-axis sizing) and `size` (queries both width AND height, but **forces the container to establish a block-axis containment context** — which strips out auto-height behavior and freezes the container to whatever explicit height it has, or 0 if none). Setting `container-type: size` on a flex/grid child that relies on its intrinsic content height (e.g. an `EventCard`, KPI tile, or sticker-preview panel) causes the container to collapse to 0px or to clip its content. The Tailwind `@container` utility (both v3 plugin and v4 native) defaults to `inline-size` specifically to avoid this foot-gun. Consequence: if any developer reaches for `container-type: size` to enable `@height-*` variants, they introduce a subtle layout regression — the card renders correctly in isolation (fixed-height storybook), then breaks when dropped into an auto-sized grid cell. Correct pattern: keep container-type at the `inline-size` default; if height-responsive behavior is truly needed, scope it to a specific wrapper that explicitly has a fixed height, not to the content card itself.
- **Relevance:** Directly affects the already-queued `Future Migrations → Tailwind v4 → @container` work. When we migrate `EventCard`, `MagnetEventCard`, KPI tiles, and `PrintStation` queue cards from viewport breakpoints (`md:`/`lg:`) to container queries, the naive first pass will be `className="@container"` on the wrapper — which is correct (inline-size). The FAIL mode would be a developer seeing the `@height-*` variant docs and reaching for `container-type: size` to add vertical responsiveness. Also relevant to any future sticker-pack preview pane in `MagnetReview.jsx` that wraps a scrolling grid — if it uses container queries, it MUST stay `inline-size`. Pairs with the existing "Tailwind CSS v4 native `@container` queries" finding (2026-04-19) as a hazard disclosure on top of the capability enablement.
- **Action:** (1) Append a sub-bullet to `Future Migrations → Tailwind v4 → @container` block: "NEVER set `container-type: size` on content-sized cards (EventCard, KPI tile, sticker preview) — forces block-axis containment and collapses auto-height to 0. Keep the `inline-size` default. Only use `size` on fixed-height wrappers that truly need `@height-*` variants." (2) Add a design-review checklist item for the v4 migration PR: "no `container-type: size` on content cards — use inline-size default." (3) NOT actionable today (still on `tailwindcss ^3.4.17` without `@container` utility). (4) When writing any custom `@container` CSS outside Tailwind utilities (rare — discouraged per utility-only rule), default to `container-type: inline-size`.
- **Status:** pending-review

### Finding: 2026-04-22 — React `useTransition` double-renders, bails out stale transitions, and must NOT be used as a drop-in memoization replacement — keep the user-input state OUTSIDE the transition, only wrap the expensive derived update
- **Source:** https://react.dev/reference/react/useTransition + https://www.charpeni.com/blog/dont-blindly-use-usetransition-everywhere + https://www.nutrient.io/blog/react-usetransition-guide/ + https://github.com/facebook/react/issues/26814 + https://github.com/facebook/react/issues/28923
- **Finding:** Three compounding `useTransition` gotchas not covered by the existing "React 18 — useSyncExternalStore + useDeferredValue" perf entry: (1) **Double render cost**: every `startTransition` triggers TWO renders — first an immediate "critical" pass with the old state where `isPending === true`, then a second low-priority pass with the new state. Wrapping trivial state updates makes the component SLOWER, not faster. (2) **Bail-out on fast typing**: if a user types another character before the transition's low-priority render completes, React abandons the in-progress work and restarts with the new input — this is the intended responsiveness behavior, but it requires that the *input* `setState` is NOT wrapped in the transition. Wrapping `setQuery` inside `startTransition` negates the entire feature: the input field itself now lags. (3) **Pending state stuck true** (React 19 bug, present in some 18.3 releases): known issue where `isPending` never flips back to `false` when transitions interact with `use()` + suspending components — any UI relying on `isPending` for a spinner will show a permanent spinner. Canonical pattern: `const [query, setQuery] = useState(''); const [results, setResults] = useState([]); const handle = (v) => { setQuery(v); startTransition(() => setResults(filter(v))); };` — input state outside, derived-heavy state inside. Misuse pattern: wrapping every setState in a transition "because it might be slow" — measurable overhead, no benefit.
- **Relevance:** Memoria has two surfaces where `useTransition` / `useDeferredValue` is on the roadmap (per the 2026-04-19 perf finding): (1) Host Dashboard gallery filter — typing into the search box should not block the ≥300-photo list re-render. (2) Admin CRM lead search (`AdminDashboard`). In both cases the naive first-draft is `startTransition(() => { setQuery(v); setFilteredList(filter(v)); })` — WRONG: the input will feel laggy and the double-render tax is paid on every keystroke. Correct is to keep `setQuery` synchronous and only wrap the heavy derived state (`setFilteredList`) in the transition. Also directly complements the already-documented "React Compiler v1.0 stable" finding — the compiler does NOT auto-insert `useTransition`; this hook remains a manual decision even after Compiler adoption. And the known `isPending`-stuck-true bug means any pending-indicator UI must have a hard fallback (e.g. a timer that force-resets the spinner after 10s) — same defensive pattern as the 6s AbortController cap in `profileReady` auth enrichment.
- **Action:** (1) Add a rule to the existing Performance Patterns section: "when introducing `useTransition` on a typeahead/filter UI, keep the input-binding `setState` OUTSIDE `startTransition` — only wrap the derived-heavy state (filtered list, pagination). Wrapping the input itself makes the field lag and negates the feature." (2) Add to anti-patterns: "`startTransition(() => { setQuery(v); setFilteredList(filter(v)) })` — input state must not be inside the transition." (3) When implementing Dashboard gallery search or AdminDashboard lead search, any `isPending` spinner UI must have a 10s safety-timer fallback that force-clears the spinner — the React 18/19 pending-stuck bug means a permanent spinner is a real failure mode. (4) Do NOT wrap `useRealtimeNotifications` or `useEventGallery` state updates in `useTransition` — those channels are latency-sensitive and the double-render overhead compounds with canvas/sticker re-renders. Reserve `useTransition` for user-initiated filter/search surfaces specifically. (5) Pairs with existing `useDeferredValue` guidance (2026-04-19) — prefer `useDeferredValue` when the slow consumer is a downstream component reading a value; prefer `useTransition` when the slow producer is a setState call *you* own.
- **Status:** pending-review

### Finding: 2026-04-22 — Canvas 2D sharp-text on mobile: MUST scale by `devicePixelRatio` AND set `ctx.textRendering = 'geometricPrecision'` — default is blurry sticker text on iPhone/high-DPR Android
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textRendering + https://dev.to/pahund/how-to-fix-blurry-text-on-html-canvases-on-mobile-phones-3iep + https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas + https://web.dev/canvas-performance/
- **Finding:** Two compounding mobile-canvas text issues not covered by the existing "Canvas 2D — Three compounding gotchas" entry. (1) **devicePixelRatio scaling**: DOM pixels ≠ canvas backing-store pixels. On an iPhone (DPR=2) or Pixel (DPR=2.5–3), a `<canvas width=400 height=400>` rendered at 400×400 CSS px is silently DOWN-SAMPLED from what the retina screen can display — text looks soft/blurry, stickers look fuzzy. Canonical fix: set canvas intrinsic size to `W * dpr` × `H * dpr`, scale the context with `ctx.scale(dpr, dpr)`, keep CSS size at `W × H`. Without this, every rasterized glyph, SVG sticker, and frame overlay is lossy on mobile. (2) **`ctx.textRendering` property** (Baseline 2023, supported in all modern browsers): four values — `auto` (default, browser picks), `optimizeSpeed` (fastest, lowest quality, skip ligatures/kerning), `optimizeLegibility` (enable ligatures + kerning; "improve legibility even at the cost of speed"), `geometricPrecision` (preserve exact metric positions at any scale — critical for transformed/rotated text). Default `auto` on mobile Safari leans toward speed and produces the softer rasterization. Set `ctx.textRendering = 'geometricPrecision'` BEFORE any `fillText`/`strokeText` call on a rotated/scaled sticker layer; use `'optimizeLegibility'` for static labels. Neither property changes pixel cost enough to move the Android framerate needle — the perf-dominant factor remains the cached-bitmap pattern already documented in the OffscreenCanvas finding.
- **Relevance:** Direct hit on `MagnetReview.jsx` sticker composite + `compositePngFrame.js` + any future `CameraCapture.jsx` watermark pass. Current code does NOT explicitly handle DPR scaling on the sticker/review canvas — so sticker text and PNG-frame labels are silently blurry on every iPhone and modern Android, which is the exact demographic that prints the photo and notices the artifact. Pairs with the existing "non-integer `drawImage` coords trigger sub-pixel resampling" rule — DPR scaling adds a second sub-pixel axis that `Math.floor` alone can't fix. The `textRendering` default also explains why sticker text looked crisper in Figma mocks (vector) than in the live canvas composite (rasterized at `auto`).
- **Action:** (1) Add a new rule under `Common Pitfalls` or Canvas 2D perf section: "every canvas that renders text or stickers MUST (a) size its backing store to `W*dpr × H*dpr`, scale context by `dpr`, keep CSS size at `W × H`; and (b) set `ctx.textRendering = 'geometricPrecision'` before any `fillText`/`strokeText` on rotated/transformed layers, `'optimizeLegibility'` for static labels." (2) Audit `MagnetReview.jsx` canvas setup + `compositePngFrame.js` — retrofit the DPR pattern AND add `ctx.textRendering` before each sticker text draw. Expect visibly sharper stickers on iPhone once shipped. (3) Wrap the DPR scaling in a small helper (`setupCanvas(canvas, width, height)`) in `src/utils/` so every new canvas surface (future watermarks, photo-prep pipeline) gets it for free. (4) Do NOT blanket-apply `geometricPrecision` to high-frequency redraw paths (camera preview post-processing, if we ever add it) — `optimizeSpeed` there. (5) Pairs with the pending `stickerTextBitmapCache` implementation (from the 2026-04-19 OffscreenCanvas finding) — DPR-scale the offscreen bitmap canvas ALSO, or cached glyphs will be blurry when composited onto the DPR-aware main canvas.
- **Status:** pending-review

### Finding: 2026-04-22 — Mobile `getUserMedia` width/height constraints reflect sensor-landscape orientation; post-rotation stream dimensions are swapped — never size canvas from constraint object, always from `videoTrack.getSettings()` post-acquisition
- **Source:** https://webrtchacks.com/getusermedia-resolutions-3/ + https://webrtchacks.com/guide-to-safari-webrtc/ + https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode + https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- **Finding:** On mobile browsers (iOS Safari, Android Chrome/Firefox), the camera sensor's native resolution is ALWAYS reported in landscape orientation (e.g. `1920×1080`). When the device is held in portrait mode, the OS rotates the frame before delivering it to the page — so a `getUserMedia({ video: { width: { exact: 1920 }, height: { exact: 1080 } } })` call in portrait fails with `OverconstrainedError` because the actual stream dimensions are `1080×1920` (swapped). Using `ideal` instead of `exact` silently returns the rotated-for-portrait dimensions, which then break any downstream code that assumes landscape (e.g. a canvas sized `1920×1080` draws the stream stretched or letterboxed). Worst case: changing orientation mid-session can re-emit device events and the stream resolution silently flips, tearing the live preview. Fix patterns: (1) ALWAYS use `ideal` (never `exact`) for `width`/`height` on mobile; (2) read actual dimensions from `videoTrack.getSettings()` AFTER the stream is acquired, and drive any canvas sizing from those values — never from the constraint object; (3) use `videoRef.current.videoWidth` / `videoHeight` for DOM-level measurements (they already reflect post-rotation values); (4) subscribe to `orientationchange` or a ResizeObserver on the video element and re-measure after rotation.
- **Relevance:** `MagnetCamera.jsx` and `CameraCapture.jsx` both use the `width: { ideal: 1920 }, height: { ideal: 1080 }` pattern documented in CLAUDE.md §3.6 — which is correctly using `ideal` (no throw). BUT: if any downstream code (capture canvas, `compositePngFrame.js`, watermark compositor) assumes the acquired stream is 1920×1080 landscape and we actually capture in portrait, the output image will be stretched, letterboxed, or mis-aligned against the frame PNG. Specifically: if `compositePngFrame.js` sizes its canvas to match the photo buffer, a 1080×1920 portrait source composited against a 1920×1080 landscape frame PNG silently mis-aligns — the classic "why are the corners of my frame covering the faces" print-review bug. Pairs with the existing "iOS 2nd getUserMedia mutes prior track", "getSupportedConstraints guard", and "iOS randomizes deviceId" WebRTC rules.
- **Action:** (1) Update CLAUDE.md §3.6 WebRTC Camera Rules with an explicit rule: "NEVER read canvas/capture dimensions from `getUserMedia` constraints — always read them post-acquisition from `videoTrack.getSettings()` or `videoRef.current.videoWidth`/`videoHeight`. Constraints are a request; settings are ground truth." (2) Audit `MagnetCamera.jsx` + `CameraCapture.jsx` — confirm the capture canvas is sized from `videoRef.current.videoWidth`/`videoHeight`, NOT from constants or constraint values. Modify if any hardcoded dimensions exist. (3) Audit `compositePngFrame.js` — if it assumes a landscape source photo, add an orientation check and rotate/swap the frame PNG to match source aspect. Or gate the frame library to portrait-only for Memoria Magnet guest flows (which ARE portrait-locked in practice). (4) NEVER use `exact` constraints for `width`/`height` on mobile surfaces. (5) Test: rotate an iPhone mid-camera session in MagnetCamera — does the preview still fill without black bars? The DPR + orientation interaction means this is a compound test case.
- **Status:** pending-review

### Finding: 2026-04-22 — Supabase Realtime is DISABLED by default on NEW projects (2026 platform default change) — publication membership + table-level enablement now required; existing projects are unaffected
- **Source:** https://supabase.com/blog/supabase-security-2025-retro + https://supabase.com/changelog + https://github.com/supabase/supabase-js/releases
- **Finding:** As of the 2026 platform defaults, Supabase changed the default for NEWLY-created projects: Realtime (the WAL-streaming service backing `postgres_changes` channels) is DISABLED by default at the project level. On existing projects (including Memoria's production), Realtime remains enabled as before — this change is forward-looking, not a breaking change for live apps. To enable Realtime on a NEW project, (a) toggle it on in Project Settings → API → Realtime, AND (b) add each target table to the `supabase_realtime` publication (Database → Replication → Publications) — missing step (b) means `postgres_changes` subscriptions connect successfully but never fire for that table. Identical silent-fail failure class to the already-documented "Realtime filters by RLS SELECT" gotcha (2026-04-21 finding): subscription stays "connected," no errors, events just never arrive. Realtime Broadcast/Presence (non-WAL messaging) has its own separate enable flag on new projects.
- **Relevance:** Not immediately actionable — Memoria's production Supabase project predates the default change, and all our realtime-subscribed tables (`photos`, etc.) are already in the publication. BUT: (1) the MemoriaMagnet expansion is actively adding new tables (`magnet_orders`, `print_queue`, `magnet_events`) that need realtime for `PrintStation` live updates — each new table requires explicit `ALTER PUBLICATION supabase_realtime ADD TABLE ...` in the schema migration, or the operator dashboard silently breaks. (2) If Efi ever spins up a staging/preview Supabase project (branching for a paid-tier trial, or a dev sandbox), Realtime will be off by default and every realtime-dependent dev flow will appear broken until enabled. (3) Combined with the 2026-04-21 "RLS SELECT filters realtime events" finding, the setup checklist for any new realtime-subscribed table is now a 3-step gate: enable Realtime on project → add table to publication → add PERMISSIVE SELECT RLS policy matching the subscription filter scope.
- **Action:** (1) Add a checklist entry to `Future Migrations / Hardening Follow-ups` (or a new "New Supabase Project Setup" subsection): "before any `postgres_changes` subscription works, verify (a) Realtime enabled in Project Settings, (b) target table in `supabase_realtime` publication via `ALTER PUBLICATION supabase_realtime ADD TABLE <name>`, (c) table has a PERMISSIVE SELECT RLS policy covering the subscription filter scope." (2) When adding `print_queue` / `magnet_orders` / `magnet_events` to the schema (pending MagnetMagnet v2 work per project-memory.md), include the `ALTER PUBLICATION` line in the same migration as the `CREATE TABLE` — do NOT rely on any automatic membership, even on the current production project. (3) NOT urgent today — Memoria's existing prod is unaffected. Flag as pre-migration reading before any branching/staging initiative.
- **Status:** pending-review
