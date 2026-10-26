# Polaroid templates: replace the magnet frame system

**Status:** approved 2026-10-26 and implemented on this branch (phases 2–5). D1: the URL line is off by default — decide after a test print. D2–D8 as recommended.
**Branch:** `claude/polaroid-templates` (from `main` 6915d1d).

**Implementation notes** (choices the appendix left open): B's "&" sits 8 / 7 units from the names; the gap below the names is measured from the script's descender line, so script descenders never touch the date; D's rings sit beside the block on the reading-start side (right for Hebrew, left for Latin), and in portrait too when the names wrap.

**Long names** (2026-10-26 follow-up): names shrink on one line down to each template's `names.minSize` (~70% of the size). Below that they wrap onto two lines, the heart / "&" leading the second name; a name without "&" breaks at its most balanced space. The caption's 4 mm safe area still wins: G portrait with very long Latin names (Great Vibes is 0.81 em tall above the baseline and 0.48 em below) fits two lines only at ~51%.

---

## 1. Inventory of the old frame system

### 1.1 Code: frames

| Item | Action | Why |
|---|---|---|
| `src/components/magnet/framePacks.js` | delete | Already empty (all packs `[]`). Only `LABEL_H_RATIO` is still read, by the old layout code. |
| `src/lib/framesMeta.js` | delete | Empty seed and labels for the frames library. |
| `src/lib/framesRubric.js` | delete | Moderation rubric, used only by the moderation page. |
| `src/lib/framesUtils.js` (`resolveEventFrame`) | replace | The event → frame resolver used by the camera, review, crop editor and print path. It becomes `getEventTemplate(event)` in the new renderer. |
| `src/lib/frameRenderer.js` | delete | Not imported anywhere (dead). |
| `src/lib/compositePngFrame.js` | replace | This is the drawing code that composites a PNG with a hole plus `text_config`. The new renderer replaces it. `canvasToJpegBlob` moves into the renderer. |
| `src/lib/detectHoleBbox.js`, `src/lib/punchHole.js` | delete | Hole detection and punching for uploaded PNGs. |
| `src/components/magnet/FrameStripText.jsx` | delete | HTML copy of the PNG caption text, used only in the viewfinder. |
| `src/hooks/useFramesMeta.js` | delete | Only the moderation page uses it. |
| `src/functions/applyOverlayFrame.js` | replace | Today it opens the print popup and draws an overlay. It becomes `printImage(blob, copies)`: no re-framing, printed at true page size (§5.6). |
| `src/lib/magnetPrint.js` | replace | `printJob` has the same shape. Re-crop re-renders through the new renderer. |
| `src/hooks/useFaceCrop.js` | replace in part | **Keep** `detectFaces`, `computeAutoCrop`, `loadImageEl` and `HAS_REAL_FACE_ENGINE`. **Move** the crop math (`cropRect`, `applyCrop`, `composePreview`) into the renderer, so the cover and crop logic exists in one place only. |
| `src/lib/formatEventDate.js` | keep | Already returns DD.MM.YYYY. It gets a separator argument for template G (`DD · MM · YYYY`). |
| `memoriaService.frameMeta.*` (all methods), `memoriaService.storage.uploadOverlay` | delete | These read and write `frames_meta` and the `overlays/` storage paths. `uploadCoverImage` stays. |

### 1.2 Admin

| Item | Action | Why |
|---|---|---|
| `src/components/admin/frames/*` (FrameHoleEditor, FrameTextEditor, ElementEditor, DecorationEditor, IconPicker, PositionPad, RubricEditor, FrameUploadDialog, FramePngPreview) | delete | Editors for the old frames. Templates are code, so nothing is left to edit. |
| `src/pages/admin/FramesLibrary.jsx`, `FramesModerationQueue.jsx`, their routes in `App.jsx` | delete | — |
| The "כלים" tab in `AdminShell` | delete | It only links to `/admin/frames`, so it would be empty. |
| `CardGridSkeleton` in `ui/skeletons.jsx` | delete | Only the frames library uses it. |
| The frame step in `CreateMagnetEvent.jsx`: `FrameThumbnail`, `PngFrameThumbnail`, `FramePreviewModal`, `drawOnCanvas`, `FRAME_CATEGORIES`, `THUMB_*`/`MODAL_*`, the `png-frames-picker` query, `selectedFrameId`, `overlayFile`, and the `MagnetPreview` polaroid mock | replace | Replaced by the template picker and a live preview that uses the real renderer. The file drops from 736 lines; I'll split it under the 200-line rule. |

### 1.3 Guest

| Item | Action | Why |
|---|---|---|
| `MagnetCamera.jsx` viewfinder (PNG-hole branch and the generic white polaroid fallback) | replace | Becomes `<video>` under the template overlay (§5.3). |
| `MagnetCamera` capture: centre crop to 3:4 | replace | It now captures the full camera frame; the window crop happens in the renderer (§5.4). |
| `MagnetReview.jsx`: sticker state, drag layer, sticker picker, `drawSticker`, `ensureSvgImage`, both frame pipelines | replace | It becomes: framed preview (the composite), retake, send to print. |
| `src/components/magnet/stickerPacks.js`, `svgStickers.js` | delete | Sticker feature removed (2.5). |

### 1.4 Print Station

| Item | Action | Why |
|---|---|---|
| `CropEditor.jsx` | replace internals | It keeps the same UI: drag, zoom, face re-centre, and the orientation toggle (renamed from 3:4/4:3). The preview and crop maths now go through the renderer. |
| `ProJobCard.jsx` thumbnail | change | Today it is a square `object-cover`, which hides the frame. It will show the whole composite at its own 3:4 or 4:3 aspect. |
| `PrintStatusModal.jsx` (guest's "my prints") thumbnails | change | Same change, for consistency. |
| `src/lib/printStation.js`, `usePrintQueue`, `MagnetProStation` | keep | Unchanged: they call `printJob`. |

### 1.5 Dead files that use the old frames

`src/components/magnet/PrintQueue.jsx`, `PrintJobCard.jsx` (uses `applyOverlayFrame` and `overlay_frame_url`) and `src/components/admin/CreateMagnetEventForm.jsx` (writes `overlay_frame_url`) are imported nowhere. I'll **delete** them now rather than in Stage 2, because they reference the column that is being dropped.

### 1.6 DB, migrations and storage

| Item | Action | Why |
|---|---|---|
| `frames_meta` table (and its RLS and indexes) | drop | Pending migration (§4). |
| `events.overlay_frame_url` | replace | Replaced by `events.template_id` and `events.template_options` (§4). |
| `supabase/migrations/20260420_frames_meta.sql`, `20260421_frames_png_overlay.sql`, `20260422_frames_text_config.sql`, `20260604_decoration_layers.sql`, `20260604_frames_meta_display_name.sql`, `20260604_wedding_style_variants.sql` | delete (**D5**) | They only create, fill or alter `frames_meta`. Replaying them on a fresh DB would build a table the next migration drops. Note: if any were applied through the Supabase CLI, `supabase_migrations.schema_migrations` lists them, and a future `db push` would complain. Keeping them is also fine; it's your call. |
| Storage: bucket `photos`, prefix `overlays/{eventId}/frame.png` (per-event uploads) | you delete by hand | Listing query in §4.3. |
| Storage: bucket `overlays`, prefix `overlays/library/**` (library PNGs) | you delete by hand | Same. The empty bucket can then be deleted in the dashboard. |
| Policy `storage_overlays_insert_admin`; `overlays` in `storage_photos_update_admin` (pending hardening §3) | drop / narrow | These belong to the contract migration (§4.2). It must run after the hardening migration, otherwise hardening re-adds `overlays`. |
| `CLEAN_RESET_SCHEMA.sql` (`overlay_frame_url`, overlays policies) | sync after apply | Same convention as hardening: sync once the migration is live. |
| `docs/qa/print-pipeline-rls-test.sql` (test updates `overlay_frame_url`), `docs/qa/print-pipeline-hardening.md` (regression line on library frames) | change | Point them at `template_id`. |

### 1.7 Assets, scripts, config, docs

| Item | Action | Why |
|---|---|---|
| `public/FRAMES` (159 files, 19 MB), `public/FRAMES1` (113 files, 8.8 MB), `public/FRAMES-PROCESSED` (30 files) | delete | 302 tracked files, about 28 MB, removed from every deploy. |
| `vercel.json` CORS headers for `/FRAMES/*` and `/FRAMES-PROCESSED/*` | delete | — |
| `scripts/gen-portrait-frames.mjs`, `gen-decorations.mjs`, `gen-insert-sql.mjs`, `import-frames1.mjs`, `insert-frames-meta.sql`, `insert-frames1.sql`, `frames-triage.json` | delete | Frame import and generation tooling. (`sharp` stays: `api/resize-photo.ts` uses it.) |
| `docs/frame-generation.md`, `docs/frame-import-sop.md`, `docs/frames-audit.md` | delete | — |
| Fonts loaded only for old frames and stickers: `index.html` link (Rubik, Secular One, Miriam Libre, Space Mono, Fredoka, Abril Fatface, Bebas Neue, Caveat, Limelight, Patrick Hand, Parisienne, Great Vibes, Bellefair, Cormorant, Bodoni, Cinzel) and the duplicate `@import` in `index.css` (Italiana, Amatic SC…) | trim | Every page currently downloads about 20 font families. Fonts the Share pages still use (Playfair, Montserrat, Suez One, Frank Ruhl, David Libre, Assistant) stay until Stage 2. Template fonts load on demand (§5.2). |
| `PRD.md` §8.6 sticker system and the review-screen wireframe; `CLAUDE.md` file map (MagnetReview and stickerPacks lines); `memory/project-memory.md` | change | Describe templates instead. Historical reports (`AUDIT_REPORT.md`, `MEMORIA_V2_ARCHITECTURE.md`, `.claude/agent-memory/*`) stay as they are, since they are dated records. |
| Tests: `framesUtils.test.js` | delete | — |
| Tests: `magnetPrint.test.js` | rewrite | — |
| Tests: `printStation.test.js` | keep | It mocks `printJob`. |

---

## 2. Decisions I need from you

My recommendation comes first in each.

- **D1 — Template A's vertical "memoriashare.com" breaks the 4 mm rule.**
  - The right border is 14 units ≈ 3.6 mm wide, so text centred in it is about 1.8 mm from the trim. It can't be 4 mm inside.
  - **Recommend:** keep it as specified and exempt this one credit line from the 4 mm rule. A ±1 mm cut tolerance can nick it, but never event text.
  - Alternatives: default the option to off, or move it into the caption.
- **D2 — Orientation (3.6).**
  - **Recommend:** follow the screen (`matchMedia('(orientation: landscape)')`). Rotating the phone switches the viewfinder frame live.
  - Plus a small "לאורך / לרוחב" toggle in the camera, for phones with rotation lock and for desktops. With the toggle, a guest can take a landscape magnet while holding the phone upright: a wide crop of the portrait stream, about 1080 px across a 1122 px window, which is acceptable.
  - Gallery uploads take orientation from the image (width > height → landscape).
  - In landscape the camera controls move to the side, so the frame uses the full height.
- **D3 — Raw photo = the full camera frame.**
  - Today `raw_photo_url` stores the 3:4 centre crop.
  - **Recommend:** store the uncropped frame (mirror and vintage applied). The guest composite is its centred cover crop, so the crop editor's default (centred, zoom 1) reproduces exactly what the guest saw, and the operator can pan to reveal more.
- **D4 — Where a job's orientation lives.**
  - **Recommend:** no new column. A composite is always exactly 900×1200 or 1200×900, so orientation is read from it. When the operator re-crops, it is stored in `crop_config.orientation`; the legacy `aspect: '3:4'|'4:3'` is still read.
  - Alternative: a `print_jobs.orientation` column set by the guest insert (needs no policy change).
- **D5 — The 6 applied `frames_meta` migration files.** Delete (recommended, see §1.6) or keep.
- **D6 — Landscape print.**
  - The physical piece is always one 3×4″ half of the 6×4″ media.
  - **Recommend:** print every magnet on a 3×4″ page, with landscape composites rotated 90° on a canvas before printing. This avoids driver-dependent landscape handling.
- **D7 — Gaps the appendix doesn't specify.** I'll use these unless you say otherwise:
  - names → date gap 4 / 3 (as in A) for B, C, F, G;
  - D portrait: icon → names gap 6 / 5, names → date gap 4 / 3;
  - B: names → hairline row gap 5 / 4;
  - safe text width 268 / 368 units (4 mm on each side). D landscape loses the icon width plus its 14-unit gap.
- **D8 — Template fonts are self-hosted.**
  - These are woff2 files under `public/fonts/templates/`: Bellefair, Bona Nova, Great Vibes, Karantina 700, Gveret Levin and Heebo 300. All are OFL and all are on Google Fonts with Hebrew subsets, except Great Vibes, which is Latin only, matching the spec.
  - They are registered through the `FontFace` API under prefixed names, so they never clash with the UI's Heebo, and loaded before every draw.
  - Self-hosting gives the same glyphs on the guest phone, the station and the test harness, and printing doesn't depend on Google.

---

## 3. Name, date and text rules (3.3–3.4)

- **Splitting:** A, B, C and F split `event.name` on `&` when it has exactly two non-empty parts. Any other shape is shown whole, with no heart or "&" glyph. D and G draw the name as "n1 & n2" text, normalising the spaces around "&".
- **Direction:** detected per string. Hebrew letters → RTL and the name order is reversed visually (n1 on the right). Otherwise LTR. In G the font is chosen the same way: Gveret Levin for Hebrew, Great Vibes for Latin.
- **Fit:** the whole names row (names, gaps and icon) is scaled by one factor, down to the safe width, with a floor of 50%. It is never clipped. I'll test it with "אלכסנדרה & יהונתן" and "Alexandra & Jonathan".
- **Tracking:**
  - Hebrew: no letter-spacing.
  - Date digits: tracking drawn glyph by glyph. `ctx.letterSpacing` is missing on older iOS Safari, and this keeps every device identical.
  - The vertical URL (Latin): tracked the same way.
- **Dates:** DD.MM.YYYY from the `event.date` string, with no timezone shift. G uses `DD · MM · YYYY`.

---

## 4. DB (written to `supabase/pending/` in phase 2, applied by you)

Two files, so live never runs code that doesn't match the schema.

### 4.1 `20261026_polaroid_templates_add.sql` — additive. Apply **before** the PR merges; old code ignores it.

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS template_id      text  NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS template_options jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(template_options) = 'object');
-- Every existing (test) event gets 'A' + {} from the defaults.
```

- **No CHECK on the id list.** Adding a template stays a code-only change, and the renderer falls back to A for an unknown id.
- **Options store named choices, not hex.** The renderer validates them against the template and falls back to the default:
  - A `{ heart: 'taupe'|'red'|'charcoal', url: true|false }`
  - B `{ amp: 'gold'|'red'|'taupe' }`
  - D `{ icon: 'gold'|'taupe'|'charcoal' }`
- **RLS:** no new policy. Guests read events through the existing SELECT policy. Once the hardening migration is applied, updates on magnet events are admin-only (`events_update_magnet_admin_only`, hardening §6), which covers the new columns.

### 4.2 `20261026_polaroid_templates_drop.sql` — contract

Apply **after** the deploy, after the hardening migration, and after you've emptied the `overlays/` storage paths.

```sql
ALTER TABLE public.events DROP COLUMN IF EXISTS overlay_frame_url;
DROP TABLE IF EXISTS public.frames_meta;          -- policies + indexes go with it
DROP POLICY IF EXISTS "storage_overlays_insert_admin" ON storage.objects;
-- storage_photos_update_admin recreated for 'covers' only (was overlays + covers)
```

Guards in the file:
- abort unless 4.1 and the hardening migration are applied;
- abort if anything still depends on `overlay_frame_url`, with no `CASCADE`.

### 4.3 Storage listing (read-only, for you to run in the SQL editor)

```sql
SELECT bucket_id, name, (metadata->>'size')::int AS bytes, created_at
FROM storage.objects
WHERE (bucket_id = 'photos' AND name LIKE 'overlays/%')
   OR bucket_id = 'overlays'
ORDER BY bucket_id, name;
```

- I have no live access, so I can't list the objects myself.
- Delete them from the dashboard's Storage page, not with SQL: deleting `storage.objects` rows leaves the files behind.

---

## 5. Template system (phase 3)

### 5.1 One renderer: `src/lib/polaroid/`

| File | Contents |
|---|---|
| `printSpec.js` | **The one output-size value:** `PRINT_SPEC = { widthIn: 3, heightIn: 4, dpi: 300 }`. Design sizes (300×400 / 400×300), window rects, paper `#FDFDFB`, 4 mm safe margin. Scale = output px / design units (3 at 300 DPI). |
| `templates.js` | A, B, C, D, F, G as data: fonts, colours, portrait and landscape sizes, the options schema with Hebrew labels and defaults, `DEFAULT_TEMPLATE_ID = 'A'`, `getEventTemplate(event)`. |
| `text.js` (pure) | `splitNames`, `isHebrew`, date format, fit-to-width, tracked-glyph layout. |
| `icons.js` | Heart, rings (with paper-coloured under-strokes so they interlock) and sparkle as `Path2D`, from the appendix geometry. |
| `fonts.js` | The `FontFace` registry; `loadTemplateFonts(id)` is memoised and awaited before any draw. |
| `renderPolaroid.js` | `drawPolaroid(ctx, { template, orientation, scale, photo, crop, names, date, options, mode })`. **The only drawing code.** |

- `mode: 'composite'`: paper, then the photo (cover-filled into the window), then the caption.
- `mode: 'overlay'`: the same calls with no photo; the window is cleared to transparent.
- Both outputs come from one function, so the window geometry is identical by construction.
- Exports:
  - `renderComposite()`: a canvas at 900×1200 / 1200×900, then a JPEG 0.92 blob;
  - `renderOverlay(cssWidth × devicePixelRatio)`;
  - `photoSourceRect(photo, windowAspect, crop)`, the single cover and crop function. Guest = centred at zoom 1; operator = pan/zoom.
- No rounded corners, shadow or rotation are drawn on the magnet. The UI may put a shadow around the preview element.

### 5.2 Fonts

Loaded by the renderer only on the camera, review, picker and station screens, not on every page.

### 5.3 Viewfinder (phase 4)

- A container at the design aspect, fitted between the header and the controls.
- The `<video>` sits absolutely at the window's percentages (from `printSpec.js`) with `object-fit: cover`.
- The overlay canvas from 5.1 sits on top.
- The overlay is re-rendered on orientation change or resize. A spinner shows until the fonts are ready.

### 5.4 Capture and review (phase 4)

- **Capture:** the full video frame (D3), then review.
- **Review:** shows `renderComposite`, with retake and send to print.
- **Send to print:**
  1. upload the composite (900×1200 / 1200×900);
  2. upload the raw frame;
  3. `photos.create`;
  4. `printJobs.create`.

  The order and the rollback stay as they are today.

### 5.5 Station (phase 4)

- The thumbnail shows the stored composite whole (`object-contain`, at its aspect).
- `CropEditor` previews through `renderComposite` with the current crop and saves `{ orientation, panX, panY, zoom }`.

### 5.6 Print (phase 4)

- `printJob`:
  - if `crop_config` and `raw_photo_url` exist → re-render from raw + crop with the event's template;
  - otherwise → the stored composite, as-is.
- `printImage` opens the popup with `@page { size: 3in 4in; margin: 0 }` and the image at exactly 3×4 in. The size comes from `PRINT_SPEC`, and landscape is rotated per D6.
- One popup per job; copies are separate pages, as today.

### 5.7 Template picker (phase 4)

- `src/components/magnet/templates/TemplatePicker.jsx`, used by both `CreateMagnetEvent` (replacing the frame step) and a new "עיצוב המגנט" section in `MagnetEventDashboard`.
- Each template is shown in portrait and landscape, rendered with the event's real names and date over a neutral placeholder photo (a gradient drawn in canvas, so no asset is needed).
- The selected template shows its options as chips or a toggle. The default is A.
- The CreateMagnetEvent top preview becomes the same live render.
- UI chrome follows §0.6 (dark, indigo, Heebo, Hebrew labels). The template fonts and colours apply only inside the rendered magnet.

---

## 6. Phase order

1. **Phase 2:**
   - delete everything marked delete in §1;
   - remove the "כלים" tab;
   - remove the stickers;
   - write the two pending migrations and the storage listing.

   Each phase is its own commit; the PR ships them together.
2. **Phase 3:** `src/lib/polaroid/*` with unit tests for the pure layout (`splitNames`, direction, date, fit, scale and window maths), plus the fonts.
3. **Phase 4:** camera, review, station, crop editor, print, picker, create-event and dashboard.
4. **Phase 5:** run in Chromium (Playwright, mocked Supabase, fake camera):
   - a contact sheet of 6 templates × 2 orientations × HE/EN × short/long names at 900×1200;
   - an automated window check: the transparent window of the overlay, rendered at print size, must equal the photo rect of the composite for every template and orientation, to the pixel. The camera page's video rect is also checked against the overlay's window, in CSS pixels;
   - a 3×4 in print-preview PDF, one page per template (plus landscape pages);
   - the full flow at 390×844 and 844×390: create event → capture portrait and landscape → review → station → print popup;
   - lint, build, tests, and a grep for references to deleted files.

   I can't drive a real phone: you'll need to check that on your iPhone.

**Note:** open PR #9 also edits the `AdminShell` tab list. Whichever merges second needs a one-line conflict fix; I'll handle it here if #9 merges first.
