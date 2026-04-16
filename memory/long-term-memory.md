---
type: long-term-memory
updated: 2026-04-16T20:00Z
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
- `src/components/magnet/stickerPacks.js` — sticker content + types
- `src/components/magnet/MagnetReview.jsx` — sticker render + canvas composite

---

## new_learnings (Staging Area — Research Scout)
**Last refreshed:** 2026-04-16T12:00Z | Next review: 2026-04-20T06:00Z (weekly Sunday promotion)

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
(None yet — research scout activated 2026-04-16T12:00Z)
