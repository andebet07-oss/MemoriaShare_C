# QA — Print Pipeline Hardening

Roles:
- **anon:** no session (private window).
- **Guest:** anonymous session on `/magnet/<code>`.
- **Lead visitor:** anonymous session on `/magnet/lead`.
- **Google user:** non-admin account.
- **Admin:** account with `profiles.role = 'admin'`.

Run after the migration is applied, against code from branch `claude/lucid-knuth-l1jm0g` (its Vercel preview, or `main` after merge). ☐ = to check.

## A. RLS: print_jobs, photos, events (SQL editor)
☐ Run `docs/qa/print-pipeline-rls-test.sql`. It ends with an intentional error whose message is the results table, and it rolls back its own fixtures. **All 49 lines must read `PASS`.**

Coverage:
- **print_jobs:** guest insert rules (copies / status / crop / face_count / other guest / other event / inactive event / Share event / quota); `raw_photo_url` (own event folder ok; external host or another event's folder denied); admin operator updates.
- **photos SELECT:** a Magnet photo is invisible to anon, to other guests and to an editor of *another* event (the D3 probe); visible to its uploader and to admin, even when hidden or unapproved.
- **photos INSERT:** `file_url` must be our bucket's `{event_id}/{file}` and equal to the public URL of `path`; no pre-filled `file_urls`; no rows in another user's name.
- **photos UPDATE/DELETE:** nobody repoints a URL (`PHOTO_URL_IMMUTABLE`); the D3 editor can't change or delete a Magnet photo.
- **events INSERT:** admin only. **events UPDATE:** only admins can update a Magnet event or turn an event into one (a Share host can't flip `event_type`, and an editor grant on a Magnet event can't change its frame or quota).
- `[regression]` lines confirm the Share behaviour we didn't intend to change.

Local validation (Postgres 16 stand-in; consolidated photos policies *including* the D3 bug, any Google user allowed to create events, live-style `events_update_owner`): 49/49 pass. Before the migration, the same stand-in let anon read a Magnet photo, let an editor of another event repoint one to an external URL, and let a non-admin flip a Share event to Magnet.

## B. `photos` bucket (browser console on the live site)
Paste once per tab. Take the project URL and anon key from Dashboard → Project Settings → API.
```js
const SUPABASE_URL = 'https://<ref>.supabase.co';
const ANON_KEY = '<anon key>';
const k = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
const session = k && JSON.parse(localStorage.getItem(k));
const jwt = session?.access_token || ANON_KEY;          // no session → anon
const uid = session?.user?.id;
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
| anon | `tryUpload('leads/qa.jpg')` | ☐ DENIED |
| guest | `tryUpload('<ACTIVE_EVENT_ID>/qa-guest.jpg')` | ☐ ALLOWED |
| guest | `tryUpload('general/qa.jpg')` | ☐ DENIED (outside an event folder) |
| guest | `tryUpload(crypto.randomUUID() + '/qa.jpg')` | ☐ DENIED |
| guest | `tryUpload('<INACTIVE_EVENT_ID>/qa.jpg')` | ☐ DENIED |
| guest | `tryUpload('qa-root.jpg')` | ☐ DENIED |
| guest | `tryUpload('overlays/<ACTIVE_EVENT_ID>/qa.png')` | ☐ DENIED |
| guest | `tryUpload('covers/<ACTIVE_EVENT_ID>/qa.jpg')` | ☐ DENIED |
| lead visitor | `tryUpload(\`leads/${uid}/qa.jpg\`)` | ☐ ALLOWED |
| lead visitor | `tryUpload(\`leads/${crypto.randomUUID()}/qa.jpg\`)` | ☐ DENIED |
| admin (`/admin`) | `tryUpload('covers/<ACTIVE_EVENT_ID>/qa.jpg')`, then again with `upsert = true` | ☐ ALLOWED, ☐ ALLOWED (new UPDATE policy) |
| admin | `tryUpload('overlays/<ACTIVE_EVENT_ID>/qa.png', true)` | ☐ ALLOWED |
| admin | `tryUpload('general/qa.jpg')` | ☐ DENIED |

Clean-up: delete the `qa*` objects in Dashboard → Storage → photos. The resize webhook may log a "no photos row" miss for test files in event folders; that's harmless.
Local stand-in: 17/17 (direct `storage.objects` inserts as each role).

**Known gap, not closed by this migration — check it:**
```js
await (await fetch(`${SUPABASE_URL}/storage/v1/object/list/photos`, { method: 'POST',
  headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: '<MAGNET_EVENT_ID>/', limit: 100 }) })).json()
```
If this returns file names, anyone can still enumerate an event's files through the Storage list API (`storage_photos_select_public`). Closing it needs a live check first: the storage service may need SELECT on rows it inserts. See plan §Follow-ups.

## C. No automatic over-printing + real guest submission
☐ Real guest submission → `SELECT copies, face_count, raw_photo_url FROM print_jobs ORDER BY created_at DESC LIMIT 1;` returns `copies = 1`, `face_count = NULL`.
☐ **`raw_photo_url` is NOT NULL**, and it starts with the prefix the migration printed followed by `{event_id}/`. If it is null, check Sentry for `MagnetReview.rawUpload` and run Q5.
☐ `SELECT file_url, path FROM photos ORDER BY created_date DESC LIMIT 1;` has `file_url = <prefix> || path`.
☐ After ~1 min, `photos.file_urls` is filled by the resize webhook. The guard must not block it: it runs as service_role.
☐ Station: the card shows `עותקים 1` and no face-count chip. Nothing changes `copies` on its own (wait 10 s, reload).
☐ Fast-print (Space): the pop-up holds **one** image / one page. The job moves to `בהדפסה`.
☐ Stepper +1, reload: still 2. Fast-print now prints 2 pages.
☐ The 2 July jobs show `copies = 1`.

## D. Custom frame end to end
☐ Admin: create a Magnet event with an uploaded PNG **with** a transparent hole.
☐ Guest camera: the viewfinder shows that PNG with the live feed inside its hole, not the default polaroid.
☐ Review: the preview shows the custom frame once. After submit, open `photos.file_url`: exactly one frame.
☐ Station, no re-crop: print → one frame, no stretched overlay.
☐ Station, re-crop: print → one frame, crop applied.
☐ Repeat with a PNG **without** transparency: the photo fills the canvas and the PNG sits on top, once.
☐ Regression: a library frame (frames_meta id), and an event with no frame.
☐ Admin: replace the custom frame / cover on an existing event (upsert) → succeeds.
☐ Network-block the frame URL (DevTools request blocking), then submit → error screen, not a frameless print.

## E. Station failure handling
☐ DevTools → Network → Offline, then Space on a pending job → toast "ההדפסה נכשלה — הסטטוס לא שונה…", status stays `ממתין`.
☐ Block pop-ups, then Space → pop-up toast, status unchanged.
☐ Block only `PATCH …/print_jobs` (request blocking), then print → the job prints, toast "ההדפסה נשלחה אך עדכון הסטטוס נכשל — אל תדפיסו שוב…", status unchanged.
☐ Offline, then the copies stepper / ready / reject → toast; values unchanged after reload.
☐ Press Space twice quickly on one job → one print pop-up.
☐ Offline, then "סמן הכל כמוכן" → toast; the list re-fetches.

## F. Lead wizard (D1)
☐ Private window → `/magnet/lead` → step 2 → upload a cover → the preview shows it. The object is under `leads/<uid>/`.
☐ Offline, then upload → Hebrew error "העלאת התמונה נכשלה — נסו שוב".
☐ Submit the lead → the row appears in admin Leads with the cover URL.

## F2. Home and anonymous sessions (`37f2f2a`, CTA commit)
☐ Home: "צרו אירוע" in the header (desktop and mobile menu), the hero, the final CTA and the demo modal all go straight to `/magnet/lead`, with no chooser.
☐ After uploading a lead cover (anonymous session), back on Home: the header shows "כניסה", not "האירועים שלי" or logout.
☐ Same browser → `/host`: the sign-in screen, not an empty "האירועים שלי".
☐ `/host/events/create` and `/CreateEvent`: signed-out, anonymous and non-admin Google users land on `/magnet/lead`; an admin lands on `/admin/events/magnet/create`. A spinner may show while the role loads, but an admin never lands on the lead wizard.
☐ MyEvents (non-admin Google user) → "אירוע חדש" → `/magnet/lead`. As admin → the magnet event wizard.
☐ Admin signs in from that same browser via "כניסה" → `/admin` works.

## G. Events and `getByCode`
☐ Google non-admin account: creating an event fails (expected: Share self-service is retired).
☐ Admin: create a Magnet event (including cover + custom frame) → succeeds.
☐ (After item 5 / D2) Guest on `/magnet/<code>`: the `events?select=…` response has no `pin_code` / `co_hosts`.
