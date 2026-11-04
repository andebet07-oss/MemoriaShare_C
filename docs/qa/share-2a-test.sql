-- ============================================================
-- QA: photos / events / upload_diagnostics after supabase/migrations/20261104_retire_share_2a.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration
-- (if the editor asks about RLS for new tables: "Run without RLS"; the two tables
-- below are temporary).
-- It creates throw-away users, events and photos, runs every case as the right role, and
-- ENDS WITH AN ERROR ON PURPOSE: the error message is the results table, and raising it
-- rolls back everything, fixtures included. Nothing persists.
--
-- Every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;
INSERT INTO qa_ids (k) VALUES
  ('admin'), ('host'), ('editor'), ('guest_a'), ('guest_b'),          -- users
  ('share1'), ('share2'), ('magnet'),                                 -- events
  ('photo_share1'), ('photo_share2'), ('photo_magnet');               -- photos

-- Runs p_sql as p_role (JWT sub = p_sub) and records the first column of its first row:
-- 'no row' if it returned none (RLS filtered it), 'ok' for a statement without RETURNING,
-- 'error: …' if it failed. Everything it did is rolled back.
CREATE FUNCTION pg_temp.qa_value(p_case text, p_expected text, p_role text, p_sub uuid, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  v_actual text;
  v_rows bigint;
  v_claims text := json_build_object(
    'sub', p_sub, 'role', p_role,
    -- signed-in (non-anonymous) users carry an email claim, like a real Google sign-in
    'email', (SELECT u.id || '@qa.invalid' FROM auth.users u WHERE u.id = p_sub AND NOT u.is_anonymous))::text;
BEGIN
  BEGIN
    IF p_role IS NOT NULL THEN
      PERFORM set_config('request.jwt.claims', v_claims, true);
      EXECUTE format('SET LOCAL ROLE %I', p_role);
    END IF;
    IF p_sql ~* '^\s*select' OR p_sql ~* '\mreturning\M' THEN
      EXECUTE p_sql INTO v_actual;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows = 0 THEN v_actual := 'no row'; END IF;
    ELSE
      EXECUTE p_sql;
      v_actual := 'ok';
    END IF;
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
  id_of jsonb := (SELECT jsonb_object_agg(k, id) FROM qa_ids);
  admin uuid := id_of ->> 'admin';
  host uuid := id_of ->> 'host';
  editor uuid := id_of ->> 'editor';
  guest_a uuid := id_of ->> 'guest_a';
  guest_b uuid := id_of ->> 'guest_b';
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES
    (admin, false), (host, false), (editor, false), (guest_a, true), (guest_b, true);
  INSERT INTO public.profiles (id, role) VALUES (admin, 'admin'), (host, 'user'), (editor, 'user')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  -- share1 belongs to a non-admin host; share2 and the magnet event to the admin
  INSERT INTO public.events (id, name, unique_code, created_by, event_type) VALUES
    ((id_of ->> 'share1')::uuid, 'QA share 1', 'qa-' || (id_of ->> 'share1'), host, 'share'),
    ((id_of ->> 'share2')::uuid, 'QA share 2', 'qa-' || (id_of ->> 'share2'), admin, 'share'),
    ((id_of ->> 'magnet')::uuid, 'QA magnet', 'qa-' || (id_of ->> 'magnet'), admin, 'magnet');
  INSERT INTO public.photos (id, event_id, created_by, is_approved, is_hidden) VALUES
    ((id_of ->> 'photo_share1')::uuid, (id_of ->> 'share1')::uuid, guest_a, true, false),
    ((id_of ->> 'photo_share2')::uuid, (id_of ->> 'share2')::uuid, guest_b, true, false),
    ((id_of ->> 'photo_magnet')::uuid, (id_of ->> 'magnet')::uuid, guest_a, true, false);
  -- an editor on share1 only
  INSERT INTO public.event_permissions (event_id, user_id, role, granted_by)
    VALUES ((id_of ->> 'share1')::uuid, editor, 'editor', host);
  INSERT INTO public.upload_diagnostics (photo_id, event_id, diagnosis)
    VALUES ((id_of ->> 'photo_share1')::uuid, (id_of ->> 'share1')::uuid, 'ok');
END$$;

DO $$
DECLARE
  id_of jsonb := (SELECT jsonb_object_agg(k, id) FROM qa_ids);
  admin uuid := id_of ->> 'admin';
  host uuid := id_of ->> 'host';
  editor uuid := id_of ->> 'editor';
  guest_a uuid := id_of ->> 'guest_a';
  guest_b uuid := id_of ->> 'guest_b';
  share1 text := id_of ->> 'share1';
  share2 text := id_of ->> 'share2';
  magnet text := id_of ->> 'magnet';
  photo_share1 text := id_of ->> 'photo_share1';
  photo_share2 text := id_of ->> 'photo_share2';
  photo_magnet text := id_of ->> 'photo_magnet';
BEGIN
  -- The holes
  PERFORM pg_temp.qa_value('anon key: read photos → sees none', 'false', 'anon', NULL,
    'SELECT (count(*) > 0)::text FROM public.photos');
  PERFORM pg_temp.qa_value('guest B: read guest A''s approved Share photo → no row', '0', 'authenticated', guest_b,
    format('SELECT count(*)::text FROM public.photos WHERE id = %L', photo_share1));
  PERFORM pg_temp.qa_value('guest B: read photos → only own', '0', 'authenticated', guest_b,
    format('SELECT count(*)::text FROM public.photos WHERE created_by IS DISTINCT FROM %L', guest_b));
  PERFORM pg_temp.qa_value('editor on share 1: read a share 2 photo (ep.event_id bug) → no row', '0', 'authenticated', editor,
    format('SELECT count(*)::text FROM public.photos WHERE id = %L', photo_share2));
  PERFORM pg_temp.qa_value('editor on share 1: delete a share 2 photo (ep.event_id bug) → no row', 'no row', 'authenticated', editor,
    format('DELETE FROM public.photos WHERE id = %L RETURNING id', photo_share2));
  PERFORM pg_temp.qa_value('editor on share 1: rename share 1 → no row', 'no row', 'authenticated', editor,
    format('UPDATE public.events SET name = ''QA hacked'' WHERE id = %L RETURNING name', share1));
  PERFORM pg_temp.qa_value('Share host (not admin): read a guest photo in own event → no row', '0', 'authenticated', host,
    format('SELECT count(*)::text FROM public.photos WHERE id = %L', photo_share1));
  PERFORM pg_temp.qa_value('Share host (not admin): delete a guest photo in own event → no row', 'no row', 'authenticated', host,
    format('DELETE FROM public.photos WHERE id = %L RETURNING id', photo_share1));
  PERFORM pg_temp.qa_value('guest B: delete guest A''s photo → no row', 'no row', 'authenticated', guest_b,
    format('DELETE FROM public.photos WHERE id = %L RETURNING id', photo_share1));
  PERFORM pg_temp.qa_value('signed-in non-admin: create an event → refused', 'error', 'authenticated', host,
    format('INSERT INTO public.events (name, unique_code, created_by, event_type) VALUES (''QA'', %L, %L, ''magnet'') RETURNING name',
           'qa-x-' || host, host));
  PERFORM pg_temp.qa_value('guest: read upload_diagnostics → sees none', 'false', 'authenticated', guest_a,
    'SELECT (count(*) > 0)::text FROM public.upload_diagnostics');
  PERFORM pg_temp.qa_value('guest: write upload_diagnostics → refused', 'error', 'authenticated', guest_a,
    format('INSERT INTO public.upload_diagnostics (photo_id, event_id, diagnosis) VALUES (%L, %L, ''ok'')', photo_share1, share1));
  PERFORM pg_temp.qa_value('trigger functions callable by anon/authenticated', '0', NULL, NULL,
    'SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = ''public'' AND p.prorettype = ''trigger''::regtype
        AND (has_function_privilege(''anon'', p.oid, ''EXECUTE'') OR has_function_privilege(''authenticated'', p.oid, ''EXECUTE''))');
  PERFORM pg_temp.qa_value('photos_public_base_url() has a fixed search_path', 'true', NULL, NULL,
    'SELECT (proconfig IS NOT NULL)::text FROM pg_proc WHERE oid = ''public.photos_public_base_url()''::regprocedure');

  -- What must keep working
  PERFORM pg_temp.qa_value('[regression] guest A: read own Share photo', '1', 'authenticated', guest_a,
    format('SELECT count(*)::text FROM public.photos WHERE id = %L', photo_share1));
  PERFORM pg_temp.qa_value('[regression] guest A: read own magnet photo', '1', 'authenticated', guest_a,
    format('SELECT count(*)::text FROM public.photos WHERE id = %L', photo_magnet));
  PERFORM pg_temp.qa_value('[regression] guest A: upload a photo and get it back (MagnetReview)', magnet || '/qa.jpg', 'authenticated', guest_a,
    format('INSERT INTO public.photos (event_id, file_url, path, created_by, is_approved, is_hidden) VALUES (%L, %L, %L, %L, true, false) RETURNING path',
           magnet, public.photos_public_base_url() || magnet || '/qa.jpg', magnet || '/qa.jpg', guest_a));
  PERFORM pg_temp.qa_value('[regression] guest A: send own photo to print (quota trigger fires)', 'pending', 'authenticated', guest_a,
    format('INSERT INTO public.print_jobs (event_id, photo_id, guest_user_id) VALUES (%L, %L, %L) RETURNING status',
           magnet, photo_magnet, guest_a));
  PERFORM pg_temp.qa_value('[regression] guest A: delete own photo (failed-upload cleanup)', photo_magnet, 'authenticated', guest_a,
    format('DELETE FROM public.photos WHERE id = %L RETURNING id', photo_magnet));
  PERFORM pg_temp.qa_value('[regression] guest: open an active event by its code', 'QA magnet', 'authenticated', guest_b,
    format('SELECT name FROM public.events WHERE unique_code = %L', 'qa-' || magnet));
  PERFORM pg_temp.qa_value('[regression] admin: list the photos of an event (event dashboard)', '1', 'authenticated', admin,
    format('SELECT count(*)::text FROM public.photos WHERE event_id = %L', magnet));
  PERFORM pg_temp.qa_value('[regression] admin: read any Share photo (backup)', '2', 'authenticated', admin,
    format('SELECT count(*)::text FROM public.photos WHERE id IN (%L, %L)', photo_share1, photo_share2));
  PERFORM pg_temp.qa_value('[regression] admin: hide a photo', 'true', 'authenticated', admin,
    format('UPDATE public.photos SET is_hidden = true WHERE id = %L RETURNING is_hidden', photo_magnet));
  PERFORM pg_temp.qa_value('[regression] admin: delete a photo', photo_share2, 'authenticated', admin,
    format('DELETE FROM public.photos WHERE id = %L RETURNING id', photo_share2));
  PERFORM pg_temp.qa_value('[regression] admin: create an event', 'QA admin event', 'authenticated', admin,
    format('INSERT INTO public.events (name, unique_code, created_by, event_type) VALUES (''QA admin event'', %L, %L, ''magnet'') RETURNING name',
           'qa-a-' || admin, admin));
  PERFORM pg_temp.qa_value('[regression] admin: change an event cover', 'qa-cover.jpg', 'authenticated', admin,
    format('UPDATE public.events SET cover_image = ''qa-cover.jpg'' WHERE id = %L RETURNING cover_image', magnet));
  PERFORM pg_temp.qa_value('[regression] Share host: rename own event', 'QA renamed', 'authenticated', host,
    format('UPDATE public.events SET name = ''QA renamed'' WHERE id = %L RETURNING name', share1));
  PERFORM pg_temp.qa_value('[regression] admin: read upload_diagnostics', 'true', 'authenticated', admin,
    'SELECT (count(*) > 0)::text FROM public.upload_diagnostics');
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
