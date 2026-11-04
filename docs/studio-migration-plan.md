# Magnet Frame Studio → `/admin/studio`

**Status:** approved 2026-11-04, D1–D5 as recommended (shared library, konva + zustand + fflate, ZIP kept, editor desktop/tablet only, redirect then delete the old site). Phase 2 done: `supabase/migrations/20261104_studio_templates.sql` applied to live 2026-11-04; `docs/qa/studio-templates-rls-test.sql` on live 22/22 (locally the guards abort with no changes when re-run, when `is_admin()` is missing, or when it isn't SECURITY DEFINER). Phase 3 written on this branch: the studio in `src/studio/`, `/admin/studio` + `/admin/studio/:templateId`, the "סטודיו" tab, self-hosted fonts, konva + zustand + fflate. Waiting for review and merge.
**Branch:** `claude/hopeful-feynman-ohyurh` (from `main` 234750f).
**Source:** the standalone studio, repo `andebet07-oss/magnet-frame` (live at magnet-frame.vercel.app, its own Supabase project `gelzopnjdlucizxpootg`).

## 0. Goal

The frame studio (template library, 10×7.5 / 10×15 / 10×10 frame editor, layers, hearts inside text, icon library, 15 ready-made frames, transparent print PNG 2500×1875, ZIP backup, frame import from a PNG) moves into the Memoria admin. One site, one sign-in, one Supabase project. After the move the standalone site and its Supabase project are retired.

Out of scope here (next plan, after this lands): using a studio template as an event's magnet, with names and date filled in from the event, in the camera, review, station and print.

## 1. What moves, what changes

The studio is ~5,700 lines of JS/JSX plus 12 test files (309 tests). It uses no React 19-only API (checked: no `use()`, actions, ref-as-prop or `<Context value>`), so it runs on Memoria's React 18 as is.

| Studio part | In Memoria | Change |
|---|---|---|
| `src/model`, `src/render`, `src/storage`, `src/store`, `src/icons`, `src/fonts`, `src/screens` | `src/studio/…` (same sub-folders) | Imports `@/x` → `@/studio/x`. Logic unchanged. |
| `src/lib/supabase.js` (own client) | — | Uses Memoria's `@/lib/supabase`. |
| `src/auth/*` (magic-link sign-in) | — | Deleted. Routes sit behind `RequireAdmin`; the user id comes from `useAuth()`. |
| `src/storage/supabaseGateway.js` | `src/studio/storage/` | Table `studio_templates`, bucket `studio-files`, file prefix `{templateId}/…` (shared library, D1). The studio's data layer stays its own module, the same role `src/functions/` plays. |
| Dev demo mode (`/?demo`, in-memory backend) | — | Dropped from the app. `memoryGateway` stays for unit tests. |
| `src/ui/*` (Button, Dialog, fields, toasts) and the `ink-*` / `accent-*` colours (Tailwind 4 `@theme`) | `src/studio/ui/*` | Restyled with Memoria's semantic tokens (`bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`…). The studio accent is already Memoria's indigo (`#7c86e1` / `#5f69d3`). No Tailwind 4 syntax is kept. Toasts use Memoria's toaster. |
| Fonts: 24 Hebrew families via 24 `@fontsource/*` packages, plus the bundled "Magnet Symbols" font | `public/fonts/studio/*.woff2` + `src/studio/fonts/studio-fonts.css` | Self-hosted, the same way `public/fonts/templates` is (no 24 new packages, D2). ~3.3 MB of woff2 in total; the browser loads only the faces in use, and only in the studio. |
| `public/icons/emoji/*.svg` (73 Fluent Emoji, MIT) + licence notice | `public/studio/emoji/` | Path constant changes. |
| `tests/*.test.js` | `src/studio/__tests__/` | Same tests, Memoria's Vitest. |

**Routes** (lazy-loaded, so guests and other admin pages never download the studio):

| Route | What | Shell |
|---|---|---|
| `/admin/studio` | Template library, new-template gallery, backup/restore, frame import | Inside `AdminShell`, new tab "סטודיו" |
| `/admin/studio/:templateId` | Frame editor | Full screen, like the Print Station |

**Project rules that apply.**
- Files over 200 lines get split: `LibraryScreen` (206), `useFrameStage` (217), `buildFrame` (215).
- `starters.js` (351) is design data. It splits by event kind.
- `symbolPaths.js` is generated, so it is exempt.
- The studio has no `console.log`.

## 2. Decisions I need from you

| # | Question | Recommendation |
|---|---|---|
| D1 | Templates shared by all admins, or private per admin? | **Shared.** It's the business's frame library. Each row still records who created it. |
| D2 | New npm packages | **Approve 3:** `konva` (canvas drawing; the editor and print renderer are built on it), `zustand` (editor state and undo), `fflate` (ZIP backup, also how the existing templates move over). Fonts are self-hosted instead of 24 `@fontsource` packages. |
| D3 | Keep "גיבוי ZIP" and "שחזור מגיבוי" in the studio | **Yes.** It's the transfer path (§5) and an off-site copy of the designs. |
| D4 | The editor on a phone | **Library usable on a phone; editor desktop/tablet only**, with a "פתח במחשב" message below 1024 px. A precise mm editor on a 375 px screen isn't usable. This is an exception to mobile-first. |
| D5 | The old site after the move | **Redirect** magnet-frame.vercel.app to memoriashare.com/admin/studio. **Delete** the old Supabase project after two weeks without problems. |

## 3. DB: `supabase/migrations/20261104_studio_templates.sql` (applied 2026-11-04)

This migration is additive only, and nothing existing reads it. It will be written in phase 2 and applied by you, following `docs/runbooks/pre-migration-backup.md`.

- **Table `public.studio_templates`.**
  - Columns: `id uuid pk`, `owner_id uuid default auth.uid()`, `name text` (1–200 chars), `doc jsonb` (≤ 512 KB), `revision int`, `created_at`, `updated_at`.
  - A trigger bumps `revision` on every update and keeps `owner_id`, `created_at` and `revision` server-controlled. The editor's save-conflict protection relies on this.
  - It is the same schema the studio runs today.
- **RLS on, `anon` revoked.** SELECT / INSERT / UPDATE / DELETE are allowed only when `is_admin()`.
- **Storage bucket `studio-files`.**
  - Private, 20 MB per file, PNG / JPEG / WEBP / SVG.
  - `storage.objects` policies for this bucket only, also `is_admin()`.
- **Rollback SQL** at the bottom of the file: drop the policies, the bucket, the table and the trigger.

**Pre-check result (2026-11-04):** two admins in `profiles`. Queries 1–2 ran without error, so `is_admin()` exists. Their output wasn't visible (the SQL editor shows only the last result), so the migration's guard block checks the rest itself: `is_admin()` must be SECURITY DEFINER and test `auth.uid()` with `role = 'admin'`, and the table and bucket names must be free.

Live RLS has drifted from `CLEAN_RESET_SCHEMA.sql`, so before the file was written these read-only checks ran in the SQL editor:

```sql
-- 1. is_admin() exists, and what it checks
SELECT pg_get_functiondef('public.is_admin()'::regprocedure);
-- 2. the names are free
SELECT to_regclass('public.studio_templates') AS table_exists,
       (SELECT count(*) FROM storage.buckets WHERE id = 'studio-files') AS bucket_exists;
-- 3. who is admin today
SELECT id, role FROM public.profiles WHERE role = 'admin';
```

## 4. Phases

Each phase is one PR into `main`. `main` deploys to production on merge, and nothing merges without your OK.

1. **This plan.** You decide D1–D5.
2. **Migration file** in `supabase/pending/` + local QA.
   - QA runs on a Postgres stand-in: admin can, non-admin and anonymous can't, for the table and the bucket.
   - You run the pre-checks (§3), then apply the migration. It's additive, so it's safe before the code ships.
3. **Studio code.**
   - Code: `src/studio/`, the two routes, the admin tab, the fonts and emoji in `public/`, and the three packages (D2).
   - Checks: `npm test` (Memoria + studio), `npm run lint` and `npm run build`. Then a browser check of create, edit, hearts in text, icons, ready-made frames, export PNG, backup and restore, and frame import, against mocked Supabase.
   - Then you test it on production after merge. The route is admin-only and guests never load it.
4. **Move the templates.** "גיבוי ZIP" on the old site, then "שחזור מגיבוי" in `/admin/studio`.
5. **Retire the old site.** Redirect, then delete the old Supabase project after two weeks (D5).
6. **Next plan:** a studio template as an event's magnet. It depends on the pending `20261026_polaroid_templates_add.sql` being applied.

## 5. What you do by hand

| When | Step |
|---|---|
| ✅ | Answered D1–D5. |
| Phase 2 ✅ | Ran the pre-checks in §3. |
| Phase 2 ✅ | Ran `20261104_studio_templates.sql` in the SQL editor ("Success. No rows returned"), then `docs/qa/studio-templates-rls-test.sql` (`22 passed, 0 failed`). The runbook's `pg_dump` is optional here: this migration only adds objects, changes no existing row or policy, runs in one transaction, and its rollback is at the end of the file. |
| Phase 3 | Review and merge the PR. Then open memoriashare.com/admin/studio and create, edit and export one frame. |
| Phase 4 | On magnet-frame.vercel.app: "גיבוי ZIP". On memoriashare.com/admin/studio: "שחזור מגיבוי" with that file. Check the templates opened. |
| Phase 5 | Vercel → project `magnet-frame` → Settings → add the redirect I give you (or delete the project). After two weeks: Supabase → the old project → Settings → Delete project. |

### Phase 3 notes (as built)

- **Checks.** `npm test`: the studio's 301 tests pass, run in the Node environment (`// @vitest-environment node`) as before. The 8 sign-in tests were removed with the studio's own sign-in. Two existing site test files fail on `main` too: they import `@/api/base44Client` and `@/lib/app-params`, which no longer exist.
- **Lint and types.** `npm run lint` passes, and `src/studio` is now linted. `npm run typecheck` already reports 296 errors on `main` and is not a gate; the studio pages add 64 more, all inferred-type complaints inside `src/studio`.
- **Bundle.** The main bundle grows by ~0.2 KB gzipped (routes + tab). The studio chunk is ~100 KB gzipped (Konva included) plus the two page chunks (~20 KB), loaded only on `/admin/studio`.
- **Browser check.** The studio screens ran on the site's dev build with an in-memory backend (a local harness, not committed). Covered: ready-made frames by event (create, edit name, export, tag filter), hearts and rings in text, icons (colours, emoji upload), the PNG export (2500×1875, transparent window, heart over the window kept, border opaque) and frame import (window detected as the photo area).
- **Not covered locally:** the real Supabase calls under an admin session. That's the phase 3 production check below.

## 6. Risks

- **`is_admin()` on live may differ from the schema file.** The pre-check covers it, and the migration aborts if the function is missing.
- **Bundle size.** Konva is ~60 KB gzipped. The whole standalone studio is ~240 KB gzipped today, including React and supabase-js, which Memoria already loads. All of it goes into the lazy `/admin/studio` chunk; the guest pages' bundle is unchanged, and the PR reports both sizes.
- **Two Supabase sessions during the transition.** The old site keeps working until phase 5, so nothing is lost if phase 3 needs fixes.
