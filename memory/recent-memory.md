---
type: recent-memory
updated: 2026-04-17T13:30Z
horizon: 48 hours
---

# Recent Memory (Last 48 Hours)

## Session 2026-04-17 PM — MagnetLead Cover Edit + Sticker System v2

### Commits (chronological)
- `f1a6380` pov update7 — CreateEvent, CreateMagnetEvent, MagnetLead POV tokenization
- `7376934` pov update8 — MagnetLead: pinch/drag cover image transform on phone mockup (+267/-91)
- `00654d5` pov update9 — MagnetLead 2-line polish
- `5583664` pov upgradeStikers — sticker system v2 + 3 new wedding frames + FramePicker removed

### Decision A — MagnetLead cover image design mode
Added `coverImage`, `imageTransform`, `isDesignMode`, `onImageTransformChange` props to `MagnetPhoneMockup`. Implements same pinch/drag/touch flow that CreateEvent uses (calculates initial scale from natural image dims vs screen dims, min-scale clamp to prevent under-zoom). Adds local `compressImage()` helper (MAX=1200, quality 0.7) — **mirrors** the CreateEvent implementation. Flagged as tech debt: should live in `@/functions/processImage` (already imported by MagnetReview).

### Decision B — Sticker System v2 (Y2K / Pinterest aesthetic)
Replaced `badge/stamp/emoji/text` types with 5 new ones:
- `svg` — inline SVG from new `svgStickers.js` (base64-encoded data URL → `Image` cache → `ctx.drawImage`)
- `script-text` — `Great Vibes` / `Parisienne` cursive
- `retro-text` — `Bebas Neue` / `Limelight` bold caps in `#facc15` gold
- `handwritten-text` — `Caveat` / `Patrick Hand` 700
- `editorial-text` — `Abril Fatface` / `Playfair Display`

`svgStickers.js` (NEW): 24 stickers — heart, heartRed, star, starGold, disco, discoPink, evilEye, lips, camera, eiffel, butterfly, cherry, flower, crown, bow, sparkle, sun, moon, coffee, strawberry, cassette, rose, hebrewChai, starOfDavid. All use white 3px outer stroke with `paint-order="stroke"` for die-cut look. 64×64 viewBox, rendered at `w * 0.18` on canvas.

`drawSticker()` in MagnetReview extended with per-type renderers; accepts a pre-loaded SVG Image cache via `svgImgCache` ref + `ensureSvgImage()` helper (Promise-based, caches by `svgKey`).

`stickerPacks.js` — all 4 packs (WEDDING, BAR_MITZVAH, BIRTHDAY, default) rebuilt with svg + text-style combinations. Hebrew text preserved (`מזל טוב`, `בר מצווה`).

### Decision C — FramePicker removed, logic inlined
`src/components/magnet/FramePicker.jsx` **deleted**. Frame selection chrome now lives directly inside `CreateMagnetEvent.jsx` as `FrameThumbnail` (reduces prop drilling; single source of truth). Thumbnail sizing bumped `THUMB_W` 88→108px (better touch targets per PRD). Added `isNew` badge ("חדש") on new frames with violet background.

### Decision D — 3 new wedding frames (`framePacks.js` +285 lines)
- `wedding-polaroid-tape` — white polaroid border + tan tape strips (rotated ±0.18 rad at top corners), Caveat cursive name
- `wedding-deco-gold` — gold double border + corner sunburst fan; Limelight "WEDDING" tagline + Secular One name
- `wedding-hairline-crest` — minimal hairline border (`rgba(80,70,55,0.18)` 0.8px)

### Tech Debt Created
- **Duplicate `compressImage`** — lives in both `src/pages/MagnetLead.jsx` (inline) and `src/functions/processImage.js` (exported, used by MagnetReview). Consolidate.
- **FramePicker.jsx deletion orphans no imports** — verified via git show, but double-check any lingering import in `MagnetEventDashboard` / `CreateMagnetEvent` if errors surface.

---

## Session 2026-04-17 AM — POV Brand Pivot LOCKED IN (Canonical)

### Decision
Efi explicitly locked the POV.camera cool-dark / indigo brand as the canonical MemoriaShare palette. The prior violet-heavy brand is retired from the platform shell (violet remains only as MemoriaMagnet sub-brand accent). This was after seeing the refactored home + pages, then directing: *"העיצוב שהטמענו הוא העיצוב שהחלטתי שיהיה בפרוייקט מבחינת הצבעים. זה הקו שאנחנו הולכים איתו."*

### Brand (canonical)
- Background: `#1e1e1e` (cool-900) + gradient to cool-950
- Primary accent: `#7c86e1` (indigo-500)
- Text: `#fcfcfe` (cool-50)
- Muted: `#b4b4b4`
- Display serif: Playfair Display
- Body: Heebo (Hebrew)
- Micro-labels: Montserrat `tracking-[0.3em] uppercase text-[10px]`
- Sub-brand: Violet `#7c3aed` — MemoriaMagnet UI only

### Pages Aligned (Sessions 2 + 3)
- `src/pages/Home.jsx` + `HeroSection.jsx` + `Features.jsx` + `HowItWorks.jsx` — added `.dark`, fixed contrast bug, indigo label scheme
- `src/pages/CreateEvent.jsx` — wizard root: `.dark` + cool-dark gradient; radial glow `rgba(124,134,225,0.06)`; step headers → Playfair
- `src/pages/MyEvents.jsx` (/host) — full refactor: editorial label `01 · ניהול`, Playfair 3xl-4xl, semantic tokens throughout (no more hardcoded `bg-[#0a0a0a]` etc.), dialog → `bg-cool-950/95`
- `src/pages/CreateMagnetEvent.jsx` — admin wizard: all 4 steps get editorial labels (`01 · שם`, `02 · תאריך`, `03 · מכסה`, `04 · מסגרת`); shell cool-dark + violet sub-brand accent preserved
- `src/components/admin/AdminShell.jsx` — `.dark` wrap, `border-border`, text-muted-foreground, violet-500 active tab underline
- `src/components/admin/AdminOverview.jsx` — KPI cards semantic tokens, Playfair numerals, editorial section label `01 · סקירה`, STATUS_COLORS updated
- `src/Layout.jsx` — `.luxury-button` + `.premium-submit-button` CSS rewritten: cool-neutral (`#fcfcfe → #e8e8ec`) with indigo shadows `rgba(124,134,225,0.18-0.28)`
- `src/components/dashboard/cards/CardElegant.jsx` — "gold" → "indigo/accent" rename, hex swaps
- `src/components/magnet/framePacks.js` — "gold" references in UI chrome swapped to "indigo" (frame artwork may retain metallic tones)
- `src/components/dashboard/PrintableShareCards.jsx` — Hebrew label `קשת זהב` → `קשת אינדיגו`
- `src/components/admin/LeadsPanel.jsx` — contacted status amber → violet `#a78bfa`

### Root Cause Fix
Silvery home-page bug root-caused: no `.dark` ancestor existed in the app, so semantic tokens (`bg-background`, `text-foreground`, `border-border`) resolved to light palette values. Gradient `from-background via-cool-900 to-background` rendered as `#fafafa → #1e1e1e → #fafafa`. Fix: add `dark` class to every page root that expects dark appearance; use explicit cool-tone gradient (`from-cool-950 via-cool-900 to