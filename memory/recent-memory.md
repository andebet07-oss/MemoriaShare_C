---
type: recent-memory
updated: 2026-04-19T22:00Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

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

### Files changed
- `src/pages/CreateMagnetEvent.jsx` — 0 violet tokens remaining (+39/-39)
- `src/pages/MagnetLead.jsx` — 0 violet tokens remaining + segmented-control for GUEST_OPTIONS (+34/-31)
- memory/*.md — refreshed timestamps (prior session)

### Tech debt unchanged
- `linked_event_id` migration still missing (HIGH)
- Duplicate `compressImage` in MagnetLead still present
- Canvas fonts still not gated on `document.fonts.ready`
- `events.cover_image` written on create but not yet surfaced on guest landing backgrounds

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

### Files changed
- `src/components/home/HeroSection.jsx` — pt-20 padding
- `src/components/magnet/MagnetReview.jsx` — preview composite useEffect + photoFrac state + drawSticker arg fix (+54/-18)
- `src/components/memoriaService.jsx` — `uploadCoverImage()` added (+24)
- `src/pages/CreateMagnetEvent.jsx` — coverImageFile form field + upload UI + submit path (+32/-4)

---

## Session 2026-04-17 PM — MagnetLead cover edit + Sticker System v2

### Commits (chronological)
- `f1a6380` pov update7 — CreateEvent, CreateMagnetEvent, MagnetLead POV tokenization
- `7376934` pov update8 — MagnetLead pinch/drag cover image transform on phone mockup
- `00654d5` pov update9 — MagnetLead 2-line polish
- `5583664` pov upgradeStickers — sticker system v2 + 3 new wedding frames + FramePicker removed

### Decision A — MagnetLead cover image design mode
Added `coverImage`, `imageTransform`, `isDesignMode`, `onImageTransformChange` props to `MagnetPhoneMockup`. Same pinch/drag flow that CreateEvent uses (initial scale from natural dims vs screen dims; min-scale clamp). Local `compressImage()` helper mirrors CreateEvent — **tech debt**: should import from `@/functions/processImage` which MagnetReview already uses.

### Decision B — Sticker System v2 (Y2K / Pinterest)
Replaced `badge/stamp/emoji/text` with 5 types (see long-term-memory §Sticker System v2 for full detail):
- `svg` — inline SVG from new `svgStickers.js` (base64 data URL → `Image` cache → `ctx.drawImage`)
- `script-text` — Great Vibes / Parisienne cursive
- `retro-text` — Bebas Neue / Limelight bold caps in `#facc15`
- `handwritten-text` — Caveat / Patrick Hand 700
- `editorial-text` — Abril Fatface / Playfair Display

`svgStickers.js` (NEW): 24 stickers with 64×64 viewBox, white 3px outer stroke + `paint-order="stroke"` for die-cut look, rendered at `w * 0.18`. `drawSticker()` in MagnetReview extended with per-type renderers; accepts a pre-loaded SVG Image cache via `svgImgCache` ref + `ensureSvgImage()` helper (Promise-based, cached by `svgKey`).

### Decision C — FramePicker removed, inlined
`src/components/magnet/FramePicker.jsx` **deleted**. Frame selection lives inside `CreateMagnetEvent.jsx` as `FrameThumbnail`. `THUMB_W` 88→108px. `isNew: true` frames get "חדש" badge (now primary/indigo after 2026-04-19 sweep).

### Decision D — 3 new wedding frames (`framePacks.js` +285 lines)
- `wedding-polaroid-tape` — white polaroid + tan tape strips (rotated ±0.18 rad), Caveat cursive name
- `wedding-deco-gold` — gold double border + corner sunburst fan; Limelight + Secular One
- `wedding-hairline-crest` — minimal hairline border (`rgba(80,70,55,0.18)` 0.8px)

---

*Earlier sessions (2026-04-17 AM "POV Brand Pivot LOCKED IN", 2026-04-16 "silvery home bug") archived to long-term-memory §Design Language and §Common Pitfalls.*
