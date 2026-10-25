# QA — Print Pipeline Hardening

Roles: **anon** = no session (private window). **Guest** = anonymous session on `/magnet/<code>`. **Admin** = Google account with `profiles.role = 'admin'`.
Run after the migration is applied and after the matching code is deployed. ☐ = to check.

## A. `print_jobs` INSERT/UPDATE RLS (SQL editor)
☐ Run `docs/qa/print-pipeline-rls-test.sql`. It ends with an intentional error whose message is the results table; all 16 lines must read `PASS`. Fixtures are rolled back.
Covers: anon insert; guest valid job; `copies=20`; `status='ready'`; `crop_config` / `face_count` set; job in another guest's name; another guest's photo; own photo from another event; inactive event; share event; guest UPDATE; over quota; admin creating a job for a guest; admin UPDATE of copies and status.
(Before the migration, the same script reports 8 FAILs. That's how it was validated locally.)

## B. `photos` bucket (browser console on the live site)
Paste once per tab. Fill in the project URL and anon key from Dashboard → Project Settings → API.
```js
const SUPABASE_URL = 'https://<ref>.supabase.co';
const ANON_KEY = '<anon key>';
const k = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
const jwt = (k && JSON.parse(localStorage.getItem(k))?.access_token) || ANON_KEY; // no session → anon
async function tryUpload(path, upsert = false) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, apikey: ANON_KEY, 'Content-Type': 'image/jpeg', 'x-upsert': String(upsert) },
    body: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
  });
  console.log(r.ok ? 'ALLOWED' : 'DENIED', r.status, path, r.ok ? '' : await r.text());
}
```
| Role | Call | Expect |
|---|---|---|
| anon (private window, `/`) | `tryUpload('<ACTIVE_EVENT_ID>/qa-anon.jpg')` | ☐ DENIED |
| guest | `tryUpload('<ACTIVE_EVENT_ID>/qa-guest.jpg')` | ☐ ALLOWED |
| guest | `tryUpload('general/qa.jpg')` | ☐ DENIED (outside an event folder) |
| guest | `tryUpload(crypto.randomUUID() + '/qa.jpg')` | ☐ DENIED |
| guest | `tryUpload('<INACTIVE_EVENT_ID>/qa.jpg')` | ☐ DENIED |
| guest | `tryUpload('qa-root.jpg')` | ☐ DENIED |
| guest | `tryUpload('overlays/<ACTIVE_EVENT_ID>/qa.png')` | ☐ DENIED |
| guest | `tryUpload('covers/<ACTIVE_EVENT_ID>/qa.jpg')` | ☐ DENIED |
| admin (`/admin`) | `tryUpload('covers/<ACTIVE_EVENT_ID>/qa.jpg')` then again with `upsert = true` | ☐ ALLOWED, ☐ ALLOWED (needs the new UPDATE policy) |
| admin | `tryUpload('overlays/<ACTIVE_EVENT_ID>/qa.png', true)` | ☐ ALLOWED |
| admin | `tryUpload('general/qa.jpg')` | ☐ DENIED |

Clean-up: delete the `qa-*` / `qa.*` objects in Dashboard → Storage → photos. The resize webhook may log a "no photos row" miss for the event-folder test files; that's harmless.
The local Postgres run of the same cases (direct `storage.objects` inserts as each role) passed 13/13.

## C. Stage 0: no automatic over-printing (code commit `15f9fbb`)
☐ Real guest submission → `SELECT copies, face_count, raw_photo_url FROM print_jobs ORDER BY created_at DESC LIMIT 1;` returns `copies = 1`, `face_count = NULL`.
☐ **`raw_photo_url` is NOT NULL.** If it is null, check Sentry for `MagnetReview.rawUpload` and run query Q5 (plan §0). The raw upload is designed to fail silently for the guest; the station's crop button is then disabled.
☐ Station: the card shows `עותקים 1` and no face-count chip, and nothing changes `copies` on its own (wait 10 s, reload).
☐ Fast-print: select the job and press Space. The print popup holds **one** image / one page. The job moves to `בהדפסה`.
☐ Stepper: +1 → reload → still 2 (persisted). Fast-print now prints 2 pages.
☐ The 2 reset jobs from July show `copies = 1`.

## D. Custom frame end to end (after plan §3 is implemented)
☐ Admin: create a magnet event with an uploaded PNG that has a transparent hole.
☐ Guest camera: the viewfinder shows the custom frame with the live feed inside the hole, not the default frame.
☐ Review: the preview shows the custom frame once; after submit, the stored composite (`photos.file_url`) has exactly one frame.
☐ Station: print the job without a re-crop. The popup shows the stored composite with exactly one frame and no stretched overlay.
☐ Station: re-crop, then print. One frame, the crop is applied.
☐ Repeat with a PNG **without** transparency (full-canvas overlay), with a library frame (frames_meta id), and with no frame (regression).
☐ Admin: replace the custom frame on an existing event (upsert) → it succeeds.

## E. Station failure handling (after plan §4 is implemented)
☐ DevTools → Network → Offline, then Space on a pending job → Hebrew toast, status stays `ממתין`.
☐ Block pop-ups, then Space → toast about pop-ups, status unchanged.
☐ Make the status update fail after a successful print → toast "ההדפסה נשלחה אך עדכון הסטטוס נכשל…".
☐ Offline + copies stepper / ready / reject → toast; values unchanged after reload.
☐ Double Space on one job → only one print popup.

## F. `events.getByCode` (after plan §5 is implemented)
☐ Guest on `/magnet/<code>` → DevTools Network → the `events?select=…` response has no `pin_code` or `co_hosts`.
☐ Admin event dashboard still shows the PIN (it uses `events.get`).
Known limitation: anyone with the public key can still request those columns directly until they're dropped (Share retirement Phase 2b).
