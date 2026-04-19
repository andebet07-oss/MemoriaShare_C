---
type: long-term-memory
updated: 2026-04-19T22:00Z
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
- **Violet `#7c3aed` / `#a78bfa`** is retained as the MemoriaMagnet sub-brand accent — scope narrowed 2026-04-19.
- **In-scope (still violet):** `AdminShell` tabs, `AdminOverview`, `AdminEventsList`, `LeadsPanel` (admin status chips), `PrintStation`, `MagnetEventDashboard`, `MagnetCamera` (in-event camera chrome), `MagnetGuestPage`, `MagnetReview` (canvas label strip / chrome).
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

### Legacy CSS Classes (Layout.jsx)
- `.luxury-button` and `.premium-submit-button` — retained as metallic CTAs, now using cool-neutral gradients (`#fcfcfe → #e8e8ec`) with indigo-tinted shadows `rgba(124, 134, 225, 0.18–0.28)` (NOT silver-metallic gray)

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

## Storage Upload Pattern — Direct `fetch` with `x-upsert`

`memoriaService.storage.uploadCoverImage()` (2026-04-18) uploads to `covers/{eventId}/cover.{ext}` via direct `fetch` to `${VITE_SUPABASE_URL}/storage/v1/object/photos/{path}` with headers:
```
Authorization: Bearer {jwt from _getJwt()}
apikey: {VITE_SUPABASE_ANON_KEY}
Content-Type: {file.type}
x-upsert: true
```
Use this recipe when the path is **canonical per-resource** (e.g. one cover per event) so re-uploads replace in place instead of piling up orphaned files. Contrast with the per-photo upload path which uses `{event_id}/{timestamp}_{filename}` for append-only semantics.

## Tech Stack Rules (Non-Negotiable)
- React 18 hooks only (no class components, no HOCs except 3rd-party wraps)
- Tailwind utility-only (no custom .css, no in
---

## Common Pitfalls
*updated: 2026-04-19T06:00Z*

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
*Last refreshed: 2026-04-19T22:00Z | Next review: 2026-04-26*

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
