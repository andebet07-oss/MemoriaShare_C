-- ============================================================
-- QA: access after supabase/pending/20261104_studio_templates.sql
-- ============================================================
-- Run the WHOLE file in the Supabase SQL editor AFTER applying the migration.
-- It creates throw-away users (an admin, a signed-in non-admin, an anonymous
-- guest), a template row and a file row, runs every case as the right role,
-- and ENDS WITH AN ERROR ON PURPOSE: the error message is the results table,
-- and raising it rolls back everything, fixtures included. Nothing persists.
--
-- Every line must start with PASS.
-- ============================================================

BEGIN;

CREATE TEMP TABLE qa_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;
CREATE TEMP TABLE qa_results (n serial, case_name text, expected text, actual text, pass boolean) ON COMMIT DROP;

INSERT INTO qa_ids (k) VALUES ('admin'), ('admin2'), ('user'), ('guest'), ('tpl'), ('tpl_del');

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

CREATE FUNCTION pg_temp.qa_check(p_case text, p_ok boolean, p_detail text)
RETURNS void LANGUAGE sql AS $fn$
  INSERT INTO qa_results (case_name, expected, actual, pass)
  VALUES (p_case, 'true', coalesce(p_detail, 'null'), coalesce(p_ok, false));
$fn$;

-- ── Fixtures (inserted as postgres, bypassing RLS) ────────────
DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  admin2 uuid := (SELECT id FROM qa_ids WHERE k = 'admin2');
  usr uuid := (SELECT id FROM qa_ids WHERE k = 'user');
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
BEGIN
  INSERT INTO auth.users (id, is_anonymous) VALUES (admin, false), (admin2, false), (usr, false), (guest, true);
  INSERT INTO public.profiles (id, role) VALUES (admin, 'admin'), (admin2, 'admin'), (usr, 'user')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  INSERT INTO public.studio_templates (id, owner_id, name, doc) VALUES
    ((SELECT id FROM qa_ids WHERE k = 'tpl'),     admin2, 'QA template', '{"format":"magnet-frame-studio"}'),
    ((SELECT id FROM qa_ids WHERE k = 'tpl_del'), admin2, 'QA delete',   '{"format":"magnet-frame-studio"}');
  INSERT INTO storage.objects (bucket_id, name) VALUES ('studio-files', 'qa/' || admin2 || '/assets/a.png');
END$$;

DO $$
DECLARE
  admin uuid := (SELECT id FROM qa_ids WHERE k = 'admin');
  admin2 uuid := (SELECT id FROM qa_ids WHERE k = 'admin2');
  usr uuid := (SELECT id FROM qa_ids WHERE k = 'user');
  guest uuid := (SELECT id FROM qa_ids WHERE k = 'guest');
  tpl uuid := (SELECT id FROM qa_ids WHERE k = 'tpl');
  tpl_del uuid := (SELECT id FROM qa_ids WHERE k = 'tpl_del');
  sel text := format('SELECT 1 FROM public.studio_templates WHERE id = %L', tpl);
  ins text := 'INSERT INTO public.studio_templates (name, doc, owner_id) VALUES (''QA new'', ''{}'', %L)';
  upd text := format('UPDATE public.studio_templates SET name = ''QA renamed'' WHERE id = %L', tpl);
  del text := format('DELETE FROM public.studio_templates WHERE id = %L', tpl_del);
  file_sel text := format('SELECT 1 FROM storage.objects WHERE bucket_id = ''studio-files'' AND name = %L', 'qa/' || admin2 || '/assets/a.png');
  file_ins text := 'INSERT INTO storage.objects (bucket_id, name) VALUES (''studio-files'', %L)';
  r record;
BEGIN
  -- ── Table: admins share one library ──
  PERFORM pg_temp.qa_try('templates | admin: read a template another admin made', 'allowed', 'authenticated', admin, sel);
  PERFORM pg_temp.qa_try('templates | admin: create (recorded as self)', 'allowed', 'authenticated', admin, format(ins, admin));
  PERFORM pg_temp.qa_try('templates | admin: create under another admin''s name', 'denied', 'authenticated', admin, format(ins, admin2));
  PERFORM pg_temp.qa_try('templates | admin: edit a template another admin made', 'allowed', 'authenticated', admin, upd);
  PERFORM pg_temp.qa_try('templates | admin: delete', 'allowed', 'authenticated', admin, del);

  -- ── Table: nobody else ──
  PERFORM pg_temp.qa_try('templates | signed-in non-admin: read', 'denied', 'authenticated', usr, sel);
  PERFORM pg_temp.qa_try('templates | signed-in non-admin: create', 'denied', 'authenticated', usr, format(ins, usr));
  PERFORM pg_temp.qa_try('templates | signed-in non-admin: edit', 'denied', 'authenticated', usr, upd);
  PERFORM pg_temp.qa_try('templates | signed-in non-admin: delete', 'denied', 'authenticated', usr, format('DELETE FROM public.studio_templates WHERE id = %L', tpl));
  PERFORM pg_temp.qa_try('templates | guest (anonymous session): read', 'denied', 'authenticated', guest, sel);
  PERFORM pg_temp.qa_try('templates | guest (anonymous session): create', 'denied', 'authenticated', guest, format(ins, guest));
  PERFORM pg_temp.qa_try('templates | anon key: read', 'denied', 'anon', NULL, sel);
  PERFORM pg_temp.qa_try('templates | anon key: create', 'denied', 'anon', NULL, format(ins, admin));

  -- ── Files ──
  PERFORM pg_temp.qa_try('files | admin: read a file', 'allowed', 'authenticated', admin, file_sel);
  PERFORM pg_temp.qa_try('files | admin: upload', 'allowed', 'authenticated', admin, format(file_ins, 'qa/' || admin || '/assets/b.png'));
  PERFORM pg_temp.qa_try('files | signed-in non-admin: read', 'denied', 'authenticated', usr, file_sel);
  PERFORM pg_temp.qa_try('files | signed-in non-admin: upload', 'denied', 'authenticated', usr, format(file_ins, 'qa/x/assets/c.png'));
  PERFORM pg_temp.qa_try('files | guest (anonymous session): read', 'denied', 'authenticated', guest, file_sel);
  PERFORM pg_temp.qa_try('files | guest (anonymous session): upload', 'denied', 'authenticated', guest, format(file_ins, 'qa/x/assets/d.png'));
  PERFORM pg_temp.qa_try('files | anon key: read', 'denied', 'anon', NULL, file_sel);

  -- ── Server-controlled fields (trigger; every case above was rolled back) ──
  UPDATE public.studio_templates SET name = 'QA renamed' WHERE id = tpl;
  SELECT revision INTO r FROM public.studio_templates WHERE id = tpl;
  PERFORM pg_temp.qa_check('trigger | an edit bumps revision 1 → 2', r.revision = 2, 'revision ' || r.revision);
  UPDATE public.studio_templates SET owner_id = admin, revision = 99, created_at = now() - interval '1 year' WHERE id = tpl;
  SELECT owner_id, revision, created_at > now() - interval '1 day' AS recent INTO r FROM public.studio_templates WHERE id = tpl;
  PERFORM pg_temp.qa_check('trigger | creator, revision and created_at stay server-controlled',
    r.owner_id = admin2 AND r.revision = 3 AND r.recent,
    format('creator %s, revision %s, created_at kept %s', CASE WHEN r.owner_id = admin2 THEN 'kept' ELSE 'CHANGED' END, r.revision, r.recent));
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
