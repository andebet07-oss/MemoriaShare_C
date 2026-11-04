-- ============================================================
-- QA: sign-in allowlist after supabase/pending/20261104_signin_allowlist.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration
-- (if the editor asks about RLS for new tables: "Run without RLS"; the two tables
-- below are temporary).
-- It ENDS WITH AN ERROR ON PURPOSE: the error message is the results table, and
-- raising it rolls back everything. Nothing persists.
--
-- Every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, v text) ON COMMIT DROP;
INSERT INTO qa_ids
SELECT 'admin_email', email FROM public.signin_allowlist ORDER BY created_at, email LIMIT 1;

-- Runs p_sql (as p_role when given) and records the first column of its first row,
-- or 'error: …' if it fails. Everything it did is rolled back.
CREATE FUNCTION pg_temp.qa_value(p_case text, p_expected text, p_role text, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE v_actual text;
BEGIN
  BEGIN
    IF p_role IS NOT NULL THEN
      PERFORM set_config('request.jwt.claims', json_build_object('role', p_role)::text, true);
      EXECUTE format('SET LOCAL ROLE %I', p_role);
    END IF;
    EXECUTE p_sql INTO v_actual;
    v_actual := coalesce(v_actual, 'null');
    RAISE EXCEPTION '__QA_DONE__';
  EXCEPTION WHEN others THEN
    IF SQLERRM <> '__QA_DONE__' THEN v_actual := 'error: ' || SQLERRM; END IF;
  END;
  INSERT INTO qa_results (case_name, expected, actual, pass)
  VALUES (p_case, p_expected, v_actual, v_actual = p_expected OR (p_expected = 'error' AND v_actual LIKE 'error:%'));
END $fn$;

-- What the owner does later: add an email to the list (any case, stray spaces), then that person signs in.
CREATE FUNCTION pg_temp.qa_add_then_sign_in(p_listed text, p_signs_in_as text)
RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  INSERT INTO public.signin_allowlist (email) VALUES (p_listed);
  RETURN coalesce(public.hook_before_user_created(
           jsonb_build_object('user', jsonb_build_object('email', p_signs_in_as, 'is_anonymous', false)))
         -> 'error' ->> 'http_code', 'allowed');
END $fn$;

DO $$
DECLARE
  admin_email text := (SELECT v FROM qa_ids WHERE k = 'admin_email');
  -- What Supabase Auth sends the hook: {"metadata": {...}, "user": {...}}
  hook text := 'SELECT coalesce(public.hook_before_user_created(%L::jsonb) -> ''error'' ->> ''http_code'', ''allowed'')';
BEGIN
  -- The hook decides who gets a new account
  PERFORM pg_temp.qa_value('guest (anonymous) sign-in → allowed', 'allowed', NULL,
    format(hook, '{"user": {"email": "", "is_anonymous": true, "app_metadata": {"provider": "anonymous"}}}'));
  PERFORM pg_temp.qa_value('account with no email → allowed (never a Google sign-in)', 'allowed', NULL,
    format(hook, '{"user": {"is_anonymous": false}}'));
  PERFORM pg_temp.qa_value('unknown Google account → refused (403)', '403', NULL,
    format(hook, '{"user": {"email": "someone.else@gmail.com", "is_anonymous": false, "app_metadata": {"provider": "google"}}}'));
  PERFORM pg_temp.qa_value('unknown email + password sign-up → refused (403)', '403', NULL,
    format(hook, '{"user": {"email": "qa-signup@example.com", "is_anonymous": false, "app_metadata": {"provider": "email"}}}'));
  PERFORM pg_temp.qa_value('listed admin email → allowed', 'allowed', NULL,
    format(hook, json_build_object('user', json_build_object('email', admin_email, 'is_anonymous', false))));
  PERFORM pg_temp.qa_value('listed admin email in capitals → allowed', 'allowed', NULL,
    format(hook, json_build_object('user', json_build_object('email', upper(admin_email), 'is_anonymous', false))));
  PERFORM pg_temp.qa_value('new person before being added → refused (403)', '403', NULL,
    format(hook, '{"user": {"email": "new.person@example.com", "is_anonymous": false}}'));
  PERFORM pg_temp.qa_value('new person after the owner adds " New.Person@Example.com " → allowed', 'allowed', NULL,
    'SELECT pg_temp.qa_add_then_sign_in('' New.Person@Example.com '', ''new.person@example.com'')');
  PERFORM pg_temp.qa_value('the list holds the admins', 'true', NULL,
    'SELECT (count(*) = (SELECT count(*) FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE p.role = ''admin''))::text FROM public.signin_allowlist');

  -- Who can reach what
  PERFORM pg_temp.qa_value('Supabase Auth can run the hook', 'true', NULL,
    'SELECT has_function_privilege(''supabase_auth_admin'', ''public.hook_before_user_created(jsonb)'', ''EXECUTE'')::text');
  PERFORM pg_temp.qa_value('Supabase Auth can read the list', 'true', NULL,
    'SELECT (has_table_privilege(''supabase_auth_admin'', ''public.signin_allowlist'', ''SELECT'')
             AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = ''signin_allowlist'' AND ''supabase_auth_admin'' = ANY (roles)))::text');
  PERFORM pg_temp.qa_value('anon key / guests cannot run the hook', 'false', NULL,
    'SELECT (has_function_privilege(''anon'', ''public.hook_before_user_created(jsonb)'', ''EXECUTE'')
          OR has_function_privilege(''authenticated'', ''public.hook_before_user_created(jsonb)'', ''EXECUTE''))::text');
  PERFORM pg_temp.qa_value('anon key: read the list → refused', 'error', 'anon',
    'SELECT count(*)::text FROM public.signin_allowlist');
  PERFORM pg_temp.qa_value('signed-in session: read the list → refused', 'error', 'authenticated',
    'SELECT count(*)::text FROM public.signin_allowlist');

  -- Existing accounts
  PERFORM pg_temp.qa_value('existing accounts not on the list (not guests) → all banned', '0', NULL,
    'SELECT count(*)::text FROM auth.users u
      WHERE NOT u.is_anonymous AND (u.banned_until IS NULL OR u.banned_until < now())
        AND NOT EXISTS (SELECT 1 FROM public.signin_allowlist a WHERE a.email = lower(btrim(u.email)))');
  PERFORM pg_temp.qa_value('[regression] admins are not banned', '0', NULL,
    'SELECT count(*)::text FROM auth.users u JOIN public.profiles p ON p.id = u.id
      WHERE p.role = ''admin'' AND u.banned_until IS NOT NULL');
  PERFORM pg_temp.qa_value('[regression] no guest (anonymous) account is banned', '0', NULL,
    'SELECT count(*)::text FROM auth.users WHERE is_anonymous AND banned_until IS NOT NULL');
END$$;

-- ── Report + rollback (intentional error) ─────────────────────
DO $$
BEGIN
  RAISE EXCEPTION E'QA RESULTS — everything rolled back\n%\n%',
    (SELECT format('%s passed, %s failed', count(*) FILTER (WHERE pass), count(*) FILTER (WHERE NOT pass)) FROM qa_results),
    (SELECT string_agg(format('%s  %s | expected %s | got %s',
                              CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END, case_name, expected, actual),
                       E'\n' ORDER BY n)
       FROM qa_results);
END$$;
