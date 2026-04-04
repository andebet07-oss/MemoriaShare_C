-- ============================================================
-- MemoriaShare — CLEAN RESET SCHEMA
-- Run this in Supabase SQL Editor (Project → SQL Editor).
-- It is fully idempotent: drops everything first, then recreates.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Drop existing objects in safe order ──────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

DROP TABLE IF EXISTS upload_diagnostics CASCADE;
DROP TABLE IF EXISTS photos             CASCADE;
DROP TABLE IF EXISTS events             CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

-- ── Storage bucket ────────────────────────────────────────────
-- Drop old storage policies before recreating
DO $$
BEGIN
  DROP POLICY IF EXISTS "storage_photos_select_public" ON storage.objects;
  DROP POLICY IF EXISTS "storage_photos_insert_public" ON storage.objects;
  DROP POLICY IF EXISTS "storage_photos_delete_owner"  ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================
-- TABLES
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- Mirrors auth.users; stores the app-level role.
-- NOTE: no UNIQUE on email — auth.users.id is the true primary key.
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── events ───────────────────────────────────────────────────
CREATE TABLE events (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT        NOT NULL,
  unique_code               TEXT        NOT NULL UNIQUE,
  pin_code                  TEXT,
  created_by                UUID        NOT NULL REFERENCES auth.users(id),  -- auth.uid() of owner
  co_hosts                  TEXT[]      NOT NULL DEFAULT '{}',  -- emails; UUID migration deferred
  date                      DATE,                    -- DATE (not TIMESTAMPTZ) to avoid timezone-shifting bugs
  cover_image               TEXT,
  guest_tier                INTEGER     NOT NULL DEFAULT 1,
  max_uploads_per_user      INTEGER     NOT NULL DEFAULT 15,
  upload_closure_datetime   TIMESTAMPTZ,
  auto_publish_guest_photos BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active                 BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── photos ───────────────────────────────────────────────────
CREATE TABLE photos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_url        TEXT,
  path            TEXT,           -- storage path: {event_id}/{timestamp}_{filename}
  file_urls       JSONB,          -- { thumbnail, medium, original }
  guest_name      TEXT,           -- display name entered in Guest Book modal
  guest_greeting  TEXT,           -- optional greeting message to host (from Guest Book modal)
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- auth.uid(); set for all users incl. anonymous
  device_uuid     TEXT,           -- legacy fallback; deprecated in favour of anonymous auth
  filter_applied  TEXT        NOT NULL DEFAULT 'none'
                               CHECK (filter_applied IN ('none','black_white','vintage','warm')),
  is_approved     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_hidden       BOOLEAN     NOT NULL DEFAULT FALSE,
  deletion_status TEXT        NOT NULL DEFAULT 'none'
                               CHECK (deletion_status IN ('none','requested','approved','denied')),
  created_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── upload_diagnostics ───────────────────────────────────────
CREATE TABLE upload_diagnostics (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id           UUID        NOT NULL,
  event_id           UUID        NOT NULL,
  has_file_urls      BOOLEAN,
  has_file_url       BOOLEAN,
  file_urls_snapshot TEXT,
  file_url_snapshot  TEXT,
  guest_name         TEXT,
  diagnosis          TEXT        CHECK (diagnosis IN ('ok','missing_file_urls','missing_both')),
  created_date       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_photos_event_id       ON photos(event_id);
CREATE INDEX idx_photos_event_approved ON photos(event_id, is_approved);
CREATE INDEX idx_photos_created_by     ON photos(created_by);
CREATE INDEX idx_photos_device_uuid    ON photos(device_uuid);
CREATE INDEX idx_events_unique_code    ON events(unique_code);
CREATE INDEX idx_events_created_by     ON events(created_by);

-- ============================================================
-- TRIGGER: auto-create profile on first sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: check admin role without triggering RLS (prevents 42P17 infinite recursion)
-- SECURITY DEFINER bypasses RLS when this function evaluates the role check.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_diagnostics ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "profiles_select_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Super-admin can read ALL profiles (uses is_admin() to avoid 42P17 recursion)
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update_self"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Super-admin can update any profile (uses is_admin() to avoid 42P17 recursion)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Allow trigger / service role to insert (SECURITY DEFINER function bypasses RLS)
-- but we also allow authenticated insert for safety
CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── events ───────────────────────────────────────────────────

-- Active events are public; owners can always see their own (even if deactivated)
CREATE POLICY "events_select_public"
  ON events FOR SELECT
  USING (
    is_active = true
    OR auth.uid() = created_by
  );

-- Only non-anonymous authenticated users (Google OAuth) can create events
-- auth.email() is NULL for anonymous sign-ins, so this blocks guests from creating events
CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.email() IS NOT NULL
  );

-- Creator (by UUID) or co-host (by email, legacy) can update
CREATE POLICY "events_update_owner"
  ON events FOR UPDATE
  USING (
    auth.uid() = created_by
    OR auth.jwt() ->> 'email' = ANY(co_hosts)
  )
  WITH CHECK (
    auth.uid() = created_by
    OR auth.jwt() ->> 'email' = ANY(co_hosts)
  );

-- Only creator can delete
CREATE POLICY "events_delete_owner"
  ON events FOR DELETE
  USING (auth.uid() = created_by);

-- ── photos ───────────────────────────────────────────────────

-- Public view: non-hidden AND (approved OR event has auto-publish on)
CREATE POLICY "photos_select_public"
  ON photos FOR SELECT
  USING (
    is_hidden = false
    AND (
      is_approved = true
      OR EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_id
          AND e.auto_publish_guest_photos = true
      )
    )
  );

-- Users can always see their OWN photos regardless of approval or hidden status
-- Fixes REGRESSION-001: guests must see their own pending uploads in "My Photos" tab
CREATE POLICY "photos_select_own"
  ON photos FOR SELECT
  USING (auth.uid() = created_by);

-- Event owners and co-hosts can read ALL photos (including hidden/unapproved)
CREATE POLICY "photos_select_owner"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          auth.uid() = e.created_by
          OR auth.jwt() ->> 'email' = ANY(e.co_hosts)
        )
    )
  );

-- Any authenticated user (incl. anonymous) can upload; created_by must match their uid
CREATE POLICY "photos_insert_authenticated"
  ON photos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

-- Uploaders can update their own photos (guest_name, filter_applied, guest_greeting).
-- Fixes REGRESSION-002: allows deletion_status='requested' and is_hidden=true.
-- Blocks self-approval: is_approved must never change via this policy.
CREATE POLICY "photos_update_uploader"
  ON photos FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (
    -- Guests can NEVER change their own approval status
    is_approved = (SELECT is_approved FROM photos WHERE id = photos.id)
    -- Guests may only set deletion_status to 'none' or 'requested' (not 'approved'/'denied')
    AND deletion_status IN ('none', 'requested')
  );

-- Event owners and co-hosts can update ALL fields including moderation fields
CREATE POLICY "photos_update_owner"
  ON photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          auth.uid() = e.created_by
          OR auth.jwt() ->> 'email' = ANY(e.co_hosts)
        )
    )
  );

-- Uploader or event owner/co-host can delete
CREATE POLICY "photos_delete_owner"
  ON photos FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          auth.uid() = e.created_by
          OR auth.jwt() ->> 'email' = ANY(e.co_hosts)
        )
    )
  );

-- ── upload_diagnostics ───────────────────────────────────────

CREATE POLICY "upload_diagnostics_insert"
  ON upload_diagnostics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "upload_diagnostics_select"
  ON upload_diagnostics FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── Storage (photos bucket) ───────────────────────────────────

CREATE POLICY "storage_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "storage_photos_insert_public"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "storage_photos_delete_owner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- REALTIME
-- Enable on photos so the gallery receives live-update events.
-- ============================================================
ALTER TABLE photos REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE photos;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
