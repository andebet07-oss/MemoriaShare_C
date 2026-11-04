-- ============================================================
-- QA: photos bucket access after supabase/pending/20261104_close_photo_listing.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration
-- (if the editor asks about RLS for new tables: "Run without RLS"; the two tables
-- below are temporary).
-- It ENDS WITH AN ERROR ON PURPOSE: the error message is the results table, and
-- raising it rolls back everything, fixtures included. Nothing persists.
--
-- Every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;
INSERT INTO qa_ids (k) VALUES ('admin'), ('user'), ('guest');
-- The most recent active event: guests may upload into its folder.
INSERT INTO qa_ids (k, id) SELECT 'event', id FROM public.events WHERE is_active ORDER BY created_date DESC LIMIT 1;

-- Runs p_sql as p_role (JWT sub = p_sub) and records the first column of its first row
-- ('ok' if the statement returns nothing, 'error: …' if it fails). Everything is rolled back.
CREATE FUNCTION pg_temp.qa_value(p_case text, p_expected text, p_role text, p_sub uuid, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE v_actual text;
BEGIN
  BEGIN
    IF p_role IS NOT NULL THEN
      EXECUTE format('SET LOCAL ROLE %I', p_role);
      PERFORM set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', p_role)::text, true);
    END IF;
    IF p_sql ~* '^\s*select' OR p_sql ~* '\mreturning\M' THEN
      EXECUTE p_sql INTO v_actual;
    ELSE
      EXECUTE p_sql;
    END IF;
    v_actual := coalesce(v_actual, 'ok');
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
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES (admin, false), (usr, false), (guest, true);
  INSERT INTO public.profiles (id, role) VALUES (admin, 'admin'), (usr, 'user')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  INSERT INTO storage.objects (bucket_id, name) VALUES ('photos', 'covers/qa-' || admin || '/cover.jpg');
END$$;

DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  usr uuid := (SELECT id FROM qa_ids WHERE k = 'user');
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
  ev uuid := (SELECT id FROM qa_ids WHERE k = 'event');
  list_photos text := 'SELECT (count(*) > 0)::text FROM storage.objects WHERE bucket_id = ''photos''';
BEGIN
  -- The hole: listing every guest photo
  PERFORM pg_temp.qa_value('anon key: list the photos bucket → sees nothing', 'false', 'anon', NULL, list_photos);
  PERFORM pg_temp.qa_value('guest (anonymous session): list the photos bucket → sees nothing', 'false', 'authenticated', guest, list_photos);
  PERFORM pg_temp.qa_value('signed-in non-admin: list the photos bucket → sees nothing', 'false', 'authenticated', usr, list_photos);

  -- What must keep working
  PERFORM pg_temp.qa_value('[regression] admin: list the photos bucket', 'true', 'authenticated', admin, list_photos);
  PERFORM pg_temp.qa_value('[regression] guest: upload a photo into an active event folder', 'ok', 'authenticated', guest,
    format('INSERT INTO storage.objects (bucket_id, name) VALUES (''photos'', %L)', ev || '/qa-' || guest || '.jpg'));
  PERFORM pg_temp.qa_value('[regression] admin: replace an event cover (upsert = select + update)', 'covers/qa-' || admin || '/cover.jpg', 'authenticated', admin,
    format('UPDATE storage.objects SET metadata = ''{}'' WHERE bucket_id = ''photos'' AND name = %L RETURNING name', 'covers/qa-' || admin || '/cover.jpg'));
  PERFORM pg_temp.qa_value('[regression] studio-files stays admin-only for a guest', 'false', 'authenticated', guest,
    'SELECT (count(*) > 0)::text FROM storage.objects WHERE bucket_id = ''studio-files''');
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
