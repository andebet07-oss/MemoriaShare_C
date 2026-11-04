-- ============================================================
-- QA: profiles.role after supabase/pending/20261104_protect_profile_role.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration
-- (if the editor asks about RLS for new tables: "Run without RLS"; the two tables
-- below are temporary).
-- It creates throw-away users (an admin, a signed-in user, an anonymous guest),
-- runs every case as the right role, and ENDS WITH AN ERROR ON PURPOSE: the error
-- message is the results table, and raising it rolls back everything. Nothing persists.
--
-- Every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;
INSERT INTO qa_ids (k) VALUES ('admin'), ('user'), ('user2'), ('guest');

-- Runs p_sql as p_role with JWT sub = p_sub and records the first column of its first row
-- ('error: …' if it fails, 'no row' if RLS filtered it). Everything it did is rolled back.
CREATE FUNCTION pg_temp.qa_value(p_case text, p_expected text, p_role text, p_sub uuid, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE v_actual text;
BEGIN
  BEGIN
    IF p_role IS NOT NULL THEN
      EXECUTE format('SET LOCAL ROLE %I', p_role);
      PERFORM set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', p_role)::text, true);
    END IF;
    EXECUTE p_sql INTO v_actual;
    v_actual := coalesce(v_actual, 'no row');
    RAISE EXCEPTION '__QA_DONE__';
  EXCEPTION WHEN others THEN
    IF SQLERRM <> '__QA_DONE__' THEN v_actual := 'error: ' || SQLERRM; END IF;
  END;
  INSERT INTO qa_results (case_name, expected, actual, pass)
  VALUES (p_case, p_expected, v_actual, v_actual = p_expected OR (p_expected = 'error' AND v_actual LIKE 'error:%'));
END $fn$;

-- ── Fixtures (as postgres) ────────────────────────────────────
DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  usr uuid := (SELECT id FROM qa_ids WHERE k = 'user');
  usr2 uuid := (SELECT id FROM qa_ids WHERE k = 'user2');
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES (admin, false), (usr, false), (usr2, false), (guest, true);
  INSERT INTO public.profiles (id, role) VALUES (admin, 'admin'), (usr, 'user'), (usr2, 'user')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  DELETE FROM public.profiles WHERE id = guest; -- anonymous guests have no profile row
END$$;

DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  usr uuid := (SELECT id FROM qa_ids WHERE k = 'user');
  usr2 uuid := (SELECT id FROM qa_ids WHERE k = 'user2');
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
BEGIN
  -- The hole: becoming admin
  PERFORM pg_temp.qa_value('guest: create own profile as admin → saved as user', 'user', 'authenticated', guest,
    format('INSERT INTO public.profiles (id, role) VALUES (%L, ''admin'') RETURNING role', guest));
  PERFORM pg_temp.qa_value('guest: is_admin() after trying', 'false', 'authenticated', guest, 'SELECT public.is_admin()::text');
  PERFORM pg_temp.qa_value('user: set own role to admin → refused', 'error', 'authenticated', usr,
    format('UPDATE public.profiles SET role = ''admin'' WHERE id = %L RETURNING role', usr));
  PERFORM pg_temp.qa_value('user: upsert own profile as admin → stays user', 'user', 'authenticated', usr,
    format('INSERT INTO public.profiles (id, role) VALUES (%L, ''admin'') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role RETURNING role', usr));
  PERFORM pg_temp.qa_value('anon key: create a profile as admin → refused', 'error', 'anon', NULL,
    format('INSERT INTO public.profiles (id, role) VALUES (%L, ''admin'') RETURNING role', gen_random_uuid()));
  PERFORM pg_temp.qa_value('user: change another user''s role → no row', 'no row', 'authenticated', usr,
    format('UPDATE public.profiles SET role = ''admin'' WHERE id = %L RETURNING role', usr2));

  -- What must keep working
  PERFORM pg_temp.qa_value('[regression] user: edit own name', 'QA name', 'authenticated', usr,
    format('UPDATE public.profiles SET full_name = ''QA name'' WHERE id = %L RETURNING full_name', usr));
  PERFORM pg_temp.qa_value('[regression] admin: make a user admin (משתמשים page)', 'admin', 'authenticated', admin,
    format('UPDATE public.profiles SET role = ''admin'' WHERE id = %L RETURNING role', usr));
  PERFORM pg_temp.qa_value('[regression] admin: make an admin a user again', 'user', 'authenticated', admin,
    format('UPDATE public.profiles SET role = ''user'' WHERE id = %L RETURNING role', admin));
  PERFORM pg_temp.qa_value('[regression] SQL editor: set a role', 'admin', NULL, NULL,
    format('UPDATE public.profiles SET role = ''admin'' WHERE id = %L RETURNING role', usr2));
  PERFORM pg_temp.qa_value('[regression] service_role: set a role', 'admin', 'service_role', NULL,
    format('UPDATE public.profiles SET role = ''admin'' WHERE id = %L RETURNING role', usr2));
END$$;

-- ── Report + rollback (intentional error) ─────────────────────
DO $$
BEGIN
  RAISE EXCEPTION E'QA RESULTS — all fixtures rolled back\n%\n%',
    (SELECT format('%s passed, %s failed', count(*) FILTER (WHERE pass), count(*) FILTER (WHERE NOT pass)) FROM qa_results),
    (SELECT string_agg(format('%s  %s | expected %s | got %s',
                              CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END, case_name, expected, actual),
                       E'\n' ORDER BY n)
       FROM qa_results);
END$$;
