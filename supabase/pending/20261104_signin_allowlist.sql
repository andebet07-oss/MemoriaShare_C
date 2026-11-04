-- ============================================================
-- Only listed accounts can sign in — event guests (anonymous) are unaffected
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Owner's decision (2026-11-04): nobody but the two admins may sign in, until the owner adds
-- someone to the database. Today any Google account (or an email + password sign-up through
-- the API: the Email provider is on with auto-confirm) creates an account; it only stops at
-- the "no admin rights" screen.
--
-- 1. public.signin_allowlist: the emails that may create an account. Seeded with the current
--    admins. To let someone in later: add their email here (Table Editor), then, after their
--    first sign-in, set their role in public.profiles.
-- 2. public.hook_before_user_created(): a Supabase Auth "Before User Created" hook. It refuses
--    any new non-anonymous account whose email is not on the list. Anonymous accounts (guests
--    at events) always pass, before any table is read.
-- 3. Existing accounts that are not on the list are banned (auth.users.banned_until), so they
--    cannot sign in again either. Reversible (see ROLLBACK). Phase 2b deletes them once the
--    Share backup is done (one of them owns 2 Share events).
--
-- AFTER RUNNING THIS FILE, turn the hook on in the dashboard:
--   Authentication → Auth Hooks → Add hook → "Before User Created"
--   → Postgres → schema public → function hook_before_user_created → Create.
-- While the hook is on, never drop or rename the function: Supabase Auth would then refuse
-- EVERY new account, guests included.
--
-- QA after applying: docs/qa/signin-allowlist-test.sql. Rollback: end of this file.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.signin_allowlist') IS NOT NULL THEN
    RAISE EXCEPTION 'public.signin_allowlist already exists';
  END IF;
  IF to_regprocedure('public.hook_before_user_created(jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'public.hook_before_user_created(jsonb) already exists';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    RAISE EXCEPTION 'role supabase_auth_admin is missing';
  END IF;
END $$;

-- ── 1. The list ───────────────────────────────────────────────
CREATE TABLE public.signin_allowlist (
  email      text PRIMARY KEY CHECK (position('@' IN email) > 1),
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.signin_allowlist IS
  'Emails allowed to create an account (Google / email sign-in). Read by the Before User Created auth hook. Anonymous event guests are never checked.';

ALTER TABLE public.signin_allowlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.signin_allowlist FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.signin_allowlist TO supabase_auth_admin;
CREATE POLICY signin_allowlist_read_auth ON public.signin_allowlist
  FOR SELECT TO supabase_auth_admin USING (true);

INSERT INTO public.signin_allowlist (email, note)
SELECT lower(btrim(u.email)), 'admin when the list was created'
FROM auth.users u JOIN public.profiles p ON p.id = u.id
WHERE p.role = 'admin' AND NOT u.is_anonymous AND coalesce(btrim(u.email), '') <> '';

-- ── 2. The hook ───────────────────────────────────────────────
-- Not SECURITY DEFINER (Supabase's advice for hooks): it runs as supabase_auth_admin,
-- which reads the list through the grant + policy above.
CREATE FUNCTION public.hook_before_user_created(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_user  jsonb := event -> 'user';
  v_email text  := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
BEGIN
  -- Event guests: anonymous, no email. Let them through before anything that could fail.
  IF v_user ->> 'is_anonymous' = 'true' OR v_email = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  IF EXISTS (SELECT 1 FROM public.signin_allowlist a WHERE lower(btrim(a.email)) = v_email) THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'This account is not allowed to sign in to Memoria.'));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- ── 3. Existing accounts that are not on the list ─────────────
UPDATE auth.users u
SET banned_until = '2999-12-31 00:00:00+00'
WHERE NOT u.is_anonymous
  AND NOT EXISTS (SELECT 1 FROM public.signin_allowlist a WHERE a.email = lower(btrim(u.email)));

DO $$
DECLARE
  v_listed int := (SELECT count(*) FROM public.signin_allowlist);
  v_banned int := (SELECT count(*) FROM auth.users WHERE banned_until = '2999-12-31 00:00:00+00');
BEGIN
  IF v_listed = 0 THEN
    RAISE EXCEPTION 'no admin email found: the list would lock everyone out';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id = u.id
             WHERE p.role = 'admin' AND u.banned_until IS NOT NULL) THEN
    RAISE EXCEPTION 'an admin would be banned';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE is_anonymous AND banned_until IS NOT NULL) THEN
    RAISE EXCEPTION 'a guest (anonymous) account would be banned';
  END IF;
  RAISE NOTICE 'signin_allowlist: % emails; % existing accounts banned', v_listed, v_banned;
END $$;

COMMIT;

-- ============================================================
-- ROLLBACK (only if needed; lets any Google account sign in again):
-- FIRST turn the hook off: Authentication → Auth Hooks → Before User Created → Delete.
-- Then:
-- BEGIN;
-- UPDATE auth.users SET banned_until = NULL WHERE banned_until = '2999-12-31 00:00:00+00';
-- DROP FUNCTION public.hook_before_user_created(jsonb);
-- DROP TABLE public.signin_allowlist;
-- COMMIT;
-- ============================================================
