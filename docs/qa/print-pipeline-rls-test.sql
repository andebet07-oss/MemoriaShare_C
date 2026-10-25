-- ============================================================
-- QA: print_jobs RLS after 20261025_print_pipeline_hardening.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration.
-- It creates throw-away users/events/photos, runs every case as the right
-- role (anon / guest / admin) and ENDS WITH AN ERROR ON PURPOSE: the error
-- message is the results table, and raising it rolls back everything,
-- fixtures included. Nothing persists.
--
-- Read the result: every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;

INSERT INTO qa_ids (k) VALUES
  ('admin'), ('guest_a'), ('guest_b'), ('guest_c'),
  ('ev_magnet'), ('ev_inactive'), ('ev_share'),
  ('ph_a'), ('ph_b'), ('ph_a_inactive'), ('ph_a_share'), ('job_b');

-- Runs p_sql as p_role with JWT sub = p_sub; records allowed/denied.
-- A statement that affects 0 rows (RLS-filtered UPDATE) counts as denied.
CREATE FUNCTION pg_temp.qa_try(p_case text, p_expected text, p_role text, p_sub uuid, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE v_rows int; v_actual text;
BEGIN
  BEGIN
    EXECUTE format('SET LOCAL ROLE %I', p_role);
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', p_sub, 'role', p_role)::text, true);
    EXECUTE p_sql;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN RAISE EXCEPTION 'no rows affected (filtered by RLS)'; END IF;
    RAISE EXCEPTION '__QA_ALLOWED__';
  EXCEPTION WHEN others THEN
    v_actual := CASE WHEN SQLERRM = '__QA_ALLOWED__' THEN 'allowed' ELSE 'denied' END;
    INSERT INTO qa_results (case_name, expected, actual, pass)
    VALUES (p_case, p_expected,
            v_actual || CASE WHEN v_actual = 'denied' THEN ' — ' || SQLERRM ELSE '' END,
            v_actual = p_expected);
  END;
END $fn$;

-- ── Fixtures (inserted as postgres, bypassing RLS) ────────────
DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  ga uuid := (SELECT id FROM qa_ids WHERE k = 'guest_a');
  gb uuid := (SELECT id FROM qa_ids WHERE k = 'guest_b');
  gc uuid := (SELECT id FROM qa_ids WHERE k = 'guest_c');
  em uuid := (SELECT id FROM qa_ids WHERE k = 'ev_magnet');
  ei uuid := (SELECT id FROM qa_ids WHERE k = 'ev_inactive');
  es uuid := (SELECT id FROM qa_ids WHERE k = 'ev_share');
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES (admin, false), (ga, true), (gb, true), (gc, true);
  INSERT INTO profiles (id, role) VALUES (admin, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

  INSERT INTO events (id, name, unique_code, created_by, event_type, is_active, print_quota_per_device) VALUES
    (em, 'QA magnet',   'qa-' || left(em::text, 8), admin, 'magnet', true,  2),
    (ei, 'QA inactive', 'qa-' || left(ei::text, 8), admin, 'magnet', false, 5),
    (es, 'QA share',    'qa-' || left(es::text, 8), admin, 'share',  true,  5);

  INSERT INTO photos (id, event_id, file_url, created_by, is_approved) VALUES
    ((SELECT id FROM qa_ids WHERE k = 'ph_a'),          em, 'qa://a',  ga, true),
    ((SELECT id FROM qa_ids WHERE k = 'ph_b'),          em, 'qa://b',  gb, true),
    ((SELECT id FROM qa_ids WHERE k = 'ph_a_inactive'), ei, 'qa://ai', ga, true),
    ((SELECT id FROM qa_ids WHERE k = 'ph_a_share'),    es, 'qa://as', ga, true);

  -- guest_b already used its whole quota (2) on ev_magnet
  INSERT INTO print_jobs (id, event_id, photo_id, guest_user_id) VALUES
    ((SELECT id FROM qa_ids WHERE k = 'job_b'), em, (SELECT id FROM qa_ids WHERE k = 'ph_b'), gb),
    (gen_random_uuid(),                         em, (SELECT id FROM qa_ids WHERE k = 'ph_b'), gb);
END$$;

-- ── Cases ────────────────────────────────────────────────────
DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  ga uuid := (SELECT id FROM qa_ids WHERE k = 'guest_a');
  gb uuid := (SELECT id FROM qa_ids WHERE k = 'guest_b');
  gc uuid := (SELECT id FROM qa_ids WHERE k = 'guest_c');
  em uuid := (SELECT id FROM qa_ids WHERE k = 'ev_magnet');
  ei uuid := (SELECT id FROM qa_ids WHERE k = 'ev_inactive');
  es uuid := (SELECT id FROM qa_ids WHERE k = 'ev_share');
  pa uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a');
  pb uuid := (SELECT id FROM qa_ids WHERE k = 'ph_b');
  pai uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a_inactive');
  pas uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a_share');
  jb uuid := (SELECT id FROM qa_ids WHERE k = 'job_b');
  ins text := 'INSERT INTO print_jobs (event_id, photo_id, guest_user_id%s) VALUES (%L, %L, %L%s)';
BEGIN
  -- anonymous (no session)
  PERFORM pg_temp.qa_try('anon: insert any job', 'denied', 'anon', NULL,
    format(ins, '', em, pa, ga, ''));

  -- guest A
  PERFORM pg_temp.qa_try('guest A: valid job (defaults)', 'allowed', 'authenticated', ga,
    format(ins, '', em, pa, ga, ''));
  PERFORM pg_temp.qa_try('guest A: copies = 20', 'denied', 'authenticated', ga,
    format(ins, ', copies', em, pa, ga, ', 20'));
  PERFORM pg_temp.qa_try('guest A: status = ready', 'denied', 'authenticated', ga,
    format(ins, ', status', em, pa, ga, ', ''ready'''));
  PERFORM pg_temp.qa_try('guest A: crop_config set', 'denied', 'authenticated', ga,
    format(ins, ', crop_config', em, pa, ga, ', ''{"zoom":2}'''));
  PERFORM pg_temp.qa_try('guest A: face_count set', 'denied', 'authenticated', ga,
    format(ins, ', face_count', em, pa, ga, ', 3'));
  PERFORM pg_temp.qa_try('guest A: job in guest C''s name', 'denied', 'authenticated', ga,
    format(ins, '', em, pa, gc, ''));
  PERFORM pg_temp.qa_try('guest A: guest B''s photo', 'denied', 'authenticated', ga,
    format(ins, '', em, pb, ga, ''));
  PERFORM pg_temp.qa_try('guest A: own photo from another event', 'denied', 'authenticated', ga,
    format(ins, '', em, pas, ga, ''));
  PERFORM pg_temp.qa_try('guest A: inactive magnet event', 'denied', 'authenticated', ga,
    format(ins, '', ei, pai, ga, ''));
  PERFORM pg_temp.qa_try('guest A: share event', 'denied', 'authenticated', ga,
    format(ins, '', es, pas, ga, ''));
  PERFORM pg_temp.qa_try('guest A: update copies on a job', 'denied', 'authenticated', ga,
    format('UPDATE print_jobs SET copies = 5 WHERE id = %L', jb));

  -- guest B (quota = 2, already used)
  PERFORM pg_temp.qa_try('guest B: valid job over quota', 'denied', 'authenticated', gb,
    format(ins, '', em, pb, gb, ''));

  -- admin
  PERFORM pg_temp.qa_try('admin: queue job for guest A', 'denied', 'authenticated', admin,
    format(ins, '', em, pa, ga, ''));
  PERFORM pg_temp.qa_try('admin: set copies = 3 (operator)', 'allowed', 'authenticated', admin,
    format('UPDATE print_jobs SET copies = 3 WHERE id = %L', jb));
  PERFORM pg_temp.qa_try('admin: set status = printing', 'allowed', 'authenticated', admin,
    format('UPDATE print_jobs SET status = ''printing'' WHERE id = %L', jb));
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
