# Design audit — surviving Magnet surfaces (2026-10-26)

Scope: every surface that survives Magnet-only (public, guest, admin). Share pages are excluded; they are deleted in Stage 2.
Method: the counts below come from a scan of each surface's source files: every Tailwind class plus every literal `#hex` / `rgba()`. Each surface was also rendered at 390×664 and 1440×900 in headless Chromium with mocked data, after Part A (global dark mode).
Fonts and colours inside printed magnet designs, frames and stickers are out of scope. They inflate the literal-colour counts for MagnetReview, CreateMagnetEvent and the frame editors.

## Tokens in use per surface

| Surface | Colour classes: semantic / palette / literal hex·rgba | Off-token hues | Font families | Font sizes in use | tracking / uppercase | Radii in use |
|---|---|---|---|---|---|---|
| Header + drawer | 57 / 4 / 0 | indigo | (inherits Heebo) | xs sm lg | — | full lg |
| Lead wizard + success | 80 / 35 / 5 | indigo | font-heebo | [10px] xs sm base xl 3xl | 1 | 2xl full lg none xl |
| MagnetGuestPage | 0 / 33 / 0 | emerald, violet, yellow | font-heebo | [10px] [11px] xs sm lg 3xl | 3 | 2xl full |
| MagnetCamera | 0 / 43 / 42 | hex, indigo, red, violet, zinc | (inherits Heebo); inline: Heebo, Georgia | [10px] [12px] xs sm base lg xl | 1 | 2xl 3xl full |
| MagnetReview | 0 / 16 / 96 | gray | (inherits Heebo); inline: Georgia | [10px] [11px] xs sm base xl 2xl | 6 | 2xl full t-3xl xl |
| PrintStatusModal | 0 / 27 / 1 | blue, emerald, hex, red, yellow | (inherits Heebo) | xs lg | — | 2xl full t-3xl xl |
| AdminShell | 6 / 8 / 3 | violet, violet #7c3aed | (inherits Heebo) | [9px] [10px] xs | 2 | full lg |
| Admin overview | 28 / 14 / 15 | emerald, indigo, red, violet, violet #7c3aed | font-heebo, font-playfair | [10px] xs sm lg 2xl 3xl | 13 | 2xl full lg xl |
| Magnet events list | 24 / 12 / 13 | red, violet, violet #7c3aed | font-heebo, font-mono | [10px] [11px] xs sm lg 2xl | 2 | 2xl full lg xl |
| CreateMagnetEvent | 72 / 40 / 49 | indigo, red, zinc | font-heebo, font-mono; inline: Heebo | [7px] [8px] [9px] [10px] xs [13px] sm base lg 2xl 3xl | 21 | 2xl full lg xl |
| MagnetEventDashboard | 1 / 28 / 13 | lime, violet, violet #7c3aed | font-mono | xs sm base 2xl | 6 | 2xl lg xl |
| Leads | 7 / 18 / 24 | red, violet, violet #7c3aed | font-heebo | [10px] [11px] xs sm lg 2xl | 2 | 2xl full lg xl |
| Frames library | 40 / 91 / 105 | amber, emerald, red, violet, violet #7c3aed | font-heebo | [8px] [9px] [10px] [11px] xs [13px] sm xl 2xl 3xl | 24 | 2xl base full lg md xl |
| Frames moderation | 19 / 16 / 0 | amber, emerald, violet | font-heebo | [9px] [10px] [11px] xs sm 3xl | 2 | full lg xl |
| Print Station | 0 / 141 / 7 | blue, emerald, hex, red, violet, yellow | (inherits Heebo) | [10px] [11px] xs sm base lg xl | — | 2xl 3xl full lg xl |

*Semantic* = theme tokens (`bg-card`, `text-muted-foreground`…). *Palette* = raw Tailwind colours (`text-white/40`, `bg-violet-600`, `text-yellow-400`…). *Literal* = hard-coded `#hex` / `rgba()` in classes or inline styles.

## Where the surfaces diverge

**Accent: four different "primary" colours**
- Indigo `#7c86e1` (`bg-primary`) is used by the header, lead wizard and CreateMagnetEvent.
- Violet `#7c3aed → #6d28d9` gradients are used by the admin primary buttons ("עמדת הדפסה", "אירוע חדש", "צור אירוע מגנטים"), the admin tabs and badges, the "ADMIN" mark and the admin section labels.
- White is used by the guest CTA "צלמו ושלחו להדפסה".
- Blue-600 is used by the Print Station "הדפס" buttons, with emerald for "mark ready".

**Page backgrounds: five variants**
- The lead wizard and admin use a gradient from `cool-950` through `cool-900`.
- The guest page uses `bg-black` plus a `violet-950` gradient.
- Print Station uses `bg-[#0a0a0a]`.
- The status sheet uses `bg-[#111]`.
- The camera and CreateMagnetEvent previews use `bg-zinc-900`.

**Surfaces and borders**
- Admin and lead use `bg-card` / `border-border`.
- The guest, dashboard, leads and Print Station surfaces use `white/5`, `white/[0.04]`, `rgba(255,255,255,0.03|0.07)` and `border-white/8|10|15`.

**Status colours are defined four times, two of them differently**
- Print-job statuses are defined in `PrintStatusModal` and again in `ProJobCard` (yellow / blue / emerald / red).
- The Print Station stat pills show "rejected" as `white/30`.
- The guest page's pending chip uses `yellow-300`.
- Lead stages in `LeadsPanel` use hex blue / violet / emerald / gray. In `AdminOverview` they use indigo / violet / emerald / muted.

**Typography**
- Font families:
  - Playfair is still used for the overview KPI numbers.
  - `font-mono` is used for event codes.
  - Montserrat-style tracked labels are everywhere.
- Font sizes:
  - Thirteen distinct sizes are in use, from 7px to 30px.
  - 7–11px text appears on 12 of the 15 surfaces.
- Letter-spacing or `uppercase` appears on 12 of the 15 surfaces, mostly the editorial labels "01 · סקירה" and "אירועים קרובים".

**English labels**
- AdminShell: `Admin`.
- FramesLibrary: `Admin · כלים`.
- Moderation: `Admin · 02`.
- CreateMagnetEvent: `Magnet · מוכן`, plus `Magnet` and `overlay` in the preview.
- PrintStation: `Print Station · תחנת הפעלה`, `Live`, `Print Station מיועד למנהלים בלבד.`
- Guest page: `Powered by MemoriaMagnet`.

**Radii and buttons**
- Five radii (`lg`, `xl`, `2xl`, `3xl`, `full`) are used without a rule.
- The CTA shapes differ by surface:
  - Header: pill (`rounded-full`).
  - Lead: `rounded-xl`.
  - Admin: `rounded-lg`.
  - Guest: `rounded-2xl`.
- Secondary and ghost buttons are restyled locally on every surface.

**Layout**
- Content width:
  - The admin overview, events, leads and event dashboard use a 672px column (`max-w-2xl`), which looks like a phone on a 1440px screen.
  - The frames pages are full-width.
  - CreateMagnetEvent is a `max-w-sm` split view.
  - Print Station is `max-w-7xl`.
  - The guest page is `max-w-md`.
- There are five page-header patterns:
  - label + title + count;
  - label only (overview);
  - `Admin ·` label + title;
  - back link + title (event dashboard);
  - Print Station's own top bar.

**Print Station**
- Text is mostly 10–14px: `text-[10px]` ×5, `text-[11px]` ×4, `text-xs` ×15, `text-sm` ×13.
- That is small at tablet distance today; the station has no large sizes to keep.

**Logo**
- `public/LOGO.png` is an opaque black rectangle that reads "MEMORIASHARE", so it shows as a black box on the dark header.
- It needs a transparent Memoria wordmark.

**Dead code (not restyled)**
- `PrintQueue.jsx`, `PrintJobCard.jsx` and `CreateMagnetEventForm.jsx` are not imported anywhere.
- They are candidates for the Stage 2 deletion.
