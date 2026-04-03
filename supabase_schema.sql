-- ============================================================
-- MemoriaShare — Supabase Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor).
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (mirrors auth.users, stores app-level role)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE,
  full_name  TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR auth.jwt() ->> 'email' = 'effitag@gmail.com');

CREATE POLICY "profiles_update_self"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Super-admin can update any profile (for role management)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'effitag@gmail.com');

-- Super-admin can select all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = 'effitag@gmail.com');

CREATE TABLE IF NOT EXISTS events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  unique_code               TEXT NOT NULL UNIQUE,
  pin_code                  TEXT,
  created_by                TEXT NOT NULL,          -- user email
  co_hosts                  TEXT[] DEFAULT '{}',
  date                      TIMESTAMPTZ,
  cover_image               TEXT,
  guest_tier                INTEGER DEFAULT 1,      -- index into GUEST_TIER_LIMITS
  max_uploads_per_user      INTEGER DEFAULT 15,
  upload_closure_datetime   TIMESTAMPTZ,
  auto_publish_guest_photos BOOLEAN DEFAULT FALSE,
  created_date              TIMESTAMPTZ DEFAULT NOW(),
  updated_date              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_url         TEXT,                             -- legacy single URL
  file_urls        JSONB,                            -- { thumbnail, medium, original }
  guest_name       TEXT,
  created_by       TEXT,                             -- user email (null for anonymous)
  device_uuid      TEXT,                             -- fallback for anonymous guests
  filter_applied   TEXT DEFAULT 'none' CHECK (filter_applied IN ('none','black_white','vintage','warm')),
  is_approved      BOOLEAN DEFAULT FALSE,
  is_hidden        BOOLEAN DEFAULT FALSE,
  deletion_status  TEXT DEFAULT 'none' CHECK (deletion_status IN ('none','requested','approved','denied')),
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upload_diagnostics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id            UUID NOT NULL,
  event_id            UUID NOT NULL,
  has_file_urls       BOOLEAN,
  has_file_url        BOOLEAN,
  file_urls_snapshot  TEXT,
  file_url_snapshot   TEXT,
  guest_name          TEXT,
  diagnosis           TEXT CHECK (diagnosis IN ('ok','missing_file_urls','missing_both')),
  created_date        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_photos_event_id         ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_approved   ON photos(event_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_photos_created_by       ON photos(created_by);
CREATE INDEX IF NOT EXISTS idx_photos_device_uuid      ON photos(device_uuid);
CREATE INDEX IF NOT EXISTS idx_events_unique_code      ON events(unique_code);
CREATE INDEX IF NOT EXISTS idx_events_created_by       ON events(created_by);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run via Supabase Dashboard: Storage → New Bucket → "photos"
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_diagnostics ENABLE ROW LEVEL SECURITY;

-- ── Events ───────────────────────────────────────────────────

-- Anyone can read events (needed for guest entry via unique_code)
CREATE POLICY "events_select_public"
  ON events FOR SELECT
  USING (true);

-- Authenticated users can create events
CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only creator (or co-host) can update
CREATE POLICY "events_update_owner"
  ON events FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = created_by
    OR auth.jwt() ->> 'email' = ANY(co_hosts)
  );

-- Only creator can delete
CREATE POLICY "events_delete_owner"
  ON events FOR DELETE
  USING (auth.jwt() ->> 'email' = created_by);

-- ── Photos ───────────────────────────────────────────────────

-- Anyone can read non-hidden photos (public gallery)
CREATE POLICY "photos_select_public"
  ON photos FOR SELECT
  USING (is_hidden = false);

-- Anyone can upload photos (guests can upload without auth)
CREATE POLICY "photos_insert_public"
  ON photos FOR INSERT
  WITH CHECK (true);

-- Uploader (by email or device_uuid) can update their own photos
CREATE POLICY "photos_update_owner"
  ON photos FOR UPDATE
  USING (
    (created_by IS NOT NULL AND auth.jwt() ->> 'email' = created_by)
    OR (device_uuid IS NOT NULL AND device_uuid = current_setting('request.headers', true)::json->>'x-device-uuid')
  );

-- Uploader or event owner can delete
CREATE POLICY "photos_delete_owner"
  ON photos FOR DELETE
  USING (
    auth.jwt() ->> 'email' = created_by
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          auth.jwt() ->> 'email' = e.created_by
          OR auth.jwt() ->> 'email' = ANY(e.co_hosts)
        )
    )
  );

-- ── Upload Diagnostics ────────────────────────────────────────

-- Only authenticated can insert diagnostics
CREATE POLICY "upload_diagnostics_insert"
  ON upload_diagnostics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated can read diagnostics
CREATE POLICY "upload_diagnostics_select"
  ON upload_diagnostics FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── Storage RLS ───────────────────────────────────────────────

-- Public can read from photos bucket
CREATE POLICY "storage_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Anyone can upload to photos bucket
CREATE POLICY "storage_photos_insert_public"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

-- Only uploader can delete their own files
CREATE POLICY "storage_photos_delete_owner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable Realtime on photos table so guests receive live updates.
-- Run in Supabase Dashboard: Database → Replication → photos ✓
-- Or via SQL:
ALTER TABLE photos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE photos;
