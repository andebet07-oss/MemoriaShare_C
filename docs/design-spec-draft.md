# Design spec — draft (2026-10-26)

**Status:** draft. It is applied and reviewed in the admin + guest redesign PR. The rules already approved live in `CLAUDE.md` §0.6; this file adds the concrete values. When the redesign PR is approved, these values move into `CLAUDE.md` and this file is deleted.
Decisions already taken are marked ✅. Audit behind it: `docs/design-audit.md`. Out of scope: fonts and colours inside printed magnet designs, frames and stickers.

## Colour: semantic tokens only

| Token | Proposed value | Use |
|---|---|---|
| `background` | `#121214` | page (optionally `bg-glow`, one soft indigo radial) |
| `card` | `#1a1a1e` | cards, panels, list rows, sheets |
| `secondary` | `#232328` | inputs, raised controls, neutral chips |
| `border` | `#2c2c32` | every hairline |
| `foreground` / `muted-foreground` | `#fcfcfe` / `#9b9ba4` | text / secondary text, captions (6.8:1) |
| `primary` | ✅ `#5f69d3` | fills: primary button, selected chip, tab badge (white text 4.6:1) |
| `brand` | ✅ `#7c86e1` | accents: links, section labels, active tab, focus ring, icon tints |
| `destructive` | `#ef4444` | errors, destructive actions |
| `status-pending` / `-printing` / `-ready` / `-rejected` | amber `#f5b544` / sky `#60a5fa` / emerald `#34d399` / red `#f87171` | print-job status, via `<StatusBadge>` only |

- **Status colours:** defined once, in `src/components/system/statusStyles.js`. Lead stages map onto them: new → brand, contacted → pending, converted → ready, closed → muted.
- **No hard-coded colours** in components: no hex, `rgb()`, `violet-*`, `gray-*`/`zinc-*`, `white/…` or `black/…`.
  - Exceptions: scrims and text over photos or the camera feed may use `foreground/…` and `background/…`; printed designs are out of scope.

## Typography: Heebo for all UI ✅
- Numbers use Heebo with `tabular-nums` ✅.
- No letter-spacing and no `uppercase` on Hebrew ✅. There are no English UI labels left ✅.
- Nothing smaller than 12px. The one exception is the lead wizard's phone mockup, which scales in `cqw`.

| Role | Classes | px |
|---|---|---|
| Page title | `text-2xl md:text-3xl font-semibold` | 24 / 30 |
| Section title | `text-lg font-semibold` | 18 |
| Card title | `text-base font-semibold` | 16 |
| Body | `text-sm` (guest-facing copy may use `text-base`) | 14 |
| Caption | `text-xs text-muted-foreground` | 12 |
| Section label | `text-xs font-semibold text-brand` (`<SectionLabel>`) | 12 |
| KPI number | `text-3xl font-semibold tabular-nums` (`<StatTile>`) | 30 |

**Print Station** is read on a tablet at a distance, so it uses the same roles one step up:
- body `text-base`
- card title `text-lg`
- section title `text-xl`
- KPI `text-4xl`
- status badge `text-sm`

Its minimum text size is 14px.

**Approved Hebrew labels ✅**

| English | Hebrew |
|---|---|
| `Admin` | ניהול |
| `Admin · כלים` | ניהול · כלים |
| `Admin · 02` | כלים · מודרציה |
| `Magnet · מוכן` | מגנט · מוכן |
| `Print Station · תחנת הפעלה` | תחנת הדפסה |
| `Live` | מחובר |
| `Print Station מיועד למנהלים בלבד.` | תחנת ההדפסה מיועדת למנהלים בלבד. |
| `Powered by MemoriaMagnet` | מופעל על ידי Memoria |

## Layout
- **Page:**
  - The shell is `min-h-screen bg-background text-foreground`.
  - Content uses `mx-auto w-full px-4 md:px-8 pt-6 md:pt-10 pb-16`.
  - Widths: guest/public flows `max-w-md`, admin `max-w-5xl`, Print Station `max-w-7xl`.
- **Rhythm:** `gap-8` between sections, `gap-3` between cards in a list, `gap-2` inside a card. Sections become two columns on `lg` where the content allows.
- **Header:** `<PageHeader label title subtitle action>` gives a section label, then the page title, then a muted subtitle. The action sits at the inline end and stacks under the title on mobile.
- **Card:** `<Card>` is `rounded-2xl border border-border bg-card p-4 md:p-5`. `interactive` adds hover and press feedback. No shadows or gradients.
- **Tabs:** `<TabNav>` uses underline tabs (`text-sm font-medium`, active `border-brand text-foreground`) and scrolls horizontally on mobile.
- **Filter chips:** `rounded-full h-8 px-3 text-xs`, active `bg-brand/15 text-brand border-brand/30`.
- **Buttons:** `<Button>` comes in four variants:
  - primary (`bg-primary`): one per view;
  - secondary (`bg-secondary` + border);
  - ghost;
  - destructive (tinted red).

  ✅ `onImage` is a white fill with dark text, for the guest camera CTA only.
  Sizes are `sm` h-9, default h-11 and `lg` h-14 (full-width hero CTAs). All buttons are `rounded-xl` and `font-semibold`.
- **Radius:**
  - controls and inputs: `rounded-xl`;
  - cards: `rounded-2xl`;
  - bottom sheets: `rounded-t-3xl`;
  - pills and avatars: `rounded-full`.
- **Inputs:** `h-11 rounded-xl bg-secondary border-border`, with 16px text on mobile so iOS doesn't zoom.
- **Site header and mobile drawer:** keep their current design ✅.
- **Shared components (`src/components/system/`):** `PageHeader`, `SectionLabel`, `Card`, `StatTile`, `TabNav`, `StatusBadge`, `statusStyles`.
