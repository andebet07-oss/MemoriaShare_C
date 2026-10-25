# Print Pipeline Hardening Plan

**Status (2026-10-25):**
- ✅ **Stage 0 (D5)** committed (`15f9fbb`): no automatic copy multiplication, and the face-count chip is hidden.
- ✅ **Migration** rebased on the live policies and tested on a local Postgres 16 copy. Not applied to the live DB.
- ⏳ **Waiting on:** query Q1 output (D3 review and a final name check), plus decisions D1 and D2.
- ⏳ **Items 3–5 (app code):** not started.

Files:
- Migration: `supabase/migrations/20261025_print_pipeline_hardening.sql`
- Backup + rollback: `docs/runbooks/pre-migration-backup.md`, `supabase/rollback/20261025_snapshot.sql`, `supabase/rollback/20261025_restore_policies_snapshot.sql`
- QA: `docs/qa/print-pipeline-hardening.md`, `docs/qa/print-pipeline-rls-test.sql`

## 0. Live DB facts (your results, 2026-10-25)
- **A.** The 20260701 columns exist. The migration header is now dated 2026-07-01.
- **B.** 32 jobs; the last is 2026-07-01 20:19 UTC. 2 queued jobs had simulated auto-copies, and the migration resets them to `copies = 1`.
- **C.** Live RLS has drifted from `CLEAN_RESET_SCHEMA.sql`:
  - photos policies are `photos_select`, `photos_update` and `photos_insert_any_authenticated`;
  - `storage_photos_insert_public` has roles `{public}`;
  - there is no admin SELECT on photos and no UPDATE policy on `storage.objects`.

### `raw_photo_url = 0` explained
`git log -S raw_photo_url` shows the raw upload first shipped in `49a87ad`, committed **2026-07-01 20:32 UTC**. That is 13 minutes *after* the last job (20:19 UTC), so no production submission has ever run that code.

The code path itself is sound:
- the capture is a JPEG `data:` URL;
- `fetch(dataURL)` works;
- there is no CSP;
- it uses the same upload function and folder as the composite upload, which does work.

It is silent by design, though: a failure only goes to Sentry (`MagnetReview.rawUpload`) and the station's crop button is disabled. QA §C now requires a real submission to store a non-null `raw_photo_url`. Q5 lists uploads since July 1 that no photo row references. A raw file next to the 20:19 job would mean a local test uploaded it but its URL wasn't saved.

### Queries to run before applying
- **Q1 — full policy text, split into ≤100-char rows so the grid can't truncate it.** It includes `print_jobs` and `storage.objects` as well as photos, so I can confirm the names the migration drops.
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
  WHERE (p.schemaname = 'public'  AND p.tablename IN ('photos', 'print_jobs'))
     OR (p.schemaname = 'storage' AND p.tablename = 'objects')
  ORDER BY p.tablename, p.policyname, l.n, c.i;
  ```
- **Q2 — event_permissions (D3 exposure).** 0 rows means nobody holds a grant today.
  ```sql
  SELECT role, count(*) AS grants, count(DISTINCT event_id) AS events, count(DISTINCT user_id) AS users
  FROM event_permissions GROUP BY role ORDER BY role;
  ```
- **Q3 — Share usage.**
  ```sql
  SELECT e.event_type,
         count(DISTINCT e.id)                            AS events,
         count(DISTINCT e.id) FILTER (WHERE e.is_active) AS active_events,
         count(DISTINCT e.created_by)                    AS hosts,
         max(e.created_date)                             AS latest_event_created,
         count(p.id)                                     AS photos,
         max(p.created_date)                             AS latest_photo
  FROM events e
  LEFT JOIN photos p ON p.event_id = e.id
  GROUP BY e.event_type
  ORDER BY e.event_type;

  -- storage footprint per product (decides how much a Share export involves)
  SELECT e.event_type, count(o.id) AS files,
         pg_size_pretty(sum((o.metadata ->> 'size')::bigint)) AS total_size
  FROM storage.objects o
  JOIN events e ON e.id::text = split_part(o.name, '/', 1)
  WHERE o.bucket_id = 'photos'
  GROUP BY e.event_type
  ORDER BY e.event_type;
  ```
- **Q5 (optional) — orphan uploads since July 1** (raw-upload investigation).
  ```sql
  SELECT o.name, o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'photos'
    AND o.created_at >= timestamptz '2026-07-01 00:00+00'
    AND o.name NOT LIKE '%/derived/%'
    AND split_part(o.name, '/', 1) NOT IN ('covers', 'overlays')
    AND NOT EXISTS (SELECT 1 FROM photos p WHERE p.path = o.name)
  ORDER BY o.created_at DESC
  LIMIT 20;
  ```

### Apply order
1. Snapshot (`supabase/rollback/20261025_snapshot.sql`), plus the off-site dump if possible.
2. Migration.
3. RLS QA script.
4. Browser storage checks.
5. If anything fails, run the rollback script.

Details: `docs/runbooks/pre-migration-backup.md`.

## 1. Guest `print_jobs` INSERT (migration §1)
`print_jobs_insert_guest` is replaced with `TO authenticated`. The check requires:
- `guest_user_id = auth.uid()`
- `status = 'pending'`, `copies = 1`, `crop_config IS NULL`, `face_count IS NULL`
- `can_queue_print_job(event_id, photo_id)`: the event is active and `magnet`, and the photo was created by the caller in that event.

`can_queue_print_job` is a SECURITY DEFINER helper, the same pattern as `is_admin()`. That way the rule doesn't depend on the drifted events/photos SELECT policies. `enforce_print_quota()` is unchanged and still counts rows.

## 2. `photos` bucket (migration §2–3)
- `storage_photos_insert_public` ({public}) is replaced by `storage_photos_insert_event_folder`: `TO authenticated`, and the first folder must be the id of an active event (`is_active_event_folder()`).
- New `storage_covers_insert_admin`.
- **D4 ✅** — new `storage_photos_update_admin`, limited to `overlays/` and `covers/`, so upserts can replace existing files.
- `storage_overlays_insert_admin` is unchanged.

**Assertions:** before `COMMIT`, the migration aborts, applying nothing, if any other INSERT path into `print_jobs` or the photos bucket survives, or if a photos-bucket INSERT policy isn't limited to `authenticated`.

**Local test results:**
- print_jobs: 16/16 cases pass (8 fail before the migration).
- storage: 13/13 pass.
- Re-running the migration is a no-op.
- A stray policy aborts it.
- snapshot → migrate → rollback restores identical policies.

**Still blocked by §2:** every `general/` upload.
- `MagnetLead` cover upload (**D1**).
- Share host covers (`CreateEvent`, `Dashboard`). Acceptable, since Share is retired.

## 3. Custom frame: one shared resolver (app code, not started)
Unchanged from the previous plan:
- **`resolveEventFrame(event)` in `framesUtils.js`, cached.**
  - A frames_meta id → DB lookup.
  - An `http` URL → PNG descriptor with `hole_bbox` from `detectHoleBbox` (CORS-safe load), or the full canvas when the PNG has no hole.
  - Nothing assigned → name-pack fallback.
- **Used by** MagnetCamera, MagnetReview, magnetPrint and CropEditor.
- **Printing:** the stored composite prints as-is with no second overlay; the re-crop path re-composites with the same frame.
- **Dependency:** replacing an existing custom frame needs the §3 UPDATE policy.

## 4. Station failures → Hebrew toasts (app code, not started)
Unchanged:
- any print or update failure leaves the status unchanged and shows a destructive `toast`;
- a separate "printed but status update failed — don't reprint" toast;
- `markAllReady` shows a toast and re-fetches;
- per-job in-flight guard on fast-print.

## 5. `events.getByCode` columns (app code, not started)
Unchanged. Waiting on D2.

## 6. Decisions
- **D1 — lead cover upload: still open.** Applying the migration without it breaks the cover step of `MagnetLead`; the upload fails silently and the lead still submits. Recommended: anonymous sign-in plus a `leads/{auth.uid()}/` folder policy. Or drop the step.
- **D2 — `getByCode` fields: still open.** Recommended: Magnet fields plus the non-sensitive fields live Share galleries read. Q3 tells us whether Share galleries still matter at all.
- **D3 — photos policies: waiting on Q1/Q2.** In the repo, `photos_select_owner` / `_viewer` / `_update_owner` / `_delete_owner` compare `ep.event_id = event_id`, which resolves to `ep.event_id` and is always true. Live has consolidated `photos_select` / `photos_update` instead. Q1 shows whether they carry the same bug. If they do, I'll add the qualified fix (`photos.event_id`) to migration §5. Also check in Q1 whether `photos_insert_any_authenticated` enforces `created_by = auth.uid()`.
- **D4 — ✅ yes** (migration §3).
- **D5 — ✅ done** (`15f9fbb`).

## Noticed, out of scope
- `raw_photo_url` and `photos.file_url` are guest-controlled strings, and the station loads and prints whatever they point to.
- The per-device quota can be bypassed by clearing site data, because it is tied to the anonymous user. This is inherent to anonymous auth.
- `CLEAN_RESET_SCHEMA.sql` no longer reflects live RLS. Sync it from the Q1 output after this migration lands.
