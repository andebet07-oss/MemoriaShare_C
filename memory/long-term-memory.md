---
type: long-term-memory
updated: 2026-04-17T00:00Z
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

## Preferred Sticker Aesthetic
- Physical sticker shop feel: badges (pill), stamps (rectangular label), attitude text
- "LEGEND", "ICONIC", "MAIN CHARACTER", "JUST MARRIED ✨" > "💍💕✨🎊"
- `badge` type: `#caff4a` (lime) or `#111` (dark) with `dark: true/false` flag
- `stamp` type: white bg + `#111` border, uppercase

## Tech Stack Rules (Non-Negotiable)
- React 18 hooks only (no class components, no HOCs except 3rd-party wraps)
- Tailwind utility-only (no custom .css, no inline style={{}} for Tailwind-expressible values)
- Supabase JS v2: always from `@/lib/supabase`, single client instance
- Auth: always `useAuth()` from `@/lib/AuthContext`, never `supabase.auth.getUser()`
- Data: always via `memoriaService`, never `supabase.from()` in components
- Realtime: every `channel()` needs cleanup in `useEffect` return
- Mobile-first: base styles at 375px, scale up with `md:` breakpoints
- Banned: axios, moment.js, localStorage for auth, `console.log` in committed code
- `staleTime: 30_000` on all admin React Query hooks

## Component Structure Rules
- Max 200 lines per file — extract logic → `src/hooks/`, UI → `src/components/{feature}/`
- Error handling: `try/catch` with user-facing Hebrew error message + `setError()`
- Loading states: mandatory for all async > 200ms

## Common Pitfalls (Historical)
- **Canvas font rendering:** Use `document.fonts.ready()` before `drawOnCanvas()`
- **Camera full-screen:** Never `flex flex-col` on root. `fixed inset-0`, all layers `absolute`, `<video> absolute inset-0 w-full h-full object-cover`
- **Memory leaks:** Every `supabase.channel()` needs cleanup
- **Canvas stickers:** Wrap each `drawSticker` call in `ctx.save()` / `ctx.restore()`
- **MCP on Windows:** All `npx`-based MCP servers need `cmd /c` wrapper in config
- **Supabase auth mutex:** Never call `supabase.auth.getUser/getSession` inside upload flow

## Architecture Routing (Current)
- `/admin/*` namespace, `RequireAdmin` route wrapper
- `AdminShell.jsx` with `<Outlet />` for tabbed admin
- Single routing source: `App.jsx` (`pages.config.js` vestigial)
- Redirects for legacy URLs (keep until next release)

## Magnet Frame System (Canonical)
- **Design surface:** label strip BELOW photo — NOT an overlay on the photo
- **Photo stays clean:** at most a subtle vignette or hairline border. Never block faces.
- `LABEL_H_RATIO = 0.225` — label height = 22.5% of canvas width (e.g., 243px for 1080px)
- **Drawing signature:** `drawFrame(ctx, w, totalH, photoH, event)` where `event = { name, date }`
- **6 packs:** wedding, bar_mitzvah, brit, birthday, corporate, general
- **Auto-routing:** `getFramePack(eventName)` matches Hebrew + English keywords
  - חתונה / wedding → WEDDING_FRAMES
  - ברית / brit / circumcision → BRIT_FRAMES
  - בר מצווה / בת מצווה → BAR_MITZVAH_FRAMES
  - יום הולדת / birthday → BIRTHDAY_FRAMES
  - חברה / corporate / עסקי → CORPORATE_FRAMES
  - (else) → GENERAL_FRAMES
- **FramePicker UX:** 52×68 thumbs, RTL horizontal scroll, violet border on selected (was gold pre-POV pivot; gold was replaced with violet on 2026-04-17)
- **Accent color for frame picker UI:** violet `#7c3aed` (MemoriaMagnet sub-brand) — matches Magnet product color; indigo remains primary shell accent
- **Gold inside canvas frames:** individual frames (e.g. "קשת אינדיגו") may still use metallic rose/gold TONES in the drawn artwork; these are illustrative frame decorations, not UI chrome. Platform UI uses indigo; Magnet sub-brand uses violet.
- **Label typography:** Montserrat uppercase with `letter-spacing: 0.12em` for chrome/labels

## Deploy & Git
- Branch: `main` for fixes, `feature/*` for features
- Commit messages: imperative present tense ("Add ZIP export", not "Added...")
- Vercel auto-deploys `main` → production (treat as live)
- Never commit: `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SITE_URL` must be set in Vercel dashboard

## File Map (Critical)
- `PRD.md` — product spec (read before new features)
- `CLEAN_RESET_SCHEMA.sql` — DB schema + RLS (read before data logic)
- `src/lib/AuthContext.jsx` — `useAuth()`
- `src/components/memoriaService.jsx` — all CRUD
- `src/hooks/useIsAdmin.js` — role check hook
- `src/components/RequireAdmin.jsx` — route guard
- `src/components/admin/AdminShell.jsx` — tabbed admin layout
- `src/components/magnet/stickerPacks.js` — sticker content + types (4 packs)
- `src/components/magnet/framePacks.js` — canvas frame system (6 packs, label-below-photo)
- `src/components/magnet/FramePicker.jsx` — RTL horizontal frame scroll strip
- `src/components/magnet/MagnetReview.jsx` — sticker + frame render + canvas composite

---

## new_learnings (Staging Area — Research Scout)
**Last refreshed:** 2026-04-16T22:00Z | Next review: 2026-04-20T06:00Z (weekly Sunday promotion)

This section collects validated findings from automated research hunts (runs 3x nightly via `research-scout` skill).

**Validation criteria:**
- Not already in long-term-memory.md
- Actionable for Memoria (React 18, Tailwind, Supabase, Canvas, WebRTC)
- From credible sources (official docs, HackerNews, Reddit, dev.to)
- New fact or pattern discovered in last week

**Weekly workflow (Sunday 6 AM):**
1. Verify each finding against latest docs
2. Promote confirmed findings to main sections (rules, pitfalls, patterns)
3. Delete contradicted findings
4. Archive unpromoted findings >7 days old
5. Clear this section for next week

---

**Current findings:**

### Finding: 2026-04-16 — Canvas 2D
- **Source:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas , https://gist.github.com/jaredwilli/5469626
- **Finding:** Passing non-integer x/y coordinates to `ctx.drawImage()` triggers sub-pixel anti-aliasing per call, measurably slowing composites. Rounding with `Math.floor()` removes the hit.
- **Relevance:** `MagnetReview.jsx` composites draggable stickers + frame to canvas on every send-to-print. User-drag positions are floats — every composite pays the AA tax.
- **Action:** Wrap x/y with `Math.floor()` on all `drawImage`/`drawSticker` calls before next perf pass. Candidate pitfall addition to §Common Pitfalls.
- **Status:** pending-review

### Finding: 2026-04-16 — WebRTC / iOS Safari
- **Source:** https://discussions.apple.com/thread/256081579 , https://www.videosdk.live/developer-hub/webrtc/webrtc-safari
- **Finding:** Safari on iOS 17+ intermittently re-prompts for camera permission on the same origin even when already granted. No dev-side fix — only mitigation is graceful re-request UX with retry button.
- **Relevance:** Memoria guest flow (MagnetGuestPage → camera) assumes single grant. On iOS re-prompts, getUserMedia can reject with `NotAllowedError` mid-session without a retry path.
- **Action:** In `MagnetCamera.jsx` getUserMedia catch block, treat `NotAllowedError` as recoverable: show Hebrew "נדרשת הרשאת מצלמה — נסה שוב" with retry button, not fatal error. Candidate pitfall addition to §3.6 Camera rules.
- **Status:** pending-review

### Finding: 2026-04-16 — Supabase JS v2
- **Source:** https://supabase.com/docs/guides/realtime/authorization
- **Finding:** Realtime Authorization (RLS-enforced channels) requires supabase-js **v2.44.0 or later**. Earlier versions silently bypass RLS on realtime subscriptions — a security hole when RLS is the stated security layer.
- **Relevance:** Per existing rule "RLS is security": if `package.json` pins `@supabase/supabase-js` below 2.44.0, realtime photo/print subscriptions may leak cross-event data.
- **Action:** Verify `@supabase/supabase-js` version in `package.json`; bump to ≥ 2.44.0 if below. Add version floor to CLAUDE.md Tech Stack Rules.
- **Status:** pending-review

### Finding: 2026-04-16 — Tailwind CSS v4
- **Source:** https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/ , https://tailwindcss.com/docs/responsive-design
- **Finding:** Tailwind v4 ships container queries as first-class: `@container` utility on parent + `@md:`, `@lg:` child prefixes. Container breakpoints are **smaller** than viewport (@md = 448px vs md = 768px) — do NOT substitute 1:1.
- **Relevance:** Memoria sticker tray, print-queue cards, and gallery tiles render at multiple container widths (dashboard vs modal vs guest landing). Viewport breakpoints misfire in narrow modals.
- **Action:** When next extracting a reused card, reach for `@container` + `@md:` over `md:`. Document breakpoint difference in CLAUDE.md §3.1 to prevent 1:1 substitution bugs.
- **Status:** pending-review
