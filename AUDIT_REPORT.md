# Memoria V2 — Comprehensive Audit Report

> Generated: April 2026 · Scope: Dual-product architecture (MemoriaShare + MemoriaMagnet)

---

## P0 — CRITICAL

### SEC-01: Print quota not enforced server-side  ✅ RESOLVED (2026-05-11)
**Status:** Implemented in `CLEAN_RESET_SCHEMA.sql` lines 209-243 and re-applied via `supabase/migrations/20260424_enforce_quota_and_storage.sql`. Trigger also hardened with `pg_advisory_xact_lock` to close the concurrent-insert race not covered by the original fix proposal.
**Pillar:** Security & RLS
**Issue:** `print_jobs_insert_guest` RLS policy only validates `auth.uid() = guest_user_id`. There is zero server-side enforcement of `print_quota_per_device`. A malicious guest can call the REST API directly and insert unlimited print jobs, bypassing the client-side `checkPrintQuota` guard.
**Fix:** Add a `BEFORE INSERT` trigger on `print_jobs`:
```sql
CREATE OR REPLACE FUNCTION enforce_print_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM print_jobs
      WHERE event_id = NEW.event_id
        AND guest_user_id = NEW.guest_user_id
        AND status != 'rejected')
     >= (SELECT print_quota_per_device FROM events WHERE id = NEW.event_id)
  THEN
    RAISE EXCEPTION 'PRINT_QUOTA_EXCEEDED';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_enforce_print_quota
  BEFORE INSERT ON print_jobs
  FOR EACH ROW EXECUTE FUNCTION enforce_print_quota();
```

---

### SEC-02: Overlay frame path publicly writable  ✅ RESOLVED (2026-05-11)
**Status:** Implemented in `CLEAN_RESET_SCHEMA.sql` lines 455-478 (policies `storage_photos_insert_public` + `storage_overlays_insert_admin`) and re-applied via `supabase/migrations/20260424_enforce_quota_and_storage.sql`.
**Pillar:** Security & RLS
**Issue:** `storage_photos_insert_public` allows ANY authenticated user to upload to the `photos` bucket, including `overlays/{eventId}/frame.png`. A guest who knows an event ID can overwrite the admin's overlay frame.
**Fix:** Add a dedicated storage policy that restricts writes to the `overlays/` prefix to admin users only:
```sql
-- Restrict overlays/ to admin
CREATE POLICY "storage_overlays_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = 'overlays'
    AND is_admin()
  );
```
Then tighten `storage_photos_insert_public` to exclude the `overlays/` prefix:
```sql
CREATE POLICY "storage_photos_insert_public"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] != 'overlays'
  );
```

---

### BUG-01: Orphaned photo on print job failure  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/components/magnet/MagnetReview.jsx::compositeAndSubmit()` (lines 234, 286, 287, 293) — not `MagnetCamera.captureAndPrint()` as the audit claimed (no such function exists; MagnetCamera hands a data URL to MagnetReview, which owns the upload→photo→printJob chain). `let photo = null` is declared outside the try, and the catch block calls `memoriaService.photos.delete(photo.id).catch(() => {})` if a photo was created before printJobs.create threw (including the new `PRINT_QUOTA_EXCEEDED` exception from SEC-01).
**Pillar:** Business Logic
**Issue:** In `MagnetCamera.captureAndPrint()`, three sequential async calls occur: `storage.upload()` → `photos.create()` → `printJobs.create()`. If upload + photo succeed but print job insert fails (network error, server-side quota rejection from SEC-01 fix), an orphaned photo record exists with `is_approved: true` and no linked print job.
**Fix:** Wrap the capture flow in a compensating cleanup:
```js
// In MagnetCamera.captureAndPrint() catch block:
catch (err) {
  // If photo was created but print job failed, delete the orphan
  if (photo?.id) {
    memoriaService.photos.delete(photo.id).catch(() => {});
  }
  ...
}
```

---

### BUG-02: Vintage filter not applied to captured image
**Pillar:** UI/UX
**Issue:** `MagnetCamera` applies `CSS filter: sepia(0.4) contrast(0.85)...` to the live `<video>` preview. But `captureAndPrint()` draws the raw video frame to canvas WITHOUT applying the vintage pixel manipulation. Guest sees a vintage-tinted preview but the printed photo has no filter — silent mismatch.
**Fix:** Before `ctx.drawImage()`, set `ctx.filter = vintageStyle` (same value as the CSS filter string). This works in all modern browsers:
```js
ctx.save();
if (isVintage) ctx.filter = vintageStyle;
if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
ctx.restore();
```

---

## P1 — HIGH

### BUG-03: Guest status modal shows no thumbnails  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/components/memoriaService.jsx:363` — both `printJobs.getByUser` and `printJobs.getByEvent` use `.select('*, photos(file_url, file_urls, guest_name)')`. Consumer `PrintStatusModal.jsx:36` correctly prefers `file_urls.thumbnail` over `file_url`.
**Pillar:** Business Logic
**Issue:** `memoriaService.printJobs.getByUser()` uses `.select('*')` without joining the `photos` table. `PrintStatusModal` accesses `job.photos?.file_url` which is always `undefined`. Every job card falls back to the `#{i + 1}` placeholder.
**Fix:** Change `getByUser` to join photos, matching the `getByEvent` pattern:
```js
.select('*, photos(file_url, file_urls, guest_name)')
```

---

### BUG-04: Guest print status never updates in real-time  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/pages/MagnetGuestPage.jsx:34-57` — scoped channel `guest-prints-${event.id}-${user.id}`, server-side `event_id=eq.` filter, client-side `guest_user_id` guard, cleanup on unmount.
**Pillar:** Business Logic
**Issue:** `MagnetGuestPage` has no Supabase realtime subscription on `print_jobs`. When the operator changes a job status from 'pending' → 'printing' → 'ready', the guest only sees the old state. Updates require a page refresh or camera re-open.
**Fix:** Add a realtime subscription in `MagnetGuestPage`:
```js
useEffect(() => {
  if (!user?.id || !event?.id) return;
  const channel = supabase
    .channel(`guest-prints-${event.id}-${user.id}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'print_jobs',
      filter: `event_id=eq.${event.id}`
    }, (payload) => {
      if (payload.new.guest_user_id === user.id) {
        setPrintJobs(prev => prev.map(j =>
          j.id === payload.new.id ? { ...j, ...payload.new } : j
        ));
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [user?.id, event?.id]);
```

---

### BUG-05: Quota fallback default mismatch  ✅ RESOLVED (2026-05-11)
**Status:** Already fixed in `src/pages/MagnetGuestPage.jsx:83` — `(event.print_quota_per_device ?? 5)`.
**Pillar:** Business Logic
**Issue:** `MagnetGuestPage` line 55 uses `(event.print_quota_per_device ?? 3)` but the DB default was changed to `5`. If the column is null (shouldn't happen with NOT NULL, but defensive), the client shows 3 remaining instead of 5.
**Fix:** Change to `?? 5`.

---

### SEC-03: PrintStation doesn't validate event_type  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/pages/PrintStation.jsx:44-56` — `if (event.event_type !== 'magnet') return <error UI>` with Hebrew copy ("אירוע לא תואם").
**Pillar:** Security
**Issue:** `/PrintStation/:eventId` accepts any event UUID. An admin could accidentally open a Share event in the Print Station, creating confusion.
**Fix:** Add guard in `PrintStation.jsx`: `if (event.event_type !== 'magnet') return <error UI>`.

---

### PERF-01: PrintQueue full re-fetch on every INSERT  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/components/magnet/PrintQueue.jsx:35-45` — optimistic insert with `photos: null` placeholder + dedupe-by-id, then background `fetchJobs()` to hydrate the join.
**Pillar:** Performance
**Issue:** Realtime INSERT handler in `PrintQueue.jsx` calls `fetchJobs()` (full DB fetch with joined photos) because the realtime payload doesn't include the join. At 100+ jobs this adds latency.
**Fix:** Optimistic insert with placeholder, then background refresh:
```js
if (payload.eventType === 'INSERT') {
  setJobs(prev => [...prev, { ...payload.new, photos: null }]);
  fetchJobs(); // background refresh to get joined data
}
```

---

## P2 — ENHANCEMENTS

### UX-01: No admin nav link to AdminDashboard  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `src/components/home/Header.jsx:72-75` (desktop) and `:156-160` (mobile) — `<Link to="/admin">` with `ShieldCheck` icon, gated on `user?.role === 'admin'`.
**Issue:** `/AdminDashboard` is only reachable by typing the URL. No header/nav link exists for admin users.
**Fix:** Add link in `Header.jsx` (where the AdminUsers link already conditionally renders for `role === 'admin'`).

---

### UX-02: MagnetLead form accepts past dates  ✅ RESOLVED (2026-05-11)
**Status:** No longer applicable — `MagnetLead` uses a custom `InlineCalendar` (not `<input type="date">`). In `src/pages/MagnetLead.jsx:253-258`, `isPast(d)` blocks past dates: `handleDay` returns early, and past cells render with `pointer-events-none` (line 281) and dimmed text.
**Issue:** The event_date `<input type="date">` has no `min` attribute. Users can submit leads with past event dates.
**Fix:** Add `min={new Date().toISOString().split('T')[0]}` to the date input.

---

### UX-03: Race condition on rapid shutter taps  ✅ RESOLVED (2026-05-11)
**Status:** Implemented in `src/components/magnet/MagnetCamera.jsx` — added `capturedCountRef` (synchronous useRef counter), incremented inside `handlePrintJobCreated()` and reset by a `useEffect` that watches the `remainingPrints` prop. Both the quota check inside `handleCapture` and the `isDisabled` derivation use `(remainingPrints - capturedCountRef.current)`. Closes the race window between confirmed print job creation and parent's async `fetchPrintJobs()` settling. NB: incremented on confirmed creation (not on shutter tap as the audit literally prescribed) so a retake doesn't consume quota.
**Issue:** The `isSubmitting` guard prevents double-capture, but `remainingPrints` is a derived prop that updates asynchronously after `fetchPrintJobs()`. A fast double-tap before the async re-render could start two captures.
**Fix:** Already mitigated by `isSubmitting`. For extra safety, add local `capturedCountRef` that increments synchronously on each capture start.

---

### UX-04: No admin override on events_update_owner RLS  ✅ RESOLVED (2026-05-11)
**Status:** Already implemented in `CLEAN_RESET_SCHEMA.sql:308-319` — both USING and WITH CHECK clauses of `events_update_owner` include `OR is_admin()`.
**Issue:** The `events_update_owner` policy only allows creator or co-hosts. A global admin cannot update events they didn't create. Currently safe because admin creates all Magnet events.
**Fix (future-proofing):** Add `OR is_admin()` to both USING and WITH CHECK clauses of `events_update_owner`.

---

### UX-05: Leads table open to spam  ✅ RESOLVED (2026-05-11)
**Status:** Implemented via `supabase/migrations/20260425_leads_rate_limit.sql` + reflected in `CLEAN_RESET_SCHEMA.sql`. BEFORE INSERT trigger `trg_check_lead_rate_limit` on `leads` raises `LEAD_RATE_LIMIT_EXCEEDED` if the same phone has ≥3 inserts in the last hour. `SECURITY DEFINER` + `SET search_path = public` so the COUNT bypasses `leads_select_admin` for anonymous public-form callers. Supporting index `idx_leads_phone_created_at` keeps the lookup O(log n).
**Issue:** `leads_insert_public` has `WITH CHECK (true)` — anyone can insert unlimited leads without authentication.
**Fix:** Add a rate-limiting Edge Function or Postgres function that limits inserts per IP/phone per hour.

---

*End of audit. Execute fixes in priority order: P0 first, then P1, then P2.*
