# Print Pipeline Hardening Plan

**Status:** PLAN. Waiting for approval. Nothing has been applied to the live DB and no app code has changed.
**Migration (written, not applied):** `supabase/migrations/20261025_print_pipeline_hardening.sql`

## 0. Before applying anything

1. **Query A from the previous task is still open.** It checks whether `print_jobs` has `copies` / `face_count` / `crop_config` / `raw_photo_url`. The new policy uses those columns, so the migration aborts with a clear error if `20260701` is missing.
2. **Pre-flight: run this and send me the output.** Permissive policies are OR-ed, so a live INSERT policy the repo doesn't know about would keep the hole open:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, cmd, roles, qual, with_check
   FROM pg_policies
   WHERE (schemaname = 'public'  AND tablename IN ('print_jobs', 'photos'))
      OR (schemaname = 'storage' AND tablename = 'objects')
   ORDER BY tablename, cmd, policyname;
   ```

## 1. Guest `print_jobs` INSERT → migration §1
Replace `print_jobs_insert_guest` (RLS `WITH CHECK`, `TO authenticated`). The check requires:
- `guest_user_id = auth.uid()`
- `status = 'pending'`, `copies = 1`, `crop_config IS NULL`, `face_count IS NULL`
- the event is active and `event_type = 'magnet'`
- `photo_id` is a photo with `created_by = auth.uid()` in the same `event_id`

`enforce_print_quota()` is unchanged and still counts rows. I chose RLS over a second trigger because RLS checks the final row after BEFORE triggers and defaults. That puts the rule in the same layer as every other access rule in the schema. Admin operator updates keep going through `print_jobs_update_admin`. The current guest submit sends only ids + `raw_photo_url`, so it passes unchanged.

## 2. `photos` bucket INSERT → migration §2
- Drop `storage_photos_insert_public`.
- New `storage_photos_insert_event_folder`: `TO authenticated`, and the first folder must be the id of an active event.
- New `storage_covers_insert_admin`: `covers/` is admin-only. The event-folder rule would otherwise block admin cover uploads from `CreateMagnetEvent` and `MagnetEventDashboard`.
- `storage_overlays_insert_admin` is unchanged.

**This blocks every upload to `general/`:**
- **`MagnetLead.jsx:342` (needs your decision, D1).** The public lead wizard uploads the prospect's cover image there with no session. It would start failing silently.
- **`CreateEvent.jsx:354`, `Dashboard.jsx:176`.** Share host covers. These break, which is acceptable since Share is retired.

## 3. Custom frame: one shared resolver
New `resolveEventFrame(event)` in `src/lib/framesUtils.js`, cached per `overlay_frame_url`:
- **frames_meta id:** the existing DB lookup (`findApprovedFrameFromDB`).
- **`http…` URL (uploaded custom frame):** build a PNG frame descriptor `{ isPng, image_url, hole_bbox, text_config: null, aspect }`.
  - `hole_bbox` comes from `detectHoleBbox` on the PNG's alpha channel. The PNG is loaded with `crossOrigin='anonymous'` so the canvas isn't tainted.
  - No transparent hole means the full canvas `{0,0,1,1}`: the photo fills the canvas and the overlay sits on top.
  - Aspect comes from the PNG's dimensions.
- **Nothing assigned:** the name-based pack fallback, as today (the pack is currently empty).

Print path (`src/lib/magnetPrint.js`):
- The stored guest composite already has the frame baked in. It is printed **as-is**, with no second overlay: `applyOverlayFrame(url, null, copies)`.
- The operator re-crop path re-composites the raw photo + crop + the same resolved frame, so the frame is applied exactly once on both paths.

Files: `framesUtils.js` (resolver), `compositePngFrame.js` (export its cached CORS-safe loader for detection), `MagnetCamera.jsx`, `MagnetReview.jsx` (preview + submit), `magnetPrint.js`, `CropEditor.jsx` (import only).

Jobs queued before deploy keep the composite they were submitted with. They print once, but with the old fallback frame rather than the custom one.

## 4. Station failures → Hebrew toasts
I'll use the existing `toast` from `@/components/ui/use-toast` with `variant: 'destructive'`, the same pattern as `FramesModerationQueue`, and send each failure to `reportError`.

| Where | Today | After |
|---|---|---|
| `ProJobCard.doPrint`, `MagnetProStation.advance` (fast-print) | non-popup print error → still advances to `printing` | any print error → status unchanged + toast "ההדפסה נכשלה — הסטטוס לא שונה. נסו שוב." |
| fast-print `POPUP_BLOCKED` | silent return | toast "הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים ונסו שוב." |
| status update fails after a successful print | swallowed | toast "ההדפסה נשלחה אך עדכון הסטטוס נכשל — אל תדפיסו שוב, רעננו את הרשימה." (prevents a re-print) |
| `ready` / `rejected` / copies stepper updates | swallowed | toast, local state left unchanged |
| `markAllReady` (`usePrintQueue`) | Sentry only | toast + re-fetch the queue (a partial `Promise.all` failure leaves local state stale today) |

I'm also adding a per-job in-flight guard on keyboard fast-print. Today a double Space/Enter press prints the same job twice.

Files: `ProJobCard.jsx`, `MagnetProStation.jsx`, `usePrintQueue.js`.

## 5. `events.getByCode` column list
Replace `select('*')` with an explicit list. `pin_code` and `co_hosts` are dropped (D2 has the exact list).
**Limitation:** this is not a security boundary. `events_select_public` lets anyone holding the public anon key run `select=pin_code,co_hosts` on every active event. The real fix is dropping those columns in retirement Phase 2b. An RPC with a narrowed `events` SELECT policy would also work, but it cascades into the photos, storage and print_jobs policies that read `events`. File: `memoriaService.jsx`.

## 6. Decisions needed
- **D1 — Lead cover upload (Magnet sales funnel).** (a) **Recommended:** MagnetLead signs in anonymously and uploads to `leads/{auth.uid()}/`, plus a policy allowing only the user's own `leads/{uid}/` folder. (b) Drop the cover-upload step.
- **D2 — `getByCode` fields.** **Recommended:** Magnet fields (`id, name, date, cover_image, overlay_frame_url, print_quota_per_device, event_type, is_active, unique_code`) plus the non-sensitive fields live Share galleries still read (`created_by, max_uploads_per_user, upload_closure_datetime, auto_publish_guest_photos, guest_tier`). These get removed in Phase 1. The only Share loss is legacy email co-hosts being recognised inside the gallery; their Dashboard still works. Alternative: Magnet fields only, which breaks the Share gallery quota and moderation now.
- **D3 — Photos policy bug (HIGH, found while planning; I recommend adding it to this migration).** `photos_select_owner`, `photos_select_viewer`, `photos_update_owner` and `photos_delete_owner` use `WHERE ep.event_id = event_id` inside an `event_permissions ep` subquery. The unqualified `event_id` resolves to `ep.event_id`, so the condition is always true. Anyone holding *any* editor grant can read, update and delete **every photo of every event**, including changing a Magnet photo's `file_url`, which is the image the station prints. Any viewer grant can read every non-hidden photo. This is the same class of bug as the 20260603 fix. The fix qualifies `photos.event_id` in all four. To check exposure: `SELECT role, count(*) FROM event_permissions GROUP BY role;`
- **D4 — Storage upsert.** `uploadOverlay` / `uploadCoverImage` use `x-upsert: true`. Replacing an existing file needs an UPDATE policy on `storage.objects`, and the repo schema has none. If the pre-flight output shows none either, I'll add an admin-only UPDATE policy for `overlays/` and `covers/`. Otherwise replacing a cover or custom frame fails.
- **D5 — Previous step 2 (stop auto-copies).** Same files as §4. Once Query A is back, fold it into this branch as its own commit?

## 7. QA checklist (full version written during implementation: `docs/qa/print-pipeline-hardening.md`)
RLS cases run in the SQL editor inside `BEGIN … ROLLBACK` with `SET LOCAL ROLE` + `request.jwt.claims`. Storage cases run with `fetch` / curl using a real session JWT. Roles: **anon** (no session), **guest** (anonymous session), **guest B** (second anonymous session), **admin**.

| Policy | anon | guest | admin |
|---|---|---|---|
| print_jobs INSERT | any insert → fail | valid job → ok; `copies=20` → fail; `status='ready'` → fail; `crop_config`/`face_count` set → fail; guest B's photo → fail; photo from another event → fail; inactive event → fail; share event → fail; over quota → `PRINT_QUOTA_EXCEEDED` | same rules as a guest; operator UPDATE of copies/status still works |
| storage INSERT | any path → fail | `{active_event_id}/x.jpg` → ok; `general/x.jpg`, `{random_uuid}/`, `{inactive_event_id}/`, `overlays/…`, `covers/…` → fail | `covers/{id}/cover.jpg` → ok; `overlays/{id}/frame.png` → ok |
| getByCode | response has no `pin_code` / `co_hosts` | same | admin pages still show PIN (`events.get`) |

**Custom-frame E2E:** create a magnet event with an uploaded PNG that has a transparent hole. Check the camera viewfinder, the review preview, and the stored composite (one frame each). Station: print from the stored composite (one frame, one magnet). Re-crop, then print (one frame). Repeat with a PNG that has no hole (full-canvas overlay), then with a library frame and with no frame (regression).

## Noticed, out of scope (no change planned)
- `raw_photo_url` and `photos.file_url` are guest-controlled strings. A guest can point them at any external URL, and the station loads and prints it. Option: require the URL to start with this project's `/storage/v1/object/public/photos/{event_id}/`.
- The per-device quota is per anonymous user, so a guest bypasses it by clearing site data. This is inherent to anonymous auth.
