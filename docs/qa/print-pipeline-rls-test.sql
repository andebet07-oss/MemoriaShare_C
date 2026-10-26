-- ============================================================
-- QA: RLS after 20261025_print_pipeline_hardening.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration.
-- It creates throw-away users/events/photos, runs every case as the right
-- role (anon / guest / host / admin) and ENDS WITH AN ERROR ON PURPOSE: the
-- error message is the results table, and raising it rolls back everything,
-- fixtures included. Nothing persists.
--
-- Every line must start with PASS. Lines tagged [regression] check that Share
-- behaviour the migration should NOT touch still works.
-- Storage (bucket) cases run through the real Storage API instead — see
-- docs/qa/print-pipeline-hardening.md §B.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;

INSERT INTO qa_ids (k) VALUES
  ('admin'), ('host'), ('guest_a'), ('guest_b'), ('guest_c'),
  ('ev_magnet'), ('ev_inactive'), ('ev_share'),
  ('ph_a'), ('ph_b'), ('ph_b_hidden'), ('ph_a_inactive'), ('ph_a_share'), ('job_b');

-- Runs p_sql as p_role with JWT sub = p_sub; records allowed/denied.
-- A statement that affects/returns 0 rows (RLS-filtered) counts as denied.
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
    IF v_rows = 0 THEN RAISE EXCEPTION 'no rows affected/returned (filtered by RLS)'; END IF;
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
  host uuid := (SELECT id FROM qa_ids WHERE k = 'host');
  ga uuid := (SELECT id FROM qa_ids WHERE k = 'guest_a');
  gb uuid := (SELECT id FROM qa_ids WHERE k = 'guest_b');
  gc uuid := (SELECT id FROM qa_ids WHERE k = 'guest_c');
  em uuid := (SELECT id FROM qa_ids WHERE k = 'ev_magnet');
  ei uuid := (SELECT id FROM qa_ids WHERE k = 'ev_inactive');
  es uuid := (SELECT id FROM qa_ids WHERE k = 'ev_share');
  base text := public.photos_public_base_url();
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES
    (admin, false), (host, false), (ga, true), (gb, true), (gc, true);
  INSERT INTO profiles (id, role) VALUES (admin, 'admin'), (host, 'user')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO events (id, name, unique_code, created_by, event_type, is_active, print_quota_per_device) VALUES
    (em, 'QA magnet',   'qa-' || left(em::text, 8), admin, 'magnet', true,  2),
    (ei, 'QA inactive', 'qa-' || left(ei::text, 8), admin, 'magnet', false, 5),
    (es, 'QA share',    'qa-' || left(es::text, 8), host,  'share',  true,  5);

  INSERT INTO photos (id, event_id, file_url, path, created_by, is_approved, is_hidden) VALUES
    ((SELECT id FROM qa_ids WHERE k = 'ph_a'),          em, base || em || '/a.jpg',  em || '/a.jpg',  ga, true,  false),
    ((SELECT id FROM qa_ids WHERE k = 'ph_b'),          em, base || em || '/b.jpg',  em || '/b.jpg',  gb, true,  false),
    ((SELECT id FROM qa_ids WHERE k = 'ph_b_hidden'),   em, base || em || '/bh.jpg', em || '/bh.jpg', gb, false, true),
    ((SELECT id FROM qa_ids WHERE k = 'ph_a_inactive'), ei, base || ei || '/ai.jpg', ei || '/ai.jpg', ga, true,  false),
    ((SELECT id FROM qa_ids WHERE k = 'ph_a_share'),    es, base || es || '/as.jpg', es || '/as.jpg', ga, true,  false);

  -- guest_b already used its whole quota (2) on ev_magnet
  INSERT INTO print_jobs (id, event_id, photo_id, guest_user_id) VALUES
    ((SELECT id FROM qa_ids WHERE k = 'job_b'), em, (SELECT id FROM qa_ids WHERE k = 'ph_b'), gb),
    (gen_random_uuid(),                         em, (SELECT id FROM qa_ids WHERE k = 'ph_b'), gb);

  -- guest_c holds an editor grant on a DIFFERENT (share) event — the D3 probe
  INSERT INTO event_permissions (event_id, user_id, role, granted_by) VALUES (es, gc, 'editor', host);
  -- host (non-admin) holds an editor grant on the magnet event — the events UPDATE probe
  INSERT INTO event_permissions (event_id, user_id, role, granted_by) VALUES (em, host, 'editor', admin);
END$$;

-- ── Cases ────────────────────────────────────────────────────
DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  host uuid := (SELECT id FROM qa_ids WHERE k = 'host');
  ga uuid := (SELECT id FROM qa_ids WHERE k = 'guest_a');
  gb uuid := (SELECT id FROM qa_ids WHERE k = 'guest_b');
  gc uuid := (SELECT id FROM qa_ids WHERE k = 'guest_c');
  em uuid := (SELECT id FROM qa_ids WHERE k = 'ev_magnet');
  ei uuid := (SELECT id FROM qa_ids WHERE k = 'ev_inactive');
  es uuid := (SELECT id FROM qa_ids WHERE k = 'ev_share');
  pa uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a');
  pb uuid := (SELECT id FROM qa_ids WHERE k = 'ph_b');
  pbh uuid := (SELECT id FROM qa_ids WHERE k = 'ph_b_hidden');
  pai uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a_inactive');
  pas uuid := (SELECT id FROM qa_ids WHERE k = 'ph_a_share');
  jb uuid := (SELECT id FROM qa_ids WHERE k = 'job_b');
  base text := public.photos_public_base_url();
  job text := 'INSERT INTO print_jobs (event_id, photo_id, guest_user_id%s) VALUES (%L, %L, %L%s)';
  pho text := 'INSERT INTO photos (event_id, created_by, path, file_url%s) VALUES (%L, %L, %L, %L%s)';
  sel text := 'SELECT 1 FROM photos WHERE id = %L';
  ev  text := 'INSERT INTO events (name, unique_code, created_by, event_type) VALUES (''QA new'', %L, %L, ''magnet'')';
BEGIN
  -- ── print_jobs INSERT ──
  PERFORM pg_temp.qa_try('jobs | anon: insert any job', 'denied', 'anon', NULL, format(job, '', em, pa, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: valid job (defaults)', 'allowed', 'authenticated', ga, format(job, '', em, pa, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: copies = 20', 'denied', 'authenticated', ga, format(job, ', copies', em, pa, ga, ', 20'));
  PERFORM pg_temp.qa_try('jobs | guest A: status = ready', 'denied', 'authenticated', ga, format(job, ', status', em, pa, ga, ', ''ready'''));
  PERFORM pg_temp.qa_try('jobs | guest A: crop_config set', 'denied', 'authenticated', ga, format(job, ', crop_config', em, pa, ga, ', ''{"zoom":2}'''));
  PERFORM pg_temp.qa_try('jobs | guest A: face_count set', 'denied', 'authenticated', ga, format(job, ', face_count', em, pa, ga, ', 3'));
  PERFORM pg_temp.qa_try('jobs | guest A: job in guest C''s name', 'denied', 'authenticated', ga, format(job, '', em, pa, gc, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: guest B''s photo', 'denied', 'authenticated', ga, format(job, '', em, pb, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: own photo from another event', 'denied', 'authenticated', ga, format(job, '', em, pas, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: inactive magnet event', 'denied', 'authenticated', ga, format(job, '', ei, pai, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: share event', 'denied', 'authenticated', ga, format(job, '', es, pas, ga, ''));
  PERFORM pg_temp.qa_try('jobs | guest A: raw_photo_url in event folder', 'allowed', 'authenticated', ga,
    format(job, ', raw_photo_url', em, pa, ga, format(', %L', base || em || '/raw.jpg')));
  PERFORM pg_temp.qa_try('jobs | guest A: raw_photo_url external host', 'denied', 'authenticated', ga,
    format(job, ', raw_photo_url', em, pa, ga, ', ''https://evil.example/x.jpg'''));
  PERFORM pg_temp.qa_try('jobs | guest A: raw_photo_url other event folder', 'denied', 'authenticated', ga,
    format(job, ', raw_photo_url', em, pa, ga, format(', %L', base || es || '/raw.jpg')));
  PERFORM pg_temp.qa_try('jobs | guest A: update copies on a job', 'denied', 'authenticated', ga, format('UPDATE print_jobs SET copies = 5 WHERE id = %L', jb));
  PERFORM pg_temp.qa_try('jobs | guest B: valid job over quota', 'denied', 'authenticated', gb, format(job, '', em, pb, gb, ''));
  PERFORM pg_temp.qa_try('jobs | admin: queue job for guest A', 'denied', 'authenticated', admin, format(job, '', em, pa, ga, ''));
  PERFORM pg_temp.qa_try('jobs | admin: set copies = 3 (operator)', 'allowed', 'authenticated', admin, format('UPDATE print_jobs SET copies = 3 WHERE id = %L', jb));
  PERFORM pg_temp.qa_try('jobs | admin: set status = printing', 'allowed', 'authenticated', admin, format('UPDATE print_jobs SET status = ''printing'' WHERE id = %L', jb));

  -- ── photos SELECT (magnet photos private) ──
  PERFORM pg_temp.qa_try('photos | anon: list magnet photo', 'denied', 'anon', NULL, format(sel, pa));
  PERFORM pg_temp.qa_try('photos | guest A: own magnet photo', 'allowed', 'authenticated', ga, format(sel, pa));
  PERFORM pg_temp.qa_try('photos | guest A: guest B''s magnet photo', 'denied', 'authenticated', ga, format(sel, pb));
  PERFORM pg_temp.qa_try('photos | guest C (editor on another event): magnet photo', 'denied', 'authenticated', gc, format(sel, pb));
  PERFORM pg_temp.qa_try('photos | admin: magnet photo', 'allowed', 'authenticated', admin, format(sel, pb));
  PERFORM pg_temp.qa_try('photos | admin: hidden + unapproved magnet photo', 'allowed', 'authenticated', admin, format(sel, pbh));
  PERFORM pg_temp.qa_try('photos | [regression] anon: approved share photo', 'allowed', 'anon', NULL, format(sel, pas));

  -- ── photos INSERT (URL integrity) ──
  PERFORM pg_temp.qa_try('photos | guest A: valid upload row', 'allowed', 'authenticated', ga,
    format(pho, '', em, ga, em || '/n.jpg', base || em || '/n.jpg', ''));
  PERFORM pg_temp.qa_try('photos | guest A: file_url external host', 'denied', 'authenticated', ga,
    format(pho, '', em, ga, em || '/n.jpg', 'https://evil.example/n.jpg', ''));
  PERFORM pg_temp.qa_try('photos | guest A: file_url in another event folder', 'denied', 'authenticated', ga,
    format(pho, '', em, ga, es || '/n.jpg', base || es || '/n.jpg', ''));
  PERFORM pg_temp.qa_try('photos | guest A: nested path', 'denied', 'authenticated', ga,
    format(pho, '', em, ga, em || '/x/n.jpg', base || em || '/x/n.jpg', ''));
  PERFORM pg_temp.qa_try('photos | guest A: file_url not matching path', 'denied', 'authenticated', ga,
    format(pho, '', em, ga, em || '/n.jpg', base || em || '/other.jpg', ''));
  PERFORM pg_temp.qa_try('photos | guest A: file_urls pre-filled', 'denied', 'authenticated', ga,
    format(pho, ', file_urls', em, ga, em || '/n.jpg', base || em || '/n.jpg', ', ''{"original":"https://evil.example/x.jpg"}'''));
  PERFORM pg_temp.qa_try('photos | guest A: row in guest B''s name', 'denied', 'authenticated', ga,
    format(pho, '', em, gb, em || '/n.jpg', base || em || '/n.jpg', ''));

  -- ── photos UPDATE / DELETE ──
  PERFORM pg_temp.qa_try('photos | guest A: repoint own file_url', 'denied', 'authenticated', ga,
    format('UPDATE photos SET file_url = %L WHERE id = %L', 'https://evil.example/x.jpg', pa));
  PERFORM pg_temp.qa_try('photos | guest A: set own file_urls', 'denied', 'authenticated', ga,
    format('UPDATE photos SET file_urls = ''{"original":"https://evil.example/x.jpg"}'' WHERE id = %L', pa));
  PERFORM pg_temp.qa_try('photos | [regression] guest A: rename own photo', 'allowed', 'authenticated', ga,
    format('UPDATE photos SET guest_name = ''QA'' WHERE id = %L', pa));
  PERFORM pg_temp.qa_try('photos | guest B: update guest A''s photo', 'denied', 'authenticated', gb,
    format('UPDATE photos SET guest_name = ''x'' WHERE id = %L', pa));
  PERFORM pg_temp.qa_try('photos | guest C (editor elsewhere): update magnet photo', 'denied', 'authenticated', gc,
    format('UPDATE photos SET is_hidden = true WHERE id = %L', pa));
  PERFORM pg_temp.qa_try('photos | guest C (editor elsewhere): delete magnet photo', 'denied', 'authenticated', gc,
    format('DELETE FROM photos WHERE id = %L', pa));
  PERFORM pg_temp.qa_try('photos | admin: repoint file_url', 'denied', 'authenticated', admin,
    format('UPDATE photos SET file_url = %L WHERE id = %L', 'https://evil.example/x.jpg', pa));

  -- ── events INSERT (admin-only) ──
  PERFORM pg_temp.qa_try('events | anon: create event', 'denied', 'anon', NULL, format(ev, 'qa-x1-' || left(md5(random()::text), 6), ga));
  PERFORM pg_temp.qa_try('events | guest A: create event', 'denied', 'authenticated', ga, format(ev, 'qa-x2-' || left(md5(random()::text), 6), ga));
  PERFORM pg_temp.qa_try('events | Google user (non-admin): create event', 'denied', 'authenticated', host, format(ev, 'qa-x3-' || left(md5(random()::text), 6), host));
  PERFORM pg_temp.qa_try('events | admin: create event', 'allowed', 'authenticated', admin, format(ev, 'qa-x4-' || left(md5(random()::text), 6), admin));

  -- ── events UPDATE (magnet rows admin-only) ──
  PERFORM pg_temp.qa_try('events | host: turn own share event into magnet', 'denied', 'authenticated', host,
    format('UPDATE events SET event_type = ''magnet'' WHERE id = %L', es));
  PERFORM pg_temp.qa_try('events | [regression] host: rename own share event', 'allowed', 'authenticated', host,
    format('UPDATE events SET name = ''QA renamed'' WHERE id = %L', es));
  PERFORM pg_temp.qa_try('events | host (editor grant): rename magnet event', 'denied', 'authenticated', host,
    format('UPDATE events SET name = ''QA renamed'' WHERE id = %L', em));
  PERFORM pg_temp.qa_try('events | host (editor grant): raise magnet quota', 'denied', 'authenticated', host,
    format('UPDATE events SET print_quota_per_device = 999 WHERE id = %L', em));
  PERFORM pg_temp.qa_try('events | admin: update magnet event', 'allowed', 'authenticated', admin,
    format('UPDATE events SET print_quota_per_device = 10 WHERE id = %L', em));
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
