---
type: long-term-memory
updated: 2026-04-17T13:30Z
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

### Sub-brand — MemoriaMagnet (Admin / Print Service)
- **Violet `#7c3aed` / `#a78bfa` is preserved** as the MemoriaMagnet sub-brand accent
- Use ONLY inside Magnet-specific UI: `AdminShell` tabs, `CreateMagnetEvent` wizard, `MagnetReview`, `PrintStation`, Magnet KPI cards
- Everywhere else — indigo is the primary accent
- This preserves the dual-product visual separation required by the `event_type === 'share' | 'magnet'` architecture

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

## Tech Stack Rules (Non-Negotiable)
- React 18 hooks only (no class components, no HOCs except 3rd-party wraps)
- Tailwind utility-only (no custom .css, no in
---

## New Learnings (research-scout nightly — pending review)

### Finding: 2026-04-17 — Canvas
- **Source:** https://html.spec.whatwg.org/multipage/canvas.html + MDN Optimizing canvas
- **Finding:** `willReadFrequently: true` must be passed on the **first** `getContext('2d', {...})` call on a canvas element; setting it on later calls is silently ignored because the rendering backend is already fixed.
- **Relevance:** CameraCapture.jsx captures frames to a canvas and may read pixels for captioning/EXIF stripping. If we ever add per-capture pixel processing (badges, stamps, watermark compositing), the first `getContext` call must opt in — otherwise perf degrades without warning.
- **Action:** Code review — audit any `canvas.getContext('2d')` call path in CameraCapture and caption/sticker compositor; add `{ willReadFrequently: true }` on the first call whenever `getImageData`/`putImageData` is used downstream.
- **Status:** pending-review

### Finding: 2026-04-17 — Supabase
- **Source:** https://supabase.com/docs/guides/realtime/authorization
- **Finding:** Realtime **Broadcast/Presence Authorization** on private channels requires `@supabase/supabase-js ≥ v2.44.0`. Private channels grant fine-grained control over which clients can join and what actions they can broadcast/presence within the channel, enforced by RLS policies on `realtime.messages`.
- **Relevance:** Memoria is on v2.101.1 — the capability is unlocked. Today Memoria's `useRealtimeNotifications` / `useEventGallery` subscriptions are public channels filtered by `event_id`. For share events where we want only authenticated host + approved guests to see realtime photo events, private channels + RLS messages policy would be a stronger security posture than the current "public channel, client filter" model.
- **Action:** Architecture — evaluate moving per-event photo channels from public to private `realtime.channel()` with RLS messages policy; document as a hardening follow-up in project-memory.
- **Status:** pending-review

### Finding: 2026-04-17 — WebRTC (iOS Safari)
- **Source:** https://discussions.apple.com/thread/256081579 + https://blog.addpipe.com/getusermedia-getting-started/
- **Finding:** Safari on iOS intermittently **re-prompts for camera/mic permission on the same origin** even when the user has previously granted access and neither the domain nor app version changed. The `Permissions` API is not supported in Safari, so there is no reliable way to pre-check permission state.
- **Relevance:** CameraCapture.jsx is mobile-first and iOS Safari is the primary target. Today, a re-prompt mid-event will surface as a generic getUserMedia failure and may be mis-classified as a hardware error in our error state. We should assume re-prompts are normal, not exceptional.
- **Action:** UX — in CameraCapture's error handler, detect `NotAllowedError` on iOS and render a Hebrew re-consent message ("Safari ביקש לאשר שוב גישה למצלמה — גע בסמל ההרשאות בשורת הכתובת") with a retry button, instead of a terminal error state. Do NOT use the Permissions API as a guard.
- **Status:** pending-review

### Finding: 2026-04-17 — Tailwind (v4 migration note)
- **Source:** https://tailwindcss.com/blog/tailwindcss-v4 + tailwindcss v4.2 release notes
- **Finding:** Tailwind v4 ships `scheme-dark` / `scheme-light` / `color-scheme` utilities that map to CSS `color-scheme`. Adding `scheme-dark` to `<body>` forces native UI chrome (scrollbars, form inputs, system dialogs, date pickers) into dark mode, eliminating the "silvery light scrollbar on a dark page" bug.
- **Relevance:** Memoria is on `tailwindcss ^3.4.17` — **not** directly actionable today. But Memoria's brand is hard-locked on dark (indigo/cool-neutral, `dark` class rule). The light-scrollbar bug on iOS Safari and Android Chrome is a known visual paper-cut of our current stack. When we eventually migrate to v4, adding `scheme-dark` to Layout's `<body>` is a one-line fix that removes the need for any custom CSS scrollbar shim.
- **Action:** Flag for weekly review — add to "Tailwind v4 migration checklist" when that migration is scoped. Until then, no change.
- **Status:** flagged-for-weekly-review
