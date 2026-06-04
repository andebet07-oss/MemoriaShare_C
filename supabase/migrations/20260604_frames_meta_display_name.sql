-- ============================================================
-- frames_meta.display_name — friendly Hebrew label for admin UI
-- Applied to live DB: 2026-06-04
-- ============================================================
--
-- The admin FramesLibrary and the CreateMagnetEvent picker showed the raw
-- technical frame_id (e.g. "wedding-bold-heart"). display_name gives each
-- frame a short Hebrew name shown in those UIs; falls back to frame_id when null.
-- ============================================================

ALTER TABLE frames_meta ADD COLUMN IF NOT EXISTS display_name text;

UPDATE frames_meta SET display_name = CASE frame_id
  WHEN 'wedding-bold-heart'          THEN 'לב מודגש'
  WHEN 'wedding-elegant'             THEN 'אלגנטי'
  WHEN 'wedding-red-heart'           THEN 'לב אדום'
  WHEN 'wedding-caps-bold'           THEN 'אותיות גדולות'
  WHEN 'wedding-arrows'              THEN 'חיצים'
  WHEN 'wedding-couple'              THEN 'זוג מאויר'
  WHEN 'wedding-rings'               THEN 'טבעות'
  WHEN 'landscape-heart-simple'      THEN 'לב פשוט'
  WHEN 'landscape-heart-calligraphy' THEN 'קליגרפיה'
  WHEN 'landscape-olive-branches'    THEN 'ענפי זית'
  WHEN 'landscape-wedding-car'       THEN 'רכב חתונה'
  WHEN 'landscape-camera-heart'      THEN 'מצלמה ולב'
  ELSE display_name
END
WHERE frame_id IN (
  'wedding-bold-heart','wedding-elegant','wedding-red-heart','wedding-caps-bold',
  'wedding-arrows','wedding-couple','wedding-rings',
  'landscape-heart-simple','landscape-heart-calligraphy','landscape-olive-branches',
  'landscape-wedding-car','landscape-camera-heart'
);
