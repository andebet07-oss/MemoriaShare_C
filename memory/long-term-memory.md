---
type: long-term-memory
updated: 2026-04-16T22:00Z
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

## Design Language (Memoria Brand)
- **Background:** `#0a0a0e`
- **Primary violet:** `#7c3aed` / `#6d28d9`
- **Lime accent:** `#caff4a` / `#a3e635`
- **Card bg:** `rgba(255,255,255,0.03)`, border: `rgba(255,255,255,0.07)`
- **Muted text:** `rgba(255,255,255,0.4)`
- **Typography (Hebrew):** Heebo, Assistant
- **Typography (UI):** -apple-system, BlinkMacSystemFont, Segoe UI
- **Canvas frames:** Playfair Display (headers), Bodoni Moda, Cinzel, etc.
- **Aesthetic:** Dark luxury, glass morphism, native iOS feel
- **Tabs:** Text-only (no icons) — underline style, violet 2px border-bottom ← **chosen explicitly**
- **Icon containers:** 32px `rounded-xl`, translucent color bg, 16px Lucide icon inside ← **preferred over large decorative icons**

## UI Anti-patterns (Explicitly Rejected)
- 3D WebP icons with white backgrounds on dark UI — looks terrible ✗
- Generic emoji-only sticker packs (💍🥂💐) — too amateurish ✗
- Tab nav with icons — user chose text-only variant ✗
- Large decorative icons instead of small contained ones ✗

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
- **FramePicker UX:** 52×68 thumbs, RTL horizontal scroll, gold border on selected
- **Accent color for frame UI:** gold `rgba(201,169,110, *)` (= `#c9a96e`) — reserved for premium magnet context; violet remains primary platform accent
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
