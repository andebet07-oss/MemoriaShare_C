-- ============================================================
-- Protect profiles.role — security fix
-- Applied to live DB: <PENDING>   (lives in supabase/pending/ until applied; see README there)
-- ============================================================
--
-- Found in the 2026-11-04 audit. On live, any signed-in user could make themselves admin:
--   - profiles_update lets a user update their own row, with no column limit and no WITH CHECK;
--   - profiles_insert_self lets a user create their own row (anonymous guests have none);
--   - anon/authenticated hold INSERT and UPDATE on every column, and profiles had no trigger.
-- So an anonymous guest who scanned a QR code could insert a profile with role = 'admin' and
-- pass is_admin() everywhere: leads, events, print jobs, the studio.
-- Not exploited: on 2026-11-04 the only role = 'admin' rows were the two known admins.
--
-- Fix: a BEFORE INSERT OR UPDATE trigger. For requests made through the API with a user's JWT
-- (role anon or authenticated) by someone who is not an admin:
--   INSERT → role is set to 'user', whatever was sent;
--   UPDATE → changing role raises an error.
-- Unchanged:
--   - an admin changing a role (the "משתמשים" admin page);
--   - the SQL editor and service_role (no user JWT);
--   - handle_new_user (runs under Supabase Auth, no user JWT);
--   - users editing their own name, phone or avatar.
--
-- QA after applying: docs/qa/profile-role-test.sql. Rollback: end of this file.
-- ============================================================

BEGIN;

DO $$
DECLARE
  fn regprocedure := to_regprocedure('public.is_admin()');
BEGIN
  IF fn IS NULL THEN
    RAISE EXCEPTION 'public.is_admin() is missing';
  END IF;
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = fn) THEN
    RAISE EXCEPTION 'public.is_admin() is not SECURITY DEFINER';
  END IF;
  IF to_regprocedure('auth.role()') IS NULL THEN
    RAISE EXCEPTION 'auth.role() is missing';
  END IF;
  IF to_regprocedure('public.profiles_protect_role()') IS NOT NULL THEN
    RAISE EXCEPTION 'public.profiles_protect_role() already exists';
  END IF;
END $$;

CREATE FUNCTION public.profiles_protect_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Only API requests carrying a user's JWT are limited; the SQL editor, service_role and
  -- Supabase Auth itself (handle_new_user) have no such role.
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only an admin can change a role' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.profiles_protect_role() IS
  'Stops non-admin API callers from setting or changing profiles.role (2026-11-04 audit fix).';

-- A trigger function, never an RPC.
REVOKE ALL ON FUNCTION public.profiles_protect_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_protect_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_role();

COMMIT;

-- ============================================================
-- ROLLBACK (only if needed; reopens the hole):
-- BEGIN;
-- DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
-- DROP FUNCTION IF EXISTS public.profiles_protect_role();
-- COMMIT;
-- ============================================================
