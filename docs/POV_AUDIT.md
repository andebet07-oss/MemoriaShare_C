# POV.camera — Competitor UX/UI Audit
**Target:** https://app.pov.camera/
**For:** MemoriaShare design-system alignment
**Date:** 2026-04-16
**Methodology:** Live DOM/CSS introspection (Chrome MCP) + static screenshot review (`public/POV/*`) + MemoriaShare source cross-reference.

---

## 0. Executive Summary

POV.camera is a mobile-first event photo-sharing PWA that reads as a **native iOS app disguised as a web app**. Its entire aesthetic leans on three moves repeated with extreme discipline:

1. **One neutral axis** — warm off-black `#1e1e1e` ground, cool off-white `#fcfcfe` ink, and a dozen alphas of that same ink for every surface, border, and fill.
2. **One brand accent** — periwinkle-indigo `#7c86e1` used *only* for the active/selected/primary state. Never decorative.
3. **Glass-over-photograph** — the hero surface is always a user-uploaded photo; UI chrome floats above it as semi-transparent glass. The app's identity *is* the user's photo.

MemoriaShare has a different, more editorial identity on paper — warm gold `#c9a96e`, serif display, RTL-Hebrew-first. But the implementation (`CreateEvent.jsx`, `Home.jsx`) hard-codes cold indigo and near-black hex values that accidentally mimic POV's cool-tech look while abandoning MemoriaShare's own warm-luxury tokens. **The gap is token discipline, not architecture.**

Priority fixes (detailed in §6):
- Replace hard-coded hexes with existing `gold-*` / `warm-*` tokens and `hsl(var(--*))` semantic colors.
- Lift POV's step-wizard *structure* (progress bar, question-as-title, glass back button + primary next, live phone preview) while replacing its cold indigo with MemoriaShare's warm gold.
- Introduce a standard glass-card system (`bg-light/10` equivalent → `bg-gold/10` or `bg-warm-50/10` in our dark mode).

---

## 1. Design Token Map — POV.camera (Extracted)

### 1.1 Color
All observed values, pulled from the compiled stylesheet `/assets/index-2f251ba0.css`.

| Role | HEX | Alpha variant | Usage |
|---|---|---|---|
| Ground (body bg) | `#1e1e1e` | — | App background, full-bleed |
| Ink (foreground) | `#fcfcfe` | — | Primary text, icons |
| Brand accent | `#7c86e1` | `7c86e1cc` (80%) on hover | Selected step, active tile, Next button, price, toggle ON |
| Premium accent | `#ffd808` | — | Upgrade / premium-gate CTA |
| Surface L1 | `#25282c` | — | Card behind inputs |
| Surface L2 | `#343434` | — | Segmented control track |
| Surface L3 | `#3b3d41` | — | Hover on neutral control |
| Divider | `#5b5b61` | — | Hairline between rows |
| Scrim dark | `#121212` @ 70% | `#121212b2` | Modal backdrop |
| Scrim medium | `#1e1e1e` @ 60% | `#1e1e1e99` | Bottom-sheet backdrop |

**Alpha ladder** (applied to ink `#fcfcfe` — this is the glassmorphism toolkit):

| Opacity | Token name (POV-internal) | HEX | Typical use |
|---|---|---|---|
| 5% | `light/5` | `#fcfcfe0d` | Disabled chip |
| 10% | `light/10` | `#fcfcfe1a` | **Glass card bg (default)** |
| 15% | `light/[0.15]` | `#fcfcfe26` | Border on glass card |
| 20% | `light/20` | `#fcfcfe33` | Pressed state bg |
| 30% | `light/30` | `#fcfcfe4d` | Divider strong |
| 50% | `light/50` | `#fcfcfe80` | Icon secondary |
| 60% | `light/60` | `#fcfcfe99` | Body text secondary |
| 80% | `light/80` | `#fcfcfecc` | Body text primary |

> Critical pattern: POV does **not** use separate grays. Every "grey" is actually `ink @ n%`. This is why the whole app feels cohesive — every surface and text color is a derivative of the same two values.

### 1.2 Typography

Self-hosted fonts, loaded via `@font-face`:

| Family | Weights loaded | Used for |
|---|---|---|
| **Satoshi** | 300, 400, 500, 500-italic, 700 | All UI text, 95% coverage |
| Caveat | 400 | Handwritten accent (event cover overlay) |
| Zing Rust Demo Base | 400 | Display stencil (event title overlay) |
| Highway Gothic, Highway Gothic Expanded | — | Numeric/ticker accents |
| digital, digital-7 | — | Countdown display |
| Sink | — | Decorative overlay |

**Scale** (inferred from rendered sizes):

- Question/Title: `text-2xl` → `text-3xl` (24–30px), weight 500, tracking `-0.4px`
- Body: `text-base` (16px), weight 400, color `ink @ 80%`
- Label/caption: `text-sm` (14px), weight 400, color `ink @ 60%`
- Price (step 7): `text-5xl` weight 700, `ink @ 100%`
- Button: `text-base` weight 700, tracking `-0.4px`

### 1.3 Radii

| Radius | Where |
|---|---|
| `6px` (`.375rem`) | Small chips, input corners |
| `8px` | **Default button + card** |
| `12px` (`.75rem`) | Phone-mockup inner |
| `calc(6px + .2vh)` | Calendar date chips (scales with viewport) |
| `9999px` / `50px` | Pills, toggle track, circular icon bg |

> POV never uses >16px radii. Everything feels precise, not playful. Matches MemoriaShare's own `--radius: 0.25rem` "editorial almost-sharp" philosophy.

### 1.4 Shadows & Blurs

- Glass card: `backdrop-filter: blur(20px)` + `background: rgba(252,252,254,0.10)` + `border: 1px solid rgba(252,252,254,0.15)`. No drop shadow.
- Floating buttons (sticky bottom): none, relies on scrim + blur.
- Accent button (Next): no shadow — color alone carries hierarchy.

### 1.5 Motion

Two canonical curves observed:
- `cubic-bezier(0.4, 0, 0.2, 1)` duration `300ms` — all button/card hovers, color transitions.
- `shimmering` keyframe — gradient sweep across skeleton.
- `slide-progress` — the top progress bar fill.

No spring physics. No layout animations on navigation — pages fade-cross, 200ms.

### 1.6 Layout primitives

- Root: `<main class="relative flex flex-col items-center w-full h-dvh overflow-x-hidden">`
- `h-dvh` (not `h-screen`) — this is what produces the "no browser chrome" feel on mobile Safari.
- `overflow-x-hidden` — kills any horizontal scroll surprises from RTL/overshoot.
- Content column: `max-w-md` (~448px), vertically centered, padded `px-6`.

---

## 2. Component Deconstruction

### 2.1 Primary Button (Next / Continue / Save)

- Full-width within content column (≈320–360px), height `44px` (iOS HIG minimum).
- Default state: `bg-[#7c86e1] text-white font-bold tracking-[-0.4px] rounded-[8px]`.
- Disabled state: `bg-light/10 text-light/30 cursor-not-allowed` (same chrome as a glass card — visually present but obviously inert).
- Transition: `all 300ms cubic-bezier(0.4,0,0.2,1)`.

### 2.2 Ghost/Back Button

- Square glass card, `44×44px`, `rounded-8px`, `bg-light/10`, border `light/15`, backdrop-blur.
- Only icon inside (chevron), color `ink @ 80%`.
- Paired with Next button in a horizontal flex row: back takes intrinsic width, next `flex-1`.

### 2.3 Input (Text)

- Borderless. `bg-light/10 rounded-8px px-4 py-3 text-white placeholder:text-light/40`.
- Focus: `ring-2 ring-[#7c86e1]/40`. Never a solid border on focus.
- Hebrew equivalent should feel identical: `text-right` by default (since `html[dir="rtl"]`), caret auto-flips.

### 2.4 Segmented Control ("Photos per person")

- Track: `bg-light/10 rounded-8px p-1 flex`.
- Each segment: `flex-1 py-2 text-center rounded-[6px] text-sm font-medium`.
- Selected: `bg-transparent text-[#7c86e1] border border-[#7c86e1]` (outline, not fill — lightweight).
- Idle: `text-light/60`.

### 2.5 Tile Group (2×2 — "Reveal Photos")

- Grid: `grid-cols-2 gap-3`.
- Tile: `aspect-square rounded-8px bg-light/10 flex flex-col items-center justify-center p-4`.
- Selected: `bg-[#7c86e1]/15 border border-[#7c86e1]`, label color `ink`, caption color `[#7c86e1]`.
- Hover on tile: `bg-light/15` (+5%).

### 2.6 Step-Slider ("Guests")

Most distinctive POV pattern. A horizontal track of N segments where selecting a tier fills segments 1→k with accent color.

- Track: `flex gap-1`, each segment `flex-1 h-8 rounded-[4px] bg-light/10`.
- Filled segment: `bg-[#7c86e1]`.
- Tick labels below: `text-xs text-light/60`. Selected tick: `text-light font-bold`.
- Price ticker above slider: `text-5xl font-bold`, animates color from `ink → accent` when tier upgrades past free.

### 2.7 Toggle (Switch)

- Track: `w-11 h-6 rounded-full`.
- OFF: `bg-light/20`. ON: `bg-[#7c86e1]`.
- Thumb: `w-5 h-5 bg-white rounded-full`, translates `0 → 20px`, `transition-transform 200ms`.

### 2.8 Checkbox (Privacy step)

Not a square — a **circular** checkmark inside a row.
- Idle: `w-6 h-6 rounded-full border border-light/30`.
- Checked: `bg-[#7c86e1] border-transparent` with inline SVG check.
- Entire row is the hit target (`cursor-pointer`).

### 2.9 Calendar / Date Picker

- Custom-built on `@vuepic/vue-datepicker`, heavily restyled.
- Day chip: `rounded-[calc(6px+0.2vh)]`, square-ish, size scales with viewport.
- Today: `ring-1 ring-light/40`.
- Selected: `bg-[#7c86e1] text-white`.
- Range start/end (not used in POV but styled for): `bg-[#7c86e1]/15`.
- Weekday headers: `text-xs text-light/40 uppercase tracking-[0.1em]`.

### 2.10 Phone Mockup Preview (Steps 3 & 6)

- Hardware frame: SVG or PNG of iPhone bezel with notch.
- Live content area: ~280×580px at `rounded-[40px]`.
- Inside: renders the actual event cover / gallery as it would appear — updates as user types the event name in step 1.
- Shadow: none, sits on same dark ground.

### 2.11 Progress Bar (Top of wizard)

- Position: fixed-top, below any system status bar.
- Segmented: `N` cells for `N` steps, separated by `2px` gaps.
- Completed cell: `bg-[#7c86e1]`. Active cell: `bg-[#7c86e1]` animating via `slide-progress` keyframe. Future cell: `bg-light/10`.
- Height: `3px`. No labels.

---

## 3. UX Journey Walkthrough — 8 Steps

POV's wizard is the gold standard for "one question per screen." Each step is framed as a **conversational question**, with an outcome-oriented subtitle.

| Step | Question (H1) | Subtitle | Input type | CTA state logic |
|---|---|---|---|---|
| 1 | "What are you looking to capture?" | "Give your event a name your guests will recognize." | Single text input | `Next` disabled until ≥1 char |
| 2 | "When does it end?" | "Photo uploads close at this time." | Calendar + time chip | Date required |
| 3 | "Pick a cover" | "This is the first thing guests will see." | Phone mockup + 3 glass tiles (Replace / Resize / Edit) | Cover required |
| 4 | "Photos per person?" | "How many each guest can submit." | Segmented 5/10/15/25 + toggle "Allow 15 camera roll uploads" | Always valid (default 10) |
| 5 | "When do photos reveal?" | "Control the mystery." | 2×2 tile grid: During / After / 12hrs after / 24hrs after | Always valid |
| 6 | "Who can see them?" | "Keep it private or go public." | Row checkboxes w/ live phone preview | Always valid |
| 7 | "How many guests?" | "Pick your tier." | Horizontal step-slider with price ticker | Always valid |
| 8 | "Checkout" | — | Stripe (Apple Pay top, card form below), currency pill (₪/$) | — |

### Copy patterns to borrow for Hebrew

| POV pattern | Memoria RTL equivalent |
|---|---|
| Question as headline, verb-led | "מה האירוע שאתם חוגגים?" ✓ already does this |
| Subtitle as outcome, not instruction | "כך האורחים ימצאו את האלבום" (outcome) not "הזן שם אירוע" (instruction) |
| Never "Step 3 of 8" in text — only in progress bar | Progress bar only, no "שלב 3 מתוך 8" copy |
| CTA verb matches step outcome | "הבא" → "שמור תאריך" → "העלה כיסוי" → "צור אירוע" |

### Native-app-feel primitives POV uses

1. `h-dvh` root locks viewport even when iOS Safari toolbars hide/show.
2. Bottom sticky CTA with `padding-bottom: env(safe-area-inset-bottom)`.
3. Back button is **always** in top-left (top-right in RTL) as glass square. Never uses browser back.
4. Transitions between steps are pure opacity fades — no slide animations — so it reads instant.
5. Upgrade/paywall is a bottom-sheet, not a new page.

---

## 4. RTL Transformation Logic

POV is LTR-only. MemoriaShare is RTL-first with Hebrew. A direct visual port needs rules for what flips, what doesn't, and how typography changes.

### 4.1 What mirrors

| Element | Mirror? | Reason |
|---|---|---|
| Layout flex order | ✅ Yes | `dir="rtl"` on `<html>` handles automatically for `flex` / `grid` |
| Back button position | ✅ Yes — move from top-left to top-right | Thumb reach for RTL users |
| Progress bar fill direction | ✅ Yes — fill from right → left | Matches reading order |
| Step-slider fill direction | ✅ Yes — fill from right → left | Matches reading order |
| Chevron icons (`<`, `>`) | ✅ Yes — use `rotate-180` or swap for mirrored glyph | Affordance must match travel direction |
| Calendar weekday order | ✅ Yes — ש…א (Sat first) or א…ש (Sun first, Hebrew default) | Hebrew calendar convention |
| Text alignment | ✅ Yes — automatic via `dir` | — |

### 4.2 What does NOT mirror

| Element | Mirror? | Reason |
|---|---|---|
| Phone mockup itself | ❌ No | It's a photo of a device; the device is universal |
| Camera shutter icon | ❌ No | Symmetric glyph |
| Checkmark `✓` | ❌ No | Universal |
| Numbers / prices (`₪`, `$`) | ❌ No — keep LTR inline with `<bdi>` | Hebrew embedded numbers stay LTR per Unicode BiDi |
| Brand logo / "M" monogram | ❌ No | Fixed visual mark |
| Play/pause, media controls | ❌ No | Universal media convention |

### 4.3 Hebrew type system

Replace POV's Satoshi scale with Heebo (already in `tailwind.config.js`). Weight mapping:

| POV Satoshi weight | Heebo equivalent | Use |
|---|---|---|
| 300 | Heebo 300 | Subtitle, caption |
| 400 | Heebo 400 | Body |
| 500 | Heebo 500 | Section headings |
| 700 | Heebo 700 | Button, price, H1 |

**Hebrew tracking adjustment:** POV's `tracking-[-0.4px]` makes Satoshi English feel tight and modern. Hebrew with the same tracking feels cramped. Recommendation:
- Buttons/H1: `tracking-normal` or `tracking-[-0.2px]`.
- Labels/caps (Montserrat English fallback): keep `tracking-editorial` (0.15em) — that's your brand.

**Serif display (Playfair) use**: POV uses no serif. Our brand explicitly leans serif for "editorial luxury." Rule: use Playfair only for the event-name in previews (`PhoneMockup.jsx` overlay) and landing-page hero. Use Heebo everywhere in the wizard itself. Serif-inside-wizard would undermine the native-app feel.

### 4.4 Numerals

All numeric UI (prices, guest counts, times) stays Western Arabic: `₪360`, `100 אורחים`, `23:59`. Do not use Hebrew `גימטריה`. Wrap numeric tokens inside Hebrew strings in `<bdi>` or ensure the surrounding container has `unicode-bidi: plaintext` to prevent BiDi reordering bugs with currency symbols.

### 4.5 Calendar mirroring

- Weekday row: `['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']` (Sun → Sat, the Hebrew convention).
- Day grid starts on Sunday (`weekStart: 0`).
- Selected day chip: same accent fill (POV's `#7c86e1` → our `gold-500 #c9a96e`).
- First day of week variable should be in locale config, not hard-coded, so the same component works for Shabbat-starting calendars if needed.

### 4.6 Icon flipping rules

Use a `rtl:rotate-180` utility only on travel-direction glyphs:
- `ArrowRight` / `ChevronRight` → `rtl:-scale-x-100` (mirrors rather than rotates, preserves shadows).
- `ArrowLeft` / `ChevronLeft` → same.
- Icons with internal asymmetry (e.g., a numbered-list icon) → `rtl:-scale-x-100` + caveat: test each.

---

## 5. Comparative Summary — MemoriaShare vs POV

### 5.1 What MemoriaShare already has right

| Dimension | MemoriaShare status |
|---|---|
| Viewport lock (`h-dvh` / `min-h-screen`) | ✓ Uses `100dvh` in CreateEvent |
| RTL root | ✓ `html { direction: rtl }` in `index.css` |
| Hebrew copy in wizard | ✓ "מה האירוע שאתם חוגגים?" — correct conversational tone |
| Live phone-mockup preview | ✓ `PhoneMockup.jsx` exists and updates on type |
| Pricing tier structure | ✓ 10/100/250/400/600/800/801+ matches POV's ladder |
| Glass-card utility | ✓ `.glass-card` defined in `index.css` (backdrop-blur-xl + white/3% + white/7% border) |
| Shimmer skeleton | ✓ `.skeleton-shimmer` + keyframe defined |
| Animation vocabulary | ✓ `fade-in`, `slide-up`, `scale-in` defined with proper `cubic-bezier(0.16,1,0.3,1)` |
| Dark mode as default visual identity | ✓ `.dark` CSS vars are the primary palette |
| Warm neutral scale | ✓ `warm-50`→`warm-950` defined, avoids cold Tailwind grays |
| Brand accent token | ✓ `gold-500 #c9a96e` defined, `--primary` mapped to it |

### 5.2 Where MemoriaShare diverges (in code, not in spec)

**Critical finding:** `src/pages/CreateEvent.jsx` and `src/pages/Home.jsx` bypass the design system entirely with hard-coded hex values.

| File | Hard-coded value | Should be |
|---|---|---|
| `CreateEvent.jsx` root | `bg-[#0a0a0a]` | `bg-background` (resolves to warm `#0c0a08` in dark mode) |
| `CreateEvent.jsx` progress fill | `bg-indigo-600` | `bg-primary` (→ `gold-500`) |
| `CreateEvent.jsx` input bg | `bg-[#161616]` | `bg-secondary` or `bg-warm-900/60` |
| `CreateEvent.jsx` border | `border-gray-800` | `border-border` (→ warm `#2a2724`) |
| `CreateEvent.jsx` text color | `text-white` | `text-foreground` (→ `#f7f0e4`, warmer) |
| `Home.jsx` hero gradient | `from-[#0F0F0F] via-[#1a1a1a] to-[#0F0F0F]` | `from-warm-950 via-warm-900 to-warm-950` |
| `CreateEvent.jsx` tier selected | `text-indigo-400 border-indigo-500/50` | `text-gold-300 border-gold-500/50` |

**Consequence:** Despite having a warm-gold editorial identity defined, the highest-traffic screens render as cold indigo-tech — indistinguishable from POV's periwinkle. Users never see the MemoriaShare brand you've defined.

### 5.3 Missing components (to lift from POV's pattern book)

1. **Segmented control** — POV uses it for "Photos per person". MemoriaShare has no equivalent primitive; CreateEvent uses button grids.
2. **Step-slider with live price ticker** — POV's most distinctive component. MemoriaShare already has tier buttons, but the slider metaphor with price that grows as you drag is the emotional hook of their checkout flow.
3. **Glass back button square** — POV pairs back (glass) + next (solid accent) horizontally. MemoriaShare CreateEvent currently uses Hebrew text buttons only.
4. **Circular checkbox with accent fill** — POV's privacy step uses this. Our shadcn Checkbox defaults to a square.
5. **Sticky bottom CTA dock with `env(safe-area-inset-bottom)`** — already enforced by our `CameraCapture` rules, but not used in CreateEvent.

### 5.4 Where MemoriaShare should NOT copy POV

1. **Monochrome neutral + single accent** — POV's dogma is one accent (`#7c86e1`). MemoriaShare's brand is explicitly **warm editorial**: gold + Playfair serif + Cormorant Garamond in some display contexts. Copying POV's strict mono+accent would erase the editorial identity. Keep serif on event names, cover titles, landing hero — stay Heebo-only inside the wizard.
2. **Satoshi / cool off-white ink** — Stay with Heebo and `#f7f0e4` (warm white). The warmth is the differentiator.
3. **Gallery-first dark ground** — POV shows user photos against `#1e1e1e` (slightly cool). Our `#0c0a08` (warm near-black) is distinct and correct.
4. **Premium yellow `#ffd808`** — we don't need a second accent. Gold *is* the premium.

---

## 6. Sprint Plan — Proposed Patches

> All items respect the Read-Before-Write protocol. No code is being modified in this report — these are scoped proposals for the next implementation session.

### Sprint 1 — Token Hygiene (½ day, zero visual risk when done correctly)

Goal: purge hard-coded hex from high-traffic pages. Replace with existing tokens.

1. `src/pages/CreateEvent.jsx`
   - Swap `bg-[#0a0a0a]` → `bg-background`.
   - Swap `bg-[#161616]` → `bg-secondary` (or `bg-warm-900`).
   - Swap `border-gray-800` → `border-border`.
   - Swap all `indigo-*` → `gold-*` or `primary`.
   - Swap `text-white` on body surfaces → `text-foreground`.
2. `src/pages/Home.jsx`
   - Swap hero gradient hexes → `from-warm-950 via-warm-900 to-warm-950`.
   - Remove `text-white`, rely on inherited `text-foreground` from `<body>`.
3. `src/components/home/*.jsx` — same sweep.

**Acceptance:** visual diff in dark mode only. Grep `src/pages src/components` for `bg-\[#` and `indigo-` should return zero matches after.

### Sprint 2 — Extract Primitives (1 day)

New files, all token-based:

1. `src/components/ui/SegmentedControl.jsx` — track + options, selected via outline-accent pattern.
2. `src/components/ui/StepSlider.jsx` — horizontal segments, price ticker slot.
3. `src/components/ui/GlassBackButton.jsx` — 44×44 glass square, `rtl`-aware chevron.
4. `src/components/ui/TileGroup.jsx` — 2×N grid with accent-on-select.
5. `src/components/ui/StickyCTA.jsx` — bottom dock with `safe-area-inset-bottom`, primary + optional back.

Each ≤100 lines. All consume `primary` (gold), no hex.

### Sprint 3 — Rewire CreateEvent wizard to primitives (1 day)

1. Replace inline progress bar with extracted progress primitive.
2. Replace tier buttons with `<StepSlider tiers={...} />`.
3. Replace `Next`/`Back` row with `<StickyCTA back={...} next={...} />`.
4. Verify `dir="rtl"` mirroring at every breakpoint 375→768→1024.

### Sprint 4 — Hebrew copy audit (½ day)

1. Convert all step subtitles from instruction ("הזן שם") to outcome ("כך האורחים ימצאו את האלבום").
2. Verify CTA verbs match step outcome, not generic "הבא".
3. Remove any `"שלב X מתוך Y"` text copy; rely on progress bar only.

### Sprint 5 — Calendar + live preview polish (½ day)

1. Lock weekday row to `['א','ב','ג','ד','ה','ו','ש']`.
2. Ensure selected-day chip uses `bg-gold-500 text-warm-950`.
3. Wire `PhoneMockup` to reflect date selection in step 2 (currently only reflects name).

---

## 7. Quick Reference — Token Equivalence Table

When translating POV patterns to MemoriaShare, use this map.

| POV concept | POV value | MemoriaShare token |
|---|---|---|
| Ground | `#1e1e1e` | `hsl(var(--background))` → `#0c0a08` |
| Ink | `#fcfcfe` | `hsl(var(--foreground))` → `#f7f0e4` |
| Accent | `#7c86e1` | `hsl(var(--primary))` → `gold-500 #c9a96e` |
| Glass bg | `bg-light/10` | `bg-foreground/10` OR `.glass-card` utility |
| Glass border | `border-light/15` | `border-foreground/15` |
| Surface L1 | `#25282c` | `bg-secondary` → `#1d1b19` |
| Divider | `#5b5b61` | `border-border` → `#2a2724` |
| Secondary text | `text-light/60` | `text-muted-foreground` |
| Disabled | `bg-light/5 text-light/30` | `bg-muted text-muted-foreground/50` |
| Scrim | `bg-[#121212b2]` | `bg-background/85` + `backdrop-blur-md` |
| Corner | `rounded-8px` | `rounded` (default) or `rounded-md` (6px) |
| Motion curve | `cubic-bezier(0.4,0,0.2,1)` 300ms | `duration-300 ease-out` or our `slide-up` curve |

---

## 8. Verification Checklist (run before any code change)

- [ ] Every new color reference uses a token, not a hex literal.
- [ ] `dir="rtl"` root unchanged; no hard-coded `text-right` / `text-left` inside components.
- [ ] Back/Next order: back on top-right, next full-width below OR right of back (RTL).
- [ ] Progress bar fills right → left in RTL mode.
- [ ] Step-slider fills right → left in RTL mode.
- [ ] All icons that indicate travel direction have `rtl:-scale-x-100`.
- [ ] Numerals are Western Arabic, inside `<bdi>` when embedded in Hebrew strings.
- [ ] CTA copy is a verb-of-outcome, not "הבא" everywhere.
- [ ] Every sticky-bottom element uses `paddingBottom: env(safe-area-inset-bottom)`.
- [ ] Wizard root is `h-dvh` (already correct in CreateEvent).
- [ ] No page hard-codes `bg-[#...]` or references `indigo-*`, `gray-*`, `zinc-*`, `slate-*`, `neutral-*`.
- [ ] Light mode (`:root`) and dark mode (`.dark`) both render the wizard correctly.

---

## 9. References (source artifacts)

- POV compiled stylesheet: `https://app.pov.camera/assets/index-2f251ba0.css`
- POV DOM sample: live introspection on `https://app.pov.camera/d/events`, `/d/settings`, `/d/events/create` (steps 1–8)
- Screenshots: `C:\Users\tagab\MemoriaShare\public\POV\*` (11 files, 2026-04-16)
- MemoriaShare source files cross-referenced: `tailwind.config.js`, `src/index.css`, `src/pages/Home.jsx`, `src/pages/CreateEvent.jsx`

---

*End of audit. Ready for sprint-planning handoff. No production code has been modified; all recommendations above are proposals awaiting approval.*
