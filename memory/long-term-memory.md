---
type: long-term-memory
updated: 2026-04-26T22:30Z
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
*updated: 2026-04-26T22:30Z*

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
*updated: 2026-04-26T22:00Z*

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
When v4 is scoped, audit and apply together rather than in scattered passes:
- **STEP 0 (P0, do FIRST in the migration PR) — `darkMode` config key is REMOVED in v4.** v3's `darkMode: 'class'` is silently a no-op after migration; every `dark:` utility flips to its v4 default `prefers-color-scheme: dark` media-query mode. Without explicit migration, `<html class="dark">` no longer activates dark utilities — the design system silently follows the OS theme. The fix is one CSS line in `src/index.css` alongside `@import "tailwindcss"`: `@custom-variant dark (&:is(.dark *));` (or `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` for an attribute-based selector). **This protects the locked Memoria brand palette (CLAUDE.md §0.6 "Every dark page root MUST include the `dark` class") — forgetting this line re-introduces the 2026-04-16 silvery-gradient bug.** Failure mode is invisible during local dev IF the dev's OS is set to dark mode (`prefers-color-scheme: dark` makes `dark:` styles apply by accident). **Pre-merge checklist for the v4 migration PR:** force-toggle OS to LIGHT mode and verify dark surfaces still render dark. Add a CSS comment after the variant line: `/* DO NOT REMOVE — v3 darkMode:'class' equivalent. CLAUDE.md §0.6 brand-locked. */`.
- **`scheme-dark` utility** — adds to `<body>` to force native chrome (scrollbars, form inputs, system dialogs, date pickers) into dark mode. Eliminates the silvery light-scrollbar paper-cut. One-line fix.
- **Native `@container` queries** (`tailwindcss-container-queries` plugin no longer required) — convert `EventCard`, `MagnetEventCard`, KPI tiles, `PrintStation` queue cards from viewport breakpoints (`md:`/`lg:`) to `@container`. Fixes the "card looks great in grid, breaks in sidebar" failure mode without per-context wrapper overrides. **NEVER set `container-type: size` on content-sized cards** — forces block-axis containment and collapses auto-height to 0 (storybook fixed-height looks fine, in-grid breaks). Keep the `inline-size` default (the Tailwind `@container` utility default). Only use `size` on fixed-height wrappers that truly need `@height-*` variants. Add a v4 migration PR checklist item: "no `container-type: size` on content cards."
- **v4.1 utilities** — `user-valid:` / `user-invalid:` variants apply styles only AFTER user interaction; replace JS-side `touched` form-validation tracking in `MagnetLead` 4-step wizard + `CreateEvent`. `text-shadow-2xs` … `text-shadow-lg` for sticker preview / cover-image labels (currently requires custom CSS or plugins). `mask-*` utilities for cover-image fade-out treatments in `MagnetGuestPage`. `wrap-break-word` cleanly breaks long Hebrew words / URLs inside cards. Safe alignment (`justify-start-safe`, `items-center-safe`) prevents flex/grid children from overflowing when content exceeds the track — may fix existing overflow bugs without bespoke `min-w-0` workarounds.
- **Source:** https://tailwindcss.com/blog/tailwindcss-v4-1 + https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/.

### React 19 + Compiler v1.0 — bundled migration (when React 19 is scoped)
React Compiler shipped stable Oct 2025 (Babel/SWC plugin, build-time). Replaces almost all manual `useMemo` / `useCallback` / `React.memo` with finer-grained auto-memoization. Real-world Meta Quest Store: +12% initial load, +2.5× interaction speed, neutral memory. Bundle React 19 upgrade WITH Compiler adoption — don't run on React 18 (too much churn for one-version lifespan). Pre-req audit: run `eslint-plugin-react-compiler` on a branch to surface Rules-of-React violations (non-pure render, mutation-during-render) — fixing these is valuable BEFORE Compiler. Post-adoption, delete manual hooks only where the linter confirms compiler handled it (don't bulk-strip). Keep `useMemo` / `useCallback` as documented escape hatches.
- **Same migration unlocks `useEffectEvent`** (stable in 19; replaces the `useRef`-shadow boilerplate currently used in `useRealtimeNotifications`, `useEventGallery`, and `CameraCapture` cleanup — see e.g. `pendingPhotosRef` pattern in CLAUDE.md §3.6 ObjectURL lifecycle rule).
- **Compiler does NOT auto-insert `useTransition`** — that hook remains a manual decision (see Performance Patterns entry on `useTransition` for the canonical "input outside, derived state inside" pattern).
- **Source:** https://react.dev/blog/2025/10/07/react-compiler-1 + https://react.dev/learn/separating-events-from-effects.

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
*Last refreshed: 2026-04-26T22:00Z (post-promotion, weekly review run) | Next review: 2026-05-03*

### Finding: 2026-04-26 — Supabase JS
- **Source:** https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js
- **Finding:** `supabase-js` now transparently retries GET/HEAD requests up to 3× with exponential backoff (1s → 2s → 4s, capped at 30s, with jitter) on transient errors (HTTP 408 / 409 / 503 / 504 / 520, network failures). Only idempotent methods retry — POST/PATCH/PUT/DELETE are NEVER auto-retried. Each retry adds an `X-Retry-Count` header. Enabled by default, no code change needed.
- **Relevance:** Memoria's loading states (CLAUDE.md §3.2 mandates `isLoading` for >200ms ops) silently extend to ~7s on a failing GET — UX timers and user-facing error messages need to account for the longer worst-case. Inversely, all WRITE paths (`memoriaService.uploadPhoto`, `requestPhotoDeletion`, `signUp`, RLS-bound INSERTs) still get ZERO automatic retries, so any flaky-network hardening must be hand-rolled there. Also informs `useRealtimeNotifications` / `useEventGallery` reconnect logic — fetch-side retries are now bundled but the realtime channel itself is independent.
- **Action:** (1) Audit Hebrew error messages that say "נסה שוב" — for GET-shaped flows, the user has already auto-retried 3×, so a final error should suggest a different recovery (refresh / check connection) rather than another tap. (2) For WRITE-side flows, ADD an explicit retry-once-with-backoff helper for upload + delete-request paths — auto-retry won't cover them. (3) Add an `X-Retry-Count` watcher to dev/debug logs to surface flaky upstream behavior. (4) Update CLAUDE.md §3.2 async pattern with one-liner: "GET/HEAD auto-retry up to 3× — POST/PATCH/PUT/DELETE do NOT; hand-roll retry on writes only."
- **Status:** pending-review


