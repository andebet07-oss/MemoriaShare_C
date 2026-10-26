# Print Pipeline Hardening Plan

**Status (2026-10-26):** everything is on branch `claude/lucid-knuth-l1jm0g`. Nothing has been applied to the live DB and nothing is merged.

| Item | State | Where |
|---|---|---|
| Stage 0 (D5): no auto-copies, face chip hidden | ✅ code | `15f9fbb` |
| D1: lead cover → `leads/{uid}/` | ✅ code + migration §2 | `e1127ae` |
| 3: one frame resolver, frame printed once | ✅ code + 9 unit tests | `c8bced5` |
| 4: station failures → toasts, no advance on failure, no double print | ✅ code + 7 unit tests | `38419c8` |
| 1: guest print_jobs INSERT | ✅ migration §1 | |
| 2: photos bucket INSERT / admin UPDATE (D4) | ✅ migration §2–3 | |
| New 1: event creation admin-only (+ Magnet events updatable only by admins — security-review follow-up) | ✅ migration §6 | |
| New 2: admin photo read → Magnet photos private | ✅ migration §4 | |
| New 3: URLs only into our bucket's event folder | ✅ migration §1 + §5 | |
| Copies reset (2 July jobs) | ✅ migration §7 | |
| D3: `ep.event_id = event_id` bug | ✅ Magnet side (§4); ⏳ Share side waits on Q1 | |
| 5 / D2: `getByCode` columns | ⏳ waits on Q3 | |

**Q1, Q2, Q3 results haven't arrived.** The last two messages said "results below", but nothing followed. The queries are in §0.

## 0. Live facts and queries
**Live facts (2026-10-25):**
- 20260701 columns present.
- 32 jobs; the last on 2026-07-01 20:19 UTC.
- Live RLS has drifted from `CLEAN_RESET_SCHEMA.sql`:
  - photos policies are `photos_select` / `photos_update` / `photos_insert_any_authenticated`;
  - `storage_photos_insert_public` has roles `{public}`;
  - there is no admin SELECT on photos and no UPDATE policy on storage.objects.

**`raw_photo_url = 0`:** the raw upload first shipped in `49a87ad` at 2026-07-01 20:32 UTC, 13 minutes after the last job. No production submission has ever run it. QA §C requires a real submission to store it.

### Q1 — full policy text (photos, print_jobs, storage), ≤100-char rows
```sql
SELECT p.tablename, p.policyname, l.n AS line, c.i + 1 AS part,
       substr(l.txt, c.i * 100 + 1, 100) AS txt
FROM pg_policies p
CROSS JOIN LATERAL regexp_split_to_table(
  format(E'%s %s TO %s\nUSING: %s\nWITH CHECK: %s',
         p.permissive, p.cmd, array_to_string(p.roles, ', '),
         coalesce(p.qual, '-'), coalesce(p.with_check, '-')),
  E'\n') WITH ORDINALITY AS l(txt, n)
CROSS JOIN LATERAL generate_series(0, greatest(length(l.txt) - 1, 0) / 100) AS c(i)
WHERE (p.schemaname = 'public'  AND p.tablename IN ('photos', 'print_jobs', 'events'))
   OR (p.schemaname = 'storage' AND p.tablename = 'objects')
ORDER BY p.tablename, p.policyname, l.n, c.i;
```
### Q2 — event_permissions
```sql
SELECT role, count(*) AS grants, count(DISTINCT event_id) AS events, count(DISTINCT user_id) AS users
FROM event_permissions GROUP BY role ORDER BY role;
```
### Q3 — Share usage
```sql
SELECT e.event_type,
       count(DISTINCT e.id)                            AS events,
       count(DISTINCT e.id) FILTER (WHERE e.is_active) AS active_events,
       count(DISTINCT e.created_by)                    AS hosts,
       max(e.created_date)                             AS latest_event_created,
       count(p.id)                                     AS photos,
       max(p.created_date)                             AS latest_photo
FROM events e LEFT JOIN photos p ON p.event_id = e.id
GROUP BY e.event_type ORDER BY e.event_type;

SELECT e.event_type, count(o.id) AS files,
       pg_size_pretty(sum((o.metadata ->> 'size')::bigint)) AS total_size
FROM storage.objects o
JOIN events e ON e.id::text = split_part(o.name, '/', 1)
WHERE o.bucket_id = 'photos'
GROUP BY e.event_type ORDER BY e.event_type;
```
### Q4 — storage prefix the migration will pin (new; run before applying)
```sql
SELECT substring(file_url FROM '^(https://[^/]+/storage/v1/object/public/photos/)') AS prefix, count(*)
FROM photos GROUP BY 1 ORDER BY 2 DESC;
```
This must show exactly one non-null prefix, otherwise the migration aborts. Rows with a NULL prefix are photos whose `file_url` isn't in our bucket. Tell me if any appear.

### Q5 — orphan uploads since July 1 (optional)
```sql
SELECT o.name, o.created_at FROM storage.objects o
WHERE o.bucket_id = 'photos' AND o.created_at >= timestamptz '2026-07-01 00:00+00'
  AND o.name NOT LIKE '%/derived/%' AND split_part(o.name, '/', 1) NOT IN ('covers', 'overlays')
  AND NOT EXISTS (SELECT 1 FROM photos p WHERE p.path = o.name)
ORDER BY o.created_at DESC LIMIT 20;
```

## 1. Migration design
Live permissive policies have drifted and are partly unknown, so the new rules come in two kinds:
- **Replace** where the live name is known: `print_jobs_insert_guest`, `storage_photos_insert_public`.
- **RESTRICTIVE** where it isn't (photos, events INSERT). Postgres ANDs these with every permissive policy, so the rule holds whatever the live text says.

Helpers:
- `can_queue_print_job`, `is_active_event_folder` and `is_magnet_event` are SECURITY DEFINER (the existing `is_admin()` pattern), so the rules don't depend on drifted SELECT policies.
- `is_event_storage_url(url, event_id)` and `photos_public_base_url()` check URLs against **our** storage prefix. The prefix is pinned from existing `photos.file_url` data, because the project URL isn't in the repo. The migration aborts unless exactly one prefix is in use, and prints it.

| § | Rule |
|---|---|
| 1 | Guest job: own uid; `pending`; `copies = 1`; no crop or face_count; own photo in the same active Magnet event; `raw_photo_url` NULL or `{prefix}{event_id}/{file}`. Quota trigger unchanged (counts rows). |
| 2 | Bucket INSERT: `authenticated` only. Allowed: `{active_event_id}/…`; `covers/` (admin); `leads/{own uid}/{file}` (D1); `overlays/` (admin, unchanged). |
| 3 | Bucket UPDATE (upsert): admin, `overlays/` and `covers/` only (D4). |
| 4 | `photos_select_admin` (permissive) is created first, then RESTRICTIVE SELECT / UPDATE / DELETE: a Magnet photo is visible to and changeable by only its uploader and admins. Share photos are untouched. This also neutralises D3 for Magnet photos. |
| 5 | RESTRICTIVE photos INSERT: `created_by = auth.uid()`; `file_url = {prefix}{path}`; `path` is a single file in `{event_id}/`; `file_urls` NULL. The resize webhook (service_role) fills `file_urls`. Trigger `trg_photos_lock_urls`: API roles can't change `file_url` / `file_urls` / `path` / `event_id` / `created_by` after insert. |
| 6 | RESTRICTIVE events INSERT: admin only. RESTRICTIVE events UPDATE: only admins can update a Magnet row or produce one, which closes the Share→Magnet flip and editor-grant changes to a Magnet frame or quota. |
| 7 | Reset `copies` to 1 for queued jobs whose copies equal the simulated face count. |
| Guards | Abort if any other permissive INSERT path into print_jobs or the photos bucket survives, or if one isn't limited to `authenticated`. |

**Local validation** (Postgres 16 stand-in with worst-case live policies, including the D3 bug):
- RLS QA: 49/49 pass.
- storage: 17/17 pass.
- Re-running the migration is a no-op.
- A stray policy makes it abort.
- snapshot → migrate → rollback restores identical policies and removes the new functions and trigger.
- Before the migration, the stand-in reproduced both holes: anon read a Magnet photo, and an editor of another event repointed one to an external URL.

## 2. What still changes when Q1 / Q3 arrive
- **D3, Share side:** if Q1 shows the bug in `photos_select` / `photos_update` / the photos DELETE policy, I'll add a §8 that recreates those policies with `photos.event_id` qualified.
- **Also from Q1:** confirm there are no other INSERT policies on `print_jobs` / `storage.objects` (the guards would abort anyway), and check the live events INSERT policy.
- **5 / D2:** if Q3 shows no recent Share activity, `getByCode` returns Magnet fields only (`id, name, date, cover_image, overlay_frame_url, print_quota_per_device, event_type, is_active, unique_code`).

## 3. Apply order (approved)
snapshot → off-site `pg_dump` (required) → status.supabase.com clear → apply → RLS QA script → browser storage checks → one real guest submission end to end (`raw_photo_url` stored) → rest of QA → merge to `main`.
Details: `docs/runbooks/pre-migration-backup.md`.

**Coupling:** after applying, `main`'s old lead wizard can't upload covers (it targets `general/`). Run the E2E on the branch preview and merge soon after QA passes.

## Follow-ups (not in this migration)
- **Storage list API.** `storage_photos_select_public` still lets anyone list an event folder's file names, so Magnet photos remain enumerable through Storage even though the table is closed. Closing it needs a live check that the storage service still works when SELECT is limited to owner/admin, since it may read back the rows it inserts. QA §B has the probe.
- **Quota.** The per-device quota can be bypassed by clearing site data (it's tied to the anonymous user). This is inherent to anonymous auth.
- **Schema file.** Sync `CLEAN_RESET_SCHEMA.sql` with live after this lands.
- **File size.** `MagnetProStation.jsx` is 209 lines (the limit is 200; it was 225 before Stage 0).
