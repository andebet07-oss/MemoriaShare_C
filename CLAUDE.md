# MemoriaShare — AI Engineering Protocol
**Authority:** This file is the single source of truth for all AI-assisted development on this project.
Read it in full before every task. Rules here override any default behavior.

---

## Memory System (Load at Every Session Start)

**Step 1 — Load inline (required):** Read `memory/recent-memory.md` in full at the start of every session. This provides the 48hr rolling context: what was decided, what was tried, what failed, what's pending.

**Step 2 — Reference by path:** Keep `memory/long-term-memory.md` and `memory/project-memory.md` available. Read them when:
- Starting work on any file → `memory/project-memory.md` (current state, known issues, URL map)
- Making a UI or code style decision → `memory/long-term-memory.md` (preferences + anti-patterns)
- The user references a past decision or session

**Step 3 — Update at session end:** Run `/consolidate-memory` or append key decisions to `memory/recent-memory.md` before closing.

> Skill: `skills/consolidate-memory/SKILL.md` | Nightly automation: `scripts/consolidate-memory.py`

---

## 0. Project Context (Quick Reference)

- **Product:** MemoriaShare — real-time event photo sharing PWA
- **PRD:** `PRD.md` (authoritative product spec)
- **Schema:** `CLEAN_RESET_SCHEMA.sql` (authoritative DB schema + RLS)
- **Live URL:** `https://memoriashare.com`
- **Deployment:** Vercel (auto-deploy from `main`)
- **Backend:** Supabase project (URL in `.env.local`)

---

## 0.5. Session Memory System

**Every session:** Load memory files from `memory/` directory BEFORE starting work.

### Memory Files (Read in Order)
1. **`memory/recent-memory.md`** — Last 48 hours of context (decisions, active tasks, design choices)
   - Loaded inline at session start
   - Reviewed after every major task block
   - Archived to long-term memory if >48 hours old

2. **`memory/long-term-memory.md`** — Distilled facts, patterns, rules
   - User collaboration style & preferences
   - Product architecture (dual-product: Share + Magnet)
   - Tech stack rules (React, Tailwind, Supabase, auth patterns)
   - Common pitfalls & solutions
   - Brand language & design system

3. **`memory/project-memory.md`** — Active initiative state
   - Current task deliverables & timeline
   - Files to modify & routes to define
   - Testing checklist
   - Known issues & blockers

### Consolidation
Automated nightly at 10 PM (task: `consolidate-memoria-memory`):
- Extracts new decisions & patterns from session
- Updates recent-memory with fresh context
- Promotes key facts to long-term memory
- Ensures project-memory.md is current

### Manual Consolidation
After completing a major feature or day's work:
```
1. Summarize decisions made (what, why, consequences)
2. Check if any new rules emerged (add to long-term-memory.md)
3. Update project-memory.md with progress (✓ completed, in-progress, pending)
4. Remove stale TODOs; keep decision context
```

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

### 3.6 WebRTC Camera & Full-Screen Overlay Rules

Hard lessons from the `CameraCapture.jsx` refactor (April 2026). Violating these causes FPS drops, black screens on iOS, or squished viewfinders in landscape.

**Rule: CSS filter on live video. Canvas only at capture.**
- ❌ Never run `getImageData`/`putImageData` on a live video stream for real-time visual effects. Pixel-loop at 30 fps destroys framerate on mid-range Android.
- ✅ Apply visual filters to the live feed via CSS `filter:` on the `<video>` element.
- ✅ Use Canvas pixel manipulation **only at capture time** (single frame snapshot — not continuously).

**Rule: Full-screen camera = `fixed inset-0`, all layers `absolute`. Never `flex flex-col`.**
- ❌ Do not wrap the camera in a `flex flex-col` root with the control bar as a real flex item. In landscape, the bar consumes 40–50% of screen height, squishing the viewfinder to a sliver.
- ✅ Root: `fixed inset-0 overflow-hidden` — no flex.
- ✅ `<video>`: `absolute inset-0 w-full h-full object-cover` — true full-screen background.
- ✅ Every UI layer (header, controls, overlays, scrim): `absolute` with explicit `z-index` stacking.
- ✅ Bottom floating bar: `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + Npx)` — never hardcode pixels; iOS home indicator height varies by device.

**Rule: `getUserMedia` must have an `OverconstrainedError` fallback.**
```js
// ✅ Ideal constraints first, minimal fallback on OverconstrainedError
let stream;
try {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
  });
} catch (e) {
  if (e.name === 'OverconstrainedError') {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
  } else throw e;
}
```

**Rule: Safari iOS WebRTC — three required attributes + play guard.**
- `<video>` MUST have `autoPlay playsInline muted` — omitting any silently breaks playback on iOS Safari.
- Always chain `.catch()` on `.play()`: `videoRef.current.play().catch(err => console.warn(...))`.
- `videoTrack.getCapabilities()` can return `{}` on Safari — always guard capability reads.

**Rule: Hardware torch requires a capabilities guard.**
```js
const capabilities = videoTrack.getCapabilities?.() ?? {};
if (capabilities.torch) {
  await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
}
// ❌ Calling applyConstraints with torch on an unsupported device throws — never skip the guard.
```

**Rule: ObjectURL lifecycle — every `createObjectURL` needs a matched `revokeObjectURL`.**
- Revoke on: individual photo removal, full batch clear, AND component unmount.
- In the unmount cleanup `useEffect`, state is stale. Use a `ref` that shadows the state array:
```js
const pendingPhotosRef = useRef([]);
useEffect(() => { pendingPhotosRef.current = pendingPhotos; }, [pendingPhotos]);
useEffect(() => () => pendingPhotosRef.current.forEach(p => URL.revokeObjectURL(p.previewUrl)), []);
```

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
  components/
    magnet/
      MagnetCamera.jsx             ← Full-screen camera (camera mode → delegates to MagnetReview)
      MagnetReview.jsx             ← Review screen: draggable stickers + canvas composite + send to print
      stickerPacks.js              ← Sticker packs auto-selected by event name (wedding/bar-mitzvah/birthday/general)
  pages/
    Home.jsx                       ← Landing page
    CreateEvent.jsx                ← Event creation wizard
    EventSuccess.jsx               ← Post-creation share screen
    EventGallery.jsx               ← Guest gallery (tabbed)
    Dashboard.jsx                  ← Host management panel
    MagnetLead.jsx                 ← 4-step lead wizard for MemoriaMagnet (step 4 has summary card)
    MagnetGuestPage.jsx            ← Guest landing for magnet events (QR → camera)
    PrintStation.jsx               ← Operator print queue dashboard (real-time)
    AdminDashboard.jsx             ← Admin CRM for leads + event management
    CreateMagnetEvent.jsx          ← Admin event creation for MemoriaMagnet
public/
  manifest.json                   ← PWA config
vercel.json                        ← SPA rewrite rule
```

---

## 7. Plan Mode Output Rules

When operating in Plan Mode, limit planning output to concise bullet points and strictly under 100 words. Be direct, code-focused, and avoid unnecessary verbosity.

---

*Last updated: April 2026. Update this file whenever a significant architectural decision is made.*

---

# Memoria Platform - Global AI Guidelines

## 1. Token Efficiency & Workflow Rules (CRITICAL)
* *Be Concise:* No long-winded explanations. Output only necessary plans or targeted code.
* *Targeted Edits Only:* DO NOT output or rewrite entire files. Use precise line replacements or tool-assisted AST edits.
* *Ask Before Complex Actions:* For database schema changes or multi-file architectural shifts, output a structured Plan (.md) and WAIT for approval before modifying code.

## 2. Localization & Styling
* *Language Split:* ALL user-facing UI text must be in Hebrew (RTL). All code variables, logs, and internal documentation must be in English.
* *Styling Paradigm:* Tailwind CSS. Native iOS aesthetic. Use backdrop-blur for floating elements and avoid solid blocks that cover camera views.

## 3. Core Architecture: Dual-Product System
* *DO NO HARM:* The platform runs two core products. You MUST isolate logic using conditional checks (e.g., event_type === 'share' || 'magnet') and NEVER break existing MemoriaShare flows when building MemoriaMagnet.

* *Product 1: MemoriaShare (Legacy)*
  - Self-service logic. Guests autonomously create events and upload photos to digital albums.

* *Product 2: MemoriaMagnet (New Premium Service)*
  - Managed service logic. Admin creates events.
  - Guests have a print quota, a "Send to Print" action (instead of upload), and real-time status tracking.
  - Requires a secure Operator Print Station dashboard for the admin.
