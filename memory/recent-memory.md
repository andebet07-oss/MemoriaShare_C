---
type: recent-memory
updated: 2026-04-21T21:00Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

## Session 2026-04-21 — `pov upgradeALL` series continues + PNG Frames Pipeline + admin auth race fix (15 commits)

### Commits (chronological)
- `e14f475` (00:02) — upgradeALL7
- `a236af3` (00:22) — upgradeALL8
- `0f094a8` (07:28) — admin events panel aligned to brand design system
- `5f50cee` (07:33) — upgradeALL9
- `d0ce328` (08:41) — upgradeALL10
- `06c353e` (09:08) — **add:** 7 AI-designed SVG photo booth frames for PNG overlay pipeline
- `f808345` (09:15) — **fix:** FramePngPreview composite scaled to 600×900 for preview; fix crossOrigin; retry on error
- `d3398ab` (09:17) — **fix:** CORS headers for `/FRAMES/` static assets
- `d0db4cc` (10:33) — **feat:** PNG frame overlay pipeline + white-elegant SVG seed frames
- `c1df70f` (11:57) — chore: remove all placeholder SVG seed frames from `public/FRAMES/`
- `f7def4d` (12:34) — **add:** 8 transparent PNG polaroid frames from Figma
- `4e73962` (12:46) — **add:** 71 Canva polaroid frames extracted from 6 sheet exports
- `a52e6ab` (12:55) — upgradeALL11
- `5d13611` (13:24) — upgradeALL_12
- `276562a` (16:04) — **fix:** PNG frames pipeline + admin auth race condition

### Decision A — NEW: PNG Frame Overlay Pipeline (`d0db4cc`, extensively hardened)
Introduces a parallel PNG-asset frame rendering path alongside the existing procedural (SVG `drawFrame()`) system. Design assets can now be batch-uploaded as PNGs with transparent cutouts; text position is auto-detected from the alpha-channel hole.

**New primitives:**
- `src/functions/compositePngFrame.js` — canvas compositor; overlays photo + PNG frame; optional text injection; respects `maxWidth`/`maxHeight` caps.
- `src/functions/detectHoleBbox.js` — alpha-channel scan to find the transparent cutout bounding box → auto-positions photo and text inside it.
- `src/components/admin/FramePngPreview.jsx` — real-time preview of composited PNG frame in admin grid.
- `src/components/admin/FrameUploadDialog.jsx` — batch multi-file ingestion with per-frame `text_config` JSONB metadata.
- `src/functions/framesUtils.js::findApprovedFrameFromDB()` — DB-first lookup with graceful fallback to local procedural seed pack.

**Critical pitfalls captured inline:**
1. **`crossOrigin='anonymous'` MUST be conditional** — applying to same-origin SVG assets breaks them. Apply only to Supabase-hosted URLs (cross-origin).
2. **Failed image promises were cached indefinitely** — initial implementation never retried on error. Fixed in `276562a`: delete the failed cache entry in the rejection handler so next call retries.
3. **Canvas sizing in preview was unbounded** — 2400×3600 canvas allocations per admin grid card caused memory thrashing; `f808345` added `maxWidth`/`maxHeight` args (600×900 for preview cards) to `compositePngFrame()`.
4. **CORS required for `/FRAMES/` static assets** — `d3398ab` added CORS headers to `vercel.json` so the cross-origin-anonymous-loaded images can be drawn to canvas without tainting it (`getImageData` requires un-tainted).

**Admin flow:** PNG frames skip the procedural rubric approval gate — approved as static assets with metadata (not scored designs). `FrameDetailPanel` branches: `frame.isPng ? <FramePngPreview /> : <canvas />`.

### Decision B — Admin Auth Race Condition Fix (`276562a`, HIGH PRIORITY)
**Bug:** `RequireAdmin` gated on `!isLoadingAuth && user?.role === 'admin'`, but role enrichment happened asynchronously in a background `enrichWithProfile()` call. Between JWT auth settling and DB role loading, `user?.role` was undefined → admin pages redirected unauthorized even for super-admin.

**Fix:** New `profileReady` state in `@/lib/AuthContext`. Only true after `enrichWithProfile()` completes. `RequireAdmin` now gates on BOTH `!isLoadingAuth && profileReady`. Also added:
- 6s timeout on profile enrichment (don't block auth indefinitely if profile fetch hangs)
- 10s safety timer on whole auth settle
- Strict ordering: auth mutex release → base user built → DB profile fetched → role available → `RequireAdmin` passes

**Companion concern (from research-scout 2026-04-21 finding):** the `onAuthStateChange` deadlock pitfall — if the callback awaits any supabase-js method, the whole client deadlocks. Auth context was just touched; this is the moment to audit whether the subscription wraps post-event work in `setTimeout(fn, 0)`. See project-memory tech debt.

### Decision C — Frame Assets Migration: Placeholder SVGs → Real Polaroid PNGs
- `c1df70f` removed **all placeholder SVG seed frames** from `public/FRAMES/`.
- `f7def4d` added **8 transparent PNG polaroid frames** extracted from Figma designs.
- `4e73962` added **71 Canva polaroid frames** extracted from 6 sheet exports (bulk Canva import pipeline).
- `06c353e` added **7 AI-designed SVG photo booth frames** — these are the "white-elegant" procedural seeds used by the new PNG pipeline as fallback.

Total frame library now: 7 SVG seeds + 79 PNG polaroids = 86 curated frames available in admin grid.

### Decision D — Admin Panels Brand-Aligned (`0f094a8`)
`AdminEventsList` + `LeadsPanel` replaced hardcoded `rgba(...)` strings with design tokens:
- `bg-card`, `border-border`, `text-muted-foreground`, `bg-cool-950`
- Editorial headings now use `font-playfair` (magazine aesthetic, consistent with consumer surfaces)

**New banned pattern:** hardcoded `rgba(...)` strings in admin panel component files. Use semantic tokens (already rule for share surfaces; now enforced on admin side too).

### Decision E — Sticker Packs Expanded with `emoji` Type (`5d13611`)
`stickerPacks.js` gains `emoji` type alongside existing `svg` / `script-text` / `retro-text` / `editorial-text`. Wedding pack grew 15 → 35+ stickers with emoji variants (🍾, 💍, 👰). Emoji renders natively via `ctx.fillText` — no SVG cache needed. Hebrew sticker content observed: `מזל טוב`, `בר מצווה`.

The legacy `emoji` type notation in `drawSticker()` (previously only in long-term-memory §Sticker System v2) is now first-class and actively used in the 4 stock packs.

### Decision F — Admin Events Panel Brand Sweep (continued in upgradeALL8–12)
Part of a broader design-system alignment across admin CRM surfaces. Specific diffs not inspected but expected: token migration, `font-playfair` headings, editorial micro-labels, `shadow-indigo-soft` on interactive surfaces.

### Files changed (summary)
- **New:** `src/functions/compositePngFrame.js`, `src/functions/detectHoleBbox.js`, `src/components/admin/FramePngPreview.jsx`, `src/components/admin/FrameUploadDialog.jsx`, 7 SVG + 79 PNG frames under `public/FRAMES/`
- **Modified:** `src/lib/AuthContext.jsx` (profileReady + timeouts), `src/functions/framesUtils.js` (DB-first + local fallback), `src/components/admin/AdminEventsList.jsx`, `src/components/admin/LeadsPanel.jsx`, `src/components/admin/FrameDetailPanel.jsx` (PNG/canvas branch), `src/components/magnet/stickerPacks.js` (emoji type + 20+ new stickers), `vercel.json` (CORS for `/FRAMES/`)
- **Deleted:** all placeholder SVG seeds from `public/FRAMES/`

### Tech debt delta
- ✅ PNG frame pipeline shipped with CORS + retry + preview scaling fixes
- ✅ Admin auth race condition — closed with `profileReady` gate
- ✅ Admin panels hardcoded rgba → semantic tokens
- ✅ Frame library expanded from placeholder SVGs to 79 real polaroid PNGs
- 🆕 **HIGH:** audit `onAuthStateChange` subscription in AuthContext for the supabase-js deadlock foot-gun (wrap post-event work in `setTimeout(fn, 0)`). Auth context was just touched — ride the same PR if possible.
- 🆕 **MEDIUM:** bulk replace `min-h-screen` → `min-h-dvh` on page roots to fix iOS Safari address-bar cutoff (per 2026-04-21 `dvh` finding). Low-risk, high-impact paper-cut.
- 🆕 `vercel.json` now carries CORS config for `/FRAMES/` — if additional public-asset paths are added (e.g. `/STICKERS/`), replicate the pattern.
- ⚠️ `linked_event_id` migration STILL missing (HIGH, unchanged since 2026-04-16)
- ⚠️ Duplicate `compressImage` in MagnetLead still present
- ⚠️ Canvas fonts still not gated on `document.fonts.ready`
- ⚠️ `events.cover_image` still not surfaced on guest landing backgrounds

---

## Session 2026-04-20 — `pov upgradeALL` series (5 commits, accessibility + component library + MagnetCamera hardening)

### Commits (chronological)
- `96dbbbe` (08:15) — upgradeALL1 — MagnetReview + MagnetEventDashboard cover upload + MagnetGuestPage violet badge removed (+67/-10, 3 files)
- `4933138` (18:56) — upgradeALL2 — **major refactor**: `Layout.jsx` deleted, 3 new UI components, `tailwind.config.js` added, App/Dashboard/MyEvents/Event refactored, Hebrew copy in landing (+256/-267, 21 files)
- `ef3a614` (19:13) — upgradeALL3 — EventGallery ARIA tab semantics (+36/-30)
- `c0d6cfd` (20:10) — upgradeALL4 — MagnetCamera hardening: cancellation token, timeout tracking, in-app browser fallback, a11y pass, GPU-first vintage filter (+167/-72)
- `dcb0646` (20:47) — upgradeALL5 — MagnetCamera eslint cleanup (dep arrays now correct) (+2/-2)

### Decision A — `Layout.jsx` DELETED; `.luxury-button` / `.premium-submit-button` retired
Commit `4933138` deleted `src/Layout.jsx` entirely (−67 lines of inline CSS). The two canonical metallic CTA classes (`.luxury-button`, `.premium-submit-button`) with cool-neutral `#fcfcfe → #e8e8ec` gradients and indigo-tinted shadows are **gone**. Button styling moved into the centralized `<Button>` component from `@/components/ui/button`, applied via Tailwind utilities only.
- Long-term memory's "Legacy CSS Classes (Layout.jsx)" block is now obsolete and removed.
- Any page still referencing `.luxury-button` must be migrated to `<Button>` — spot-check required.

### Decision B — Shared state components: `LoadingState`, `ErrorState`, `EmptyState`
New UI primitives in `src/components/ui/`:
- `LoadingState.jsx` — spinner + optional `fullScreen` prop
- `ErrorState.jsx` — `AlertCircle` icon + message + retry button, optional `fullScreen`
- `EmptyState.jsx` — optional Icon + title + description + children slot

Migrated callers (replacing inline spinner divs and scattered error JSX): `App.jsx`, `Dashboard.jsx`, `Event.jsx`, `EventGallery.jsx`, `MyEvents.jsx`. **Rule going forward:** do not hand-roll a spinner or error block in a page — import from `@/components/ui/LoadingState` / `ErrorState` / `EmptyState`.

### Decision C — `tailwind.config.js` restored (was previously absent or implicit)
Commit `4933138` added a `tailwind.config.js` at repo root (+23 lines). This is where the new `animate-paper-fly` keyframe lives (replaces the inline `<style>` block that `MagnetReview.jsx` previously carried for `animate-paperPlane`). Treat `tailwind.config.js` as the canonical source of custom animations, extended colors, and the existing `shadow-indigo-soft` utility.

### Decision D — `MagnetCamera.jsx` hardened (commit `c0d6cfd`, net +95 LOC)
Cluster of defensive patterns worth promoting to canonical camera rules:
- **Cancellation token for overlapping `startCamera()`:** `const startIdRef = useRef(0); const id = ++startIdRef.current;` — stale callbacks check `if (id !== startIdRef.current) return;`. Prevents resource leak when user flips camera mid-stream-setup.
- **Centralized `setTimeout` tracking:** `const timeoutsRef = useRef([]); function later(fn, ms) { const id = setTimeout(fn, ms); timeoutsRef.current.push(id); return id; }` + unmount cleanup `useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);`. Every `setTimeout` in the component goes through `later()`.
- **In-app browser detection:** `const IN_APP_UA_RE = /Instagram|FBAN|FBAV|Line|Twitter/i; const [camFailed, setCamFailed] = useState(() => IN_APP_UA_RE.test(navigator.userAgent));` — early-exit to file-upload fallback when running inside Instagram/Facebook/Line/Twitter WebView (these sandboxes block `getUserMedia`).
- **Video-ready guard before capture:** `if (!v.videoWidth || !v.videoHeight) return;`
- **`capturingRef` released in `finally`:** prevents UI lockup if `drawImage` throws.
- **Front-flash at shutter, not toggle:** `if (flash === 'on' && !cap.torch) { setFrontFlash(true); await new Promise(r => later(r, 50)); }` — animation syncs with capture moment.
- **GPU-first vintage filter:** prefer `ctx.filter = VINTAGE_FILTER` (GPU); pixel-loop fallback only if `typeof ctx.filter === 'undefined'`. Directly addresses long-term-memory §Performance Patterns Canvas 2D gotcha #3 (fillText re-shaping) on a different axis.
- **Haptic on quota exhaustion:** `if (remainingPrints <= 0) { navigator.vibrate([10, 50, 10]); return; }`
- **Retry button in error state:** `<button onClick={startCamera}>נסה שוב</button>` — not a terminal state.
- **Safe date parsing:** accept `YYYY-MM-DD` string OR ISO, validate `isNaN(d.getTime())`.
- **Escape key closes camera:** keydown listener added.

All these fixes have inline comment tags `F01` through `F17` in the source for future traceability.

### Decision E — Accessibility pass (commits `ef3a614` + `c0d6cfd`)
Introducing a consistent a11y pattern across camera and gallery surfaces:
- **ARIA tab semantics (EventGallery):** `<div id="tab-my-photos" role="tabpanel" aria-labelledby="tab-btn-my-photos">` wrappers; buttons gain `id` + `aria-controls`.
- **Icon buttons get Hebrew aria-labels:** `aria-label="סגור מצלמה"`, `aria-label="סגור תפריט"`, etc.
- **Focus rings:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40` (or `/white/80` on dark camera chrome).
- **`role="alert"` on error containers** for immediate screen-reader announcement.
- **Pressed states:** `aria-pressed={vintage}`, `aria-pressed={flash === 'on'}`.
- **Camera root as modal:** `role="dialog" aria-modal="true" aria-label="מצלמה לאירוע"`.
- **Contrast bump:** `text-white/40` → `text-white/60` on quota display (WCAG AA).

### Decision F — Magnet sub-brand scope continues to contract
Commit `96dbbbe` removed the violet "Magnet Premium" badge from `MagnetGuestPage` header (`bg-violet-500/20 border-violet-500/30 text-violet-300/400`) and replaced it with neutral glass-morphism (`white/10`, `white/7`). Also added `font-heebo` to the root div for consistent Hebrew typography. Long-term memory's in-scope-violet list for `MagnetGuestPage` needs to be softened from "chrome violet" to "may still have violet accents — header is now neutral". Full re-audit pending.

### Decision G — Hebrew-first copy on public landing
`HeroSection` + `FinalCTA` had leftover English strings swapped to Hebrew:
- "SHOTS" → "תמונות", "REMAINING" → "נותרו"
- "Party Night" → "ערב מסיבה" (iPhone mockup captions)
- "Begin" → "בואו נתחיל" (CTA button)

Reinforces the Language Split rule (all user-facing UI in Hebrew).

### Decision H — `MagnetEventDashboard` gains cover image upload UI
Admin can now upload / replace the event cover image directly from `MagnetEventDashboard.jsx` (previously only on `CreateMagnetEvent` step 1):
- State: `isSavingCover`, `coverPreview`, `coverInputRef`
- Handler: `handleCoverUpload()` → `memoriaService.storage.uploadCoverImage()` → `queryClient.invalidateQueries()`
- UI: dashed border box with `<ImageIcon>`; on hover, "לחץ להחלפה" overlay appears
- Uses `useQueryClient` from React Query for cache invalidation (first time this pattern appears in admin pages — previously we relied on React Query default refetch)

**Still TODO:** surface `events.cover_image` on MagnetLead / guest landing backgrounds. Admin can now upload it, but guests still don't see it.

### Files changed (summary)
- **Deleted:** `src/Layout.jsx`
- **New:** `src/components/ui/LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx`, `tailwind.config.js`
- **Heavy refactor:** `App.jsx`, `Dashboard.jsx`, `MyEvents.jsx`, `Event.jsx`, `EventGallery.jsx`, `MagnetCamera.jsx`, `MagnetEventDashboard.jsx`, `MagnetReview.jsx`
- **Minor polish:** `HeroSection.jsx`, `FinalCTA.jsx`, `Header.jsx`, `CameraCapture.jsx` (scrollbar-hide CSS removed), `MagnetGuestPage.jsx`

### Tech debt delta
- ✅ `Layout.jsx` sprawl → resolved (deleted, centralized in `<Button>`)
- ✅ Inline spinner duplication → resolved (shared `LoadingState`)
- ✅ Inline `<style>` in MagnetReview → resolved (moved to `tailwind.config.js` as `animate-paper-fly`)
- ⚠️ `linked_event_id` migration still missing (HIGH, unchanged since 2026-04-16)
- ⚠️ Duplicate `compressImage` in MagnetLead still present (MagnetReview imports from `@/functions/processImage`)
- ⚠️ Canvas fonts still not gated on `document.fonts.ready`
- ⚠️ `events.cover_image` still not surfaced on guest landing backgrounds (admin upload UI now exists in 2 places, consumer rendering still TODO)
- 🆕 Audit remaining pages for orphaned `.luxury-button` / `.premium-submit-button` class references (Layout.jsx deletion may have left dangling selectors)

---

## Session 2026-04-19 — Magnet Sub-brand Narrowing (violet → indigo on consumer entry pages)

### Commit
- `18c5966` update: pov upgradeStikers2 (+276/-139 across 6 files, 2 of them src)

### Decision A — `CreateMagnetEvent.jsx` fully de-violet-ed
Every `bg-violet-*`, `text-violet-*`, `border-violet-*`, `ring-violet-*`, `shadow-[...violet...]`, and raw `rgba(124,58,237,...)` / `rgba(139,92,246,...)` replaced with semantic primary / indigo-400 / `shadow-indigo-soft` / `rgba(124,134,225,...)`. Comment header updated: *"violet accent for Magnet branding"* → *"indigo accent"*. Includes: `InlineCalendar` selected day, `FrameThumbnail` ring + "חדש" badge, `FramePreviewModal` confirm button, success screen check-circle + "Magnet · מוכן" label, progress bar + glow, radial hero glow, step labels (01–04), all focus rings, quota pill buttons, frame-tab active state, "ללא מסגרת" chip.

### Decision B — `MagnetLead.jsx` fully de-violet-ed
Same sweep: design-mode ring, inline calendar, progress bar, upload CTA, design-mode toggle, all input focus rings, submit button, success screen check circle. The "העלאה" upload button now uses `bg-primary` with `shadow-indigo-soft`.

### Decision C — GUEST_OPTIONS switched to segmented-control pattern
Replaced the 4-button grid (each with its own selected/unselected bg) with a parent container + transparent-children pattern:
```jsx
<div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary border border-border">
  {GUEST_OPTIONS.map(opt => (
    <button className={selected
      ? 'bg-transparent text-primary border-primary shadow-indigo-soft'
      : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground/80'}>
  ))}
</div>
```
Selected child sits transparent against the container bg and is marked only by its primary border + soft indigo shadow — cleaner native-iOS feel.

### Decision D — Brand rule REFINED (violet sub-brand narrowed)
Previously: *"Violet `#7c3aed` preserved as MemoriaMagnet sub-brand accent — used inside `AdminShell`, `CreateMagnetEvent`, `MagnetReview`, `PrintStation`, Magnet KPI cards."* As of this commit, **violet is retained only on admin back-office + in-event operational surfaces** (AdminShell tabs, AdminOverview, AdminEventsList, LeadsPanel, PrintStation, MagnetEventDashboard, MagnetCamera, MagnetGuestPage, MagnetReview). **Consumer-facing Magnet intake** (MagnetLead = public lead form, CreateMagnetEvent = admin wizard shown on consumer shell) now uses indigo/primary like the rest of the Share flow. Verified by `grep -c violet-` returning 0 for both.

(The 2026-04-20 sessions further softened this: `MagnetGuestPage` header badge removed — see above.)

---

## Session 2026-04-18 — Magnet Cover Image + MagnetReview Preview Composite

### Commit
- `601e1c7` update: pov upgradeStikers1 (+240/-318 across 8 files; memory docs condensed)

### Decision A — MagnetReview shows real frame composite during sticker placement
Previously the review screen rendered the photo inside a white chrome container with a plain text label strip. The actual frame artwork (polaroid tape, deco gold borders, hairline crest, etc.) only appeared at submit time — so the user could not see where stickers would actually sit on the finished magnet.

Fix: added a `useEffect` that bakes **photo + `drawFrame()` result + label area** into a `previewUrl` data URL whenever `imageDataURL` or `event.overlay_frame_url` changes. The `<img>` in the draggable container now renders the composite. A `photoFrac = photoH / totalH` state limits the sticker drag zone to the photo portion only (`height: ${photoFrac * 100}%`). Fallback: while the preview is computing, the old text-only label strip shows.

### Decision B — drawSticker must receive photo dimensions, not canvas dimensions
Discovered while wiring the composite: at submit time, `drawSticker(ctx, s, canvas.width, canvas.height, svgImg)` was passing `totalH` (photo + label), but sticker `s.x / s.y` are stored relative to the photo area only. Result: stickers drifted downward on the final export. Fix: `drawSticker(ctx, s, photoW, photoH, svgImg)` — height arg is the photo height, never the total canvas height.

### Decision C — Optional cover image upload on CreateMagnetEvent step 1
Added a file picker to the admin wizard's "name" step: "תמונת רקע לדף הנחיתה (אופציונלי)". Dashed border box (now primary/indigo after 2026-04-19 sweep) → replaces with thumbnail + dark scrim + "לחץ להחלפה" overlay after selection. Form state: `coverImageFile` + `coverImagePreview` (object URL).

### Decision D — new `memoriaService.storage.uploadCoverImage(file, eventId)`
Uploads to `covers/{eventId}/cover.{ext}` in the `photos` bucket via direct `fetch` with `Authorization: Bearer {jwt}` + `apikey` + `x-upsert: true` (replace-in-place so re-upload doesn't orphan old file). Returns `{ file_url, path }`. On submit, writes `file_url` to `events.cover_image` column (column already in `CLEAN_RESET_SCHEMA.sql`, verified).

### Decision E — HeroSection padding bump
`pt-10` → `pt-20` in `HeroSection.jsx` root for more breathing room above the headline. Minor polish, not structural.

---

*Session 2026-04-17 PM "POV sticker system v2 + wedding frames" archived to long-term-memory §Sticker System v2 and §Canvas Preview Composite Pattern. Earlier sessions (2026-04-17 AM "POV Brand Pivot LOCKED IN", 2026-04-16 "silvery home bug") archived previously.*
