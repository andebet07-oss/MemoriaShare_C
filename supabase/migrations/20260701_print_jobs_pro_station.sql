-- ============================================================
-- print_jobs — Pro Station columns (copies, face_count, crop, raw photo)
-- Applied to live DB: <PENDING>
-- ============================================================
--
-- Adds the columns the MagnetProStation operator UI needs:
--   copies        — how many physical magnets to print for this ONE queue row.
--                   Auto-suggested from face detection (1 copy per person),
--                   operator-overridable. NEVER creates extra print_jobs rows.
--   face_count    — number of faces detected in the photo (null = not yet analyzed).
--   crop_config   — operator's face-centered re-crop { aspect, panX, panY, zoom }.
--   raw_photo_url — the un-framed camera capture, so the operator can re-crop and
--                   re-apply the frame. Stored here (NOT in photos.file_urls) because
--                   the thumbnail webhook (api/resize-photo.ts) short-circuits when
--                   photos.file_urls is already populated — pre-filling it would
--                   silently disable magnet thumbnails.
--
-- IMPORTANT — enforce_print_quota() intentionally counts ROWS (not copies):
--   it does  COUNT(*) ... WHERE status != 'rejected'  vs  print_quota_per_device.
--   Operator copy-multiplication changes only `copies`, so the guest quota is
--   unaffected. Do NOT change that trigger to multiply by copies.
-- ============================================================

ALTER TABLE print_jobs
  ADD COLUMN IF NOT EXISTS copies        INTEGER NOT NULL DEFAULT 1
    CHECK (copies BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS face_count    INTEGER,        -- null = not yet analyzed
  ADD COLUMN IF NOT EXISTS crop_config   JSONB,          -- { aspect:'3:4'|'4:3', panX, panY, zoom }
  ADD COLUMN IF NOT EXISTS raw_photo_url TEXT;           -- un-framed source for operator re-crop

-- RLS is unchanged: print_jobs_update_admin already grants admin UPDATE on all
-- columns (operator can set copies/crop_config/face_count), and
-- print_jobs_insert_guest inserts defaults only, so guest + legacy rows get
-- copies=1, face_count=NULL automatically.
