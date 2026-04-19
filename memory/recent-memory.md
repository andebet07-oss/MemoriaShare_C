---
type: recent-memory
updated: 2026-04-18T13:00Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

## Session 2026-04-18 — Magnet Cover Image + MagnetReview Preview Composite

### Commit
- `601e1c7` update: pov upgradeStikers1 (+240/-318 across 8 files; memory docs condensed)

### Decision A — MagnetReview shows real frame composite during sticker placement
Previously the review screen rendered the photo inside a white chrome container with a plain text label strip. The actual frame artwork (polaroid tape, deco gold borders, hairline crest, etc.) only appeared at submit time — so the user could not see where stickers would actually sit on the finished magnet.

Fix: added a `useEffect` that bakes **photo + `drawFrame()` result + label area** into a `previewUrl` data URL whenever `imageDataURL` or `event.overlay_frame_url` changes. The `<img>` in the draggable container now renders the composite. A `photoFrac = photoH / totalH` state limits the sticker drag zone to the photo portion only (`height: ${photoFrac * 100}%`). Fallback: while the preview is computing, the old text-only label strip shows.

### Decision B — drawSticker must receive photo dimensions, not canvas dimensions
Discovered while wiring the composite: at submit time, `drawSticker(ctx, s, canvas.width, canvas.height, svgImg)` was passing `totalH` (photo + label), but sticker `s.x / s.y` are stored relative to the photo area only. Result: stickers drifted downward on the final export. Fix: `drawSticker(ctx, s, photoW, photoH, svgImg)` — height arg is the photo height, never the total canvas height.

### Decision C — Optional cover image upload on CreateMagnetEvent step 1
Added a file picker to the admin wizard's "name" step: "תמונת רקע לדף הנחיתה (אופציונלי)". Dashed violet border box → replaces with thumbnail + dark scrim + "לחץ להחלפה" overlay after selection. Form state: `coverImageFile` + `coverImagePreview` (object URL).

### Decision D — new `memoriaService.storage.uploadCoverImage(file, eventId)`
Uploads to `covers/{eventId}/cover.{ext}` in the `photos` bucket via direct `fetch` with `Authorization: Bearer {jwt}` + `apikey` + `x-upsert: true` (replace-in-place so re-upload doesn't orphan old file). Returns `{ file_url, path }`. On submit, writes `file_url` to `events.cover_image` column (column already in `CLEAN_RESET_SCHEMA.sql`, verified).

### Decision E — HeroSection padding bump
`pt-10` → `pt-20` in `HeroSection.jsx` root for more breathing room above the headline. Minor polish, not structural.

### Files changed
- `src/components/home/HeroSection.jsx` — pt-20 padding
- `src/components/magnet/MagnetReview.jsx` — preview composite useEffect + photoFrac state + drawSticker arg fix (+54/-18)
- `src/components/memoriaService.jsx` — `uploadCoverImage()` added (+24)
- `src/pages/CreateMagnetEvent.jsx` — coverImageFile form field + upload UI + submit path (+32/-4)

### Tech debt closed
- "Post-sticker-v2 build verification" resolved — commit shipped clean to main / Vercel auto-deploy

### Tech debt unchanged
- `linked_event_id` migration still missing (HIGH)
- Duplicate `compressImage` in MagnetLead still present
- Canvas fonts still not gated on `document.fonts.ready`

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
Replaced `badge/stamp/emoji/text` with 5 types:
- `svg` — inline SVG from new `svgStickers.js` (base64 data URL → `Image` cache → `ctx.drawImage`)
- `script-text` — Great Vibes / Parisienne cursive
- `retro-text` — Bebas Neue / Limelight bold caps in `#facc15`
- `handwritten-text` — Caveat / Patrick Hand 700
- `editorial-text` — Abril Fatface / Playfair Display

`svgStickers.js` (NEW): 24 stickers — heart, star, disco, evilEye, lips, camera, eiffel, butterfly, cherry, flower, crown, bow, sparkle, sun, moon, coffee, strawberry, cassette, rose, hebrewChai, starOfDavid. 64×64 viewBox, white 3px outer stroke with `paint-order="stroke"` for die-cut look, rendered at `w * 0.18`.

`drawSticker()` in MagnetReview extended with per-type renderers; accepts a pre-loaded SVG Image cache via `svgImgCache` ref + `ensureSvgImage()` helper (Promise-based, cached by `svgKey`).

### Decision C — FramePicker removed, inlined
`src/components/magnet/FramePicker.jsx` **deleted**. Frame selection lives inside `CreateMagnetEvent.jsx` as `FrameThumbnail`. `THUMB_W` 88→108px (better touch targets). `isNew: true` frames get "חדש" violet badge.

### Decision D — 3 new wedding frames (`framePacks.js` +285 lines)
- `wedding-polaroid-tape` — white polaroid + tan tape strips (rotated ±0.18 rad), Caveat cursive name
- `wedding-deco-gold` — gold double border + corner sunburst fan; Limelight + Secular One
- `wedding-hairline-crest` — minimal hairline border (`rgba(80,70,55,0.18)` 0.8px)

---

## Session 2026-04-17 AM — POV Brand Pivot LOCKED IN

### Decision
Efi explicitly locked the POV.camera cool-dark / indigo brand as canonical. Prior violet-heavy brand retired from platform shell; violet survives only as MemoriaMagnet sub-brand accent.

### Brand (canonical)
- Background: `#1e1e1e` (cool-900) + gradient to cool-950
- Primary accent: `#7c86e1` (indigo-500)
- Text: `#fcfcfe` (cool-50)
- Muted: `#b4b4b4`
- Display serif: Playfair Display
- Body: Heebo (Hebrew)
- Micro-labels: Montserrat `tracking-[0.3em] uppercase text-[10px]`
- Sub-brand: Violet `#7c3aed` — MemoriaMagnet UI only

### Root cause fix — silvery home page
No `.dark` ancestor existed in the app, so semantic tokens (`bg-background`, `text-foreground`, `border-border`) resolved to the **light** palette. Gradient `from-background via-cool-900 to-background` rendered as `#fafafa → #1e1e1e → #fafafa`. Fix: add `dark` class to every page root that expects dark appearance; use explicit cool-tone gradient `from-cool-950 via-cool-900 to-cool-950`.

### Pages aligned
Home + HeroSection + Features + HowItWorks, CreateEvent, MyEvents (/host), CreateMagnetEvent, AdminShell, AdminOverview, Layout (`.luxury-button` + `.premium-submit-button` cool-neutral rewrite), CardElegant, framePacks UI chrome, PrintableShareCards (`קשת זהב` → `קשת אינדיגו`), LeadsPanel (contacted amber → violet).
