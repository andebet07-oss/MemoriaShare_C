---
name: memoria-design-system
description: Memoria brand design system — dark luxury editorial tokens, fonts, component patterns, and anti-patterns. Read this before writing ANY UI for MemoriaShare or MemoriaMagnet.
type: reference
---

# Memoria Design System

> Read this file before building any component, page, or UI element.  
> Brand: dark luxury editorial — Leica meets Vogue, warm black + champagne gold.

---

## Brand DNA

| Property     | Value                                                             |
|--------------|-------------------------------------------------------------------|
| Aesthetic    | Dark luxury editorial — photography studio, film noir             |
| Logo style   | Serif "M" monogram, small-caps wordmark, radial vignette bg       |
| Feeling      | Premium, intimate, timeless — NOT colorful, NOT playful           |
| Reference    | Leica, Vogue, Annie Leibovitz, Apple + haute couture              |
| Anti-pattern | Bootstrap defaults, blue-600 CTAs, rounded-2xl cards, emoji-heavy |

---

## Font Stack

```jsx
// ALWAYS import from @/lib/fonts or rely on global index.css — never inline Google Fonts

font-playfair    // "Playfair Display" serif — headings, hero, monogram, pull quotes
font-montserrat  // Montserrat sans — labels, uppercase UI, button text, captions
font-heebo       // Heebo — body text, ALL Hebrew UI text, RTL content
```

### Rules
- `h1`, `h2`, `h3` → `font-playfair` by default (set in index.css)
- Hebrew UI labels → always `font-heebo`, never `font-playfair` for Hebrew
- Button labels, section headers, metadata → `font-montserrat tracking-editorial uppercase text-xs`
- Body copy, descriptions → `font-heebo` (already the body default)

### Letter-spacing tokens
```
tracking-editorial   →  0.15em   (button text, labels, caps)
tracking-display     →  0.06em   (large headings)
```

---

## Color Tokens

### Semantic (CSS variables — use in components)

| Token                    | Dark value        | Usage                           |
|--------------------------|-------------------|---------------------------------|
| `bg-background`          | #0a0908 warm black | Page / screen background        |
| `bg-card`                | #131110            | Card, panel surfaces            |
| `bg-secondary`           | #1d1b19            | Raised surface, hover bg        |
| `bg-muted`               | ~#221f1d           | Subtle de-emphasis              |
| `bg-accent`              | dark gold tint     | Hover state background on gold elements |
| `text-foreground`        | #f7f0e4 warm white | Primary body text               |
| `text-muted-foreground`  | warm mid-gray      | Secondary / caption text        |
| `text-primary`           | #c9a96e gold       | Gold text (rare — prefer buttons)|
| `bg-primary`             | #c9a96e gold       | CTA buttons, focus rings        |
| `border-border`          | #2a2724            | All dividers, card edges        |

### Brand palette (direct utility classes)

```
gold-500    →  #c9a96e   ← primary brand color
gold-300    →  #e6be62   ← gold highlight / hover
gold-700    →  #8a6932   ← gold shadow / pressed

warm-950    →  #0a0908   ← deepest background
warm-900    →  #141210   ← card bg alternative
warm-800    →  #201e1c   ← border / skeleton
warm-300    →  #bfb5a5   ← secondary text
warm-100    →  #ede8df   ← light mode body text
```

### NEVER use these in Memoria
```
❌ blue-500 / blue-600    — generic, off-brand
❌ gray-* (cold grays)    — use warm-* instead
❌ zinc-*, slate-*        — same issue
❌ rounded-2xl, rounded-3xl — too soft for the editorial aesthetic
❌ white (#ffffff pure)   — use warm-50 / text-foreground instead
```

---

## Component Patterns

### CTA Button — Primary
```jsx
// Use the utility class:
<button className="btn-gold">שלח לדפוס</button>

// Or manual:
<button className="
  font-montserrat text-xs font-semibold tracking-editorial uppercase
  bg-primary text-primary-foreground px-6 py-3 rounded
  hover:brightness-110 active:scale-[0.98] transition-all duration-200
  shadow-gold-soft hover:shadow-gold-glow
">
  שלח לדפוס
</button>
```

### CTA Button — Ghost/Secondary
```jsx
<button className="btn-ghost">ביטול</button>
```

### Card / Panel
```jsx
// Dark luxury card — NOT white bg, NOT rounded-xl
<div className="bg-card border border-border rounded p-4 shadow-card-dark">

// Glass morphism (camera overlays, floating panels):
<div className="glass-card rounded p-4">
```

### Section / Page Header
```jsx
// Editorial style — sparse, high contrast
<div className="flex flex-col gap-1 mb-8">
  <span className="label-editorial">אירועים פעילים</span>
  <h1 className="font-playfair text-2xl md:text-3xl text-foreground">
    לוח ניהול
  </h1>
</div>
```

### Photo thumbnail
```jsx
// Always position relative with vignette overlay
<div className="relative aspect-square overflow-hidden rounded bg-warm-900">
  <img src={url} className="absolute inset-0 w-full h-full object-cover" />
  <div className="absolute inset-0 vignette pointer-events-none" />
</div>
```

### Loading skeleton
```jsx
<div className="skeleton-shimmer h-32 w-full rounded" />
```

### Empty state
```jsx
// Centered, editorial, minimal
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <div className="text-warm-700 mb-1">
    <ImageIcon size={32} strokeWidth={1} />
  </div>
  <p className="font-playfair text-lg text-foreground/60">אין תמונות עדיין</p>
  <p className="label-editorial text-muted-foreground">היה הראשון לשתף</p>
</div>
```

---

## Icons

**Library: Lucide React** (`lucide-react@^0.475.0`)

```jsx
import { Camera, Share2, Download, Printer, QrCode } from 'lucide-react'

// Size guidelines:
// Inline in text:   size={14} strokeWidth={1.5}
// UI actions:       size={18} strokeWidth={1.5}
// Feature icons:    size={24} strokeWidth={1}
// Hero/empty state: size={32} strokeWidth={1}
```

Rules:
- Always use `strokeWidth={1}` or `strokeWidth={1.5}` — default 2 is too heavy for luxury aesthetic
- Never use filled/solid icon variants — keep outline
- Icon color: `text-muted-foreground` for secondary, `text-foreground` for primary, `text-primary` (gold) for CTAs

---

## Spacing & Layout

- Minimum screen width: **375px** — mobile first always
- Base padding: `px-4` mobile → `px-6 md:px-8` desktop
- Card padding: `p-4` mobile → `p-5 md:p-6` desktop
- Section gap: `gap-6` or `space-y-6`
- Border radius: `rounded` (0.25rem) — sharp/editorial. Avoid `rounded-xl`, `rounded-2xl`

---

## Animation Usage

```jsx
// Page entry (gallery, cards appearing)
className="animate-slide-up"

// Overlay / modal
className="animate-scale-in"

// Quick fade (tooltips, badges)
className="animate-fade-in-fast"

// Photo reveal
className="animate-fade-in"
```

All transitions: `transition-all duration-200 ease-out` or `duration-300` for longer

---

## Dark vs Light Mode

The app uses `class="dark"` toggled by AuthContext/layout.

- **Dark** (default for guests/galleries/camera): full brand experience
- **Light** (optional for admin/dashboard): warm cream paper, not white

When in doubt, build dark first — it's the Memoria brand.

---

## RTL / Hebrew Rules

- `direction: rtl` is set globally on `html` in index.css
- Hebrew text: always `font-heebo`
- English text within Hebrew UI (event codes, timestamps): wrap in `<span dir="ltr">`
- Icon + text layout in RTL: icons go on the RIGHT side of text (`flex-row-reverse` if needed, or use `gap-2` — Tailwind flex handles RTL automatically)
- `mr-*` and `ml-*` are LTR-aware — prefer `ms-*` (margin-start) and `me-*` (margin-end) for RTL-safe spacing

---

## Anti-patterns to avoid

```jsx
❌ style={{ color: '#c9a96e' }}           // Use text-primary or text-gold-500
❌ className="bg-blue-600 text-white"     // Off-brand
❌ className="rounded-2xl shadow-lg"      // Too soft, generic SaaS look
❌ <p style={{ fontFamily: 'Arial' }}>    // Always use font-heebo/playfair/montserrat
❌ import { Search } from 'react-icons'   // Only lucide-react
❌ "לחץ כאן" as button text              // Write actual action: "שלח לדפוס", "הורד", "שתף"
```
