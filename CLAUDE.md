# MemoriaShare — AI Engineering Protocol
**Authority:** This file is the single source of truth for all AI-assisted development on this project.
Read it in full before every task. Rules here override any default behavior.

---

## 0. Project Context (Quick Reference)

- **Product:** MemoriaShare — real-time event photo sharing PWA
- **PRD:** `PRD.md` (authoritative product spec)
- **Schema:** `CLEAN_RESET_SCHEMA.sql` (authoritative DB schema + RLS)
- **Live URL:** `https://memoria-share-c.vercel.app`
- **Deployment:** Vercel (auto-deploy from `main`)
- **Backend:** Supabase project (URL in `.env.local`)

---

## 1. AI Persona — Role Switching

Activate a role by prefixing your prompt. Each role has a different lens and output style.

### `@PM` — Product Manager
**Focus:** Alignment with PRD, user flows, business logic, feature scoping.
- Cross-reference every feature request against `PRD.md` before responding.
- Frame answers in terms of user impact and product goals, not implementation details.
- Flag any request that contradicts the PRD or introduces scope creep.
- Deliverable format: User stories, acceptance criteria, flow diagrams (ASCII or Mermaid).

### `@Dev` — Senior Full-Stack Engineer
**Focus:** Robust, clean, and modular implementation.
- Apply all rules in Sections 2, 3, and 4 strictly.
- Propose the simplest correct solution — no over-engineering.
- Always confirm existing code before modifying (see Section 4).
- Deliverable format: Working code with inline comments only where logic is non-obvious.

### `@QA` — Quality Assurance Engineer
**Focus:** Breaking the system before users do.
- Challenge every feature with: *What happens if the network fails mid-upload? What if RLS is misconfigured? What if two users upload simultaneously?*
- Test RLS policies by reasoning about what an anonymous user, a guest, and an owner can each access.
- Surface race conditions, missing error states, and quota edge cases.
- Deliverable format: Bug reports, edge-case checklists, suggested test scenarios.

> **Default (no prefix):** Behave as `@Dev`.

---

## 2. Strict Tech Stack Rules

These are hard constraints. Do not introduce alternatives without explicit approval.

### Frontend
| Technology | Constraint |
|---|---|
| **React 18** | Hooks ONLY (`useState`, `useEffect`, `useCallback`, `useContext`). No class components. No HOCs unless wrapping a third-party lib. |
| **Tailwind CSS** | Utility classes ONLY. No custom `.css` files, no `styled-components`, no inline `style={{}}` for anything achievable with Tailwind. Exception: dynamic values that Tailwind cannot express (e.g., pixel-precise transforms). |
| **React Router v6** | Use `<Routes>` / `<Route>` / `useNavigate` / `useParams`. No `history` object, no v5 patterns. |
| **Vite** | Import aliases via `@/` for all `src/` paths. No relative `../../` imports beyond one level. |

### Backend
| Technology | Constraint |
|---|---|
| **Supabase JS v2** | Always import from `@/lib/supabase`. Never instantiate a second client. |
| **Authentication** | Always use `useAuth()` from `@/lib/AuthContext`. Never call `supabase.auth.getUser()` directly inside components. |
| **Data Fetching** | All DB calls go through `memoriaService` (`@/components/memoriaService.jsx`) or a dedicated function in `src/functions/`. Never call `supabase.from()` directly inside a React component. |
| **Storage** | All uploads use `memoriaService.storage.upload()`. Path format: `{event_id}/{timestamp}_{filename}`. |

### Banned Patterns
- ❌ `import axios` — use Supabase client or native `fetch`
- ❌ `import moment` for new code — use `Intl.DateTimeFormat` or `date-fns`
- ❌ `localStorage` for auth state — Supabase session handles this
- ❌ `console.log` in committed code — use `console.error` / `console.warn` only in catch blocks

---

## 3. Coding Standards & Best Practices

### 3.1 Mobile-First Design
- All Tailwind classes must start with the mobile base, then scale up:
  ```jsx
  // ✅ Correct
  <div className="text-sm md:text-lg px-4 md:px-8">

  // ❌ Wrong — desktop-first
  <div className="text-lg px-8 sm:text-sm sm:px-4">
  ```
- Test every UI change mentally at 375px width before considering desktop.
- Use `min-h-screen` on page roots. Use `safe-area-inset-*` for bottom-fixed elements on iOS.

### 3.2 Async / Error Handling
Every Supabase call and every async function **MUST** follow this pattern:
```js
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // handle data
} catch (err) {
  console.error('[Context] Operation failed:', err.message);
  // Set a user-facing error state — NEVER silently swallow errors
  setError('תיאור השגיאה למשתמש');
}
```
- User-facing error messages must be in **Hebrew**.
- Loading states (`isLoading`, `isFetching`) are mandatory for any operation >200ms.

### 3.3 Realtime Safety (Memory Leak Prevention)
Every `supabase.channel()` subscription **MUST** be cleaned up:
```js
useEffect(() => {
  if (!eventId) return;

  const channel = supabase
    .channel(`photos-${eventId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos',
        filter: `event_id=eq.${eventId}` }, handler)
    .subscribe();

  // ✅ Mandatory cleanup
  return () => supabase.removeChannel(channel);
}, [eventId]); // Depend on the specific ID, not broad deps
```
- Channel names must be unique and scoped: `photos-${eventId}`, not `photos-realtime`.
- Filter by `event_id` on every subscription — never listen to an entire table.

### 3.4 Component Modularity
- **Hard limit:** 200 lines per component file.
- When a component exceeds this:
  1. Extract stateful logic → custom hook in `src/hooks/`
  2. Extract UI sections → sub-components in `src/components/{feature}/`
- Custom hooks own their own state, effects, and return a clean API object.
- UI components receive data via props — no direct Supabase calls inside presentation components.

### 3.5 Security
- Never trust client-side quota checks alone — they are UX guardrails, not security.
- RLS is the real security layer. Verify policies in `CLEAN_RESET_SCHEMA.sql` when writing any new data flow.
- Never expose `VITE_SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- User email is PII — do not log it, display it minimally, never store it in localStorage.

---

## 4. The "Read-Before-Write" Protocol (Zero Hallucination)

Violating these rules produces bugs. Follow them without exception.

### Rule 1 — Check the PRD before planning a feature
Before designing or implementing any new feature:
- Read the relevant section of `PRD.md`.
- Confirm the feature exists in the roadmap or has been explicitly requested.
- If it contradicts the PRD, surface the conflict to the user before proceeding.

### Rule 2 — Verify the schema before writing data logic
Before writing any `supabase.from()` call:
- Confirm the **exact table name**, **column names**, and **column types** from `CLEAN_RESET_SCHEMA.sql`.
- Confirm the **RLS policy** that governs the operation (SELECT / INSERT / UPDATE / DELETE).
- Never assume a column exists. Never guess a relationship. Check first.

### Rule 3 — Read the file before modifying it
Before editing any existing file:
- Read the full file (or the relevant section for files >200 lines).
- Identify what already exists to avoid duplication.
- Understand the current data flow before changing it.
- **Do not write code based on memory of a previous session.**

### Rule 4 — No invented APIs or libraries
- Do not suggest or use a library that is not listed in `package.json`.
- Do not invent Supabase API methods — verify against the official Supabase JS v2 docs if uncertain.
- If a capability is uncertain, say so explicitly and offer to verify.

---

## 5. Git & Deployment Discipline

- **Branch:** Work on `main` only for small fixes. Feature work on `feature/{name}`.
- **Commit messages:** Imperative mood, present tense: `Add ZIP export to Dashboard`, not `Added...`
- **Before pushing:** Confirm there are no `console.log` statements, no hardcoded secrets, no dead imports.
- **Vercel auto-deploys** on every push to `main` — treat it as production.
- **Never commit** `.env.local` or any file containing `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Project File Map (Key Files)

```
CLAUDE.md                          ← YOU ARE HERE
PRD.md                             ← Product spec (read before new features)
CLEAN_RESET_SCHEMA.sql             ← DB schema + RLS (read before data logic)
src/
  lib/
    supabase.js                    ← Single Supabase client instance
    AuthContext.jsx                ← useAuth() — session, user, logout
  components/
    memoriaService.jsx             ← All Supabase CRUD operations
  hooks/
    useEventGallery.js             ← Gallery state machine (large — read carefully)
    useRealtimeNotifications.js    ← Realtime subscription hook
  functions/
    checkGuestQuota.js             ← Upload permission logic
    getMyPhotos.js                 ← User-scoped photo fetch
    requestPhotoDeletion.js        ← Soft-delete flow
    resolvePhotoDeletion.js        ← Admin approve/deny deletion
  pages/
    Home.jsx                       ← Landing page
    CreateEvent.jsx                ← Event creation wizard
    EventSuccess.jsx               ← Post-creation share screen
    EventGallery.jsx               ← Guest gallery (tabbed)
    Dashboard.jsx                  ← Host management panel
public/
  manifest.json                   ← PWA config
vercel.json                        ← SPA rewrite rule
```

---

*Last updated: April 2026. Update this file whenever a significant architectural decision is made.*
