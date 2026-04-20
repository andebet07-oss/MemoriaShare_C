-- ── frames_meta ─────────────────────────────────────────────────────────────
-- Persistent metadata for every frame in framePacks.js.
-- DB is the source of truth for status/quality/style/palette/sort_weight.
-- framesMeta.js is the fallback/seed; admin writes through this table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS frames_meta (
  frame_id        TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  quality_score   INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 35),
  style           TEXT NOT NULL DEFAULT 'minimal_luxury'
                    CHECK (style IN ('minimal_luxury', 'modern_editorial', 'festive_chic')),
  palette         TEXT NOT NULL DEFAULT 'ivory',
  sort_weight     INTEGER NOT NULL DEFAULT 0,
  output_width_mm INTEGER NOT NULL DEFAULT 100,
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS frames_meta_status_idx      ON frames_meta (status);
CREATE INDEX IF NOT EXISTS frames_meta_style_idx       ON frames_meta (style);
CREATE INDEX IF NOT EXISTS frames_meta_sort_weight_idx ON frames_meta (sort_weight DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE frames_meta ENABLE ROW LEVEL SECURITY;

-- Public: anyone (anon + authenticated) can read all rows.
-- Guest paths only call approved frames; the filter is in the app layer.
CREATE POLICY "frames_meta_select_public"
  ON frames_meta FOR SELECT
  USING (true);

-- Admin: insert, update, delete
CREATE POLICY "frames_meta_insert_admin"
  ON frames_meta FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "frames_meta_update_admin"
  ON frames_meta FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "frames_meta_delete_admin"
  ON frames_meta FOR DELETE
  USING (is_admin());

-- ── Seed — all 30 frames ─────────────────────────────────────────────────────
-- Conflicts update all mutable columns so re-running is idempotent.

INSERT INTO frames_meta
  (frame_id, status, quality_score, style, palette, sort_weight, output_width_mm)
VALUES
  -- Wedding
  ('wedding-classic',        'approved', 28, 'minimal_luxury',   'ivory',    88,  100),
  ('wedding-editorial',      'approved', 33, 'minimal_luxury',   'ivory',    100, 100),
  ('wedding-arch',           'approved', 29, 'modern_editorial', 'indigo',   95,  100),
  ('wedding-emerald',        'approved', 30, 'modern_editorial', 'emerald',  96,  100),
  ('wedding-burgundy',       'approved', 30, 'modern_editorial', 'burgundy', 89,  100),
  ('wedding-romance',        'archived', 20, 'minimal_luxury',   'ivory',    0,   100),
  ('wedding-monogram',       'approved', 31, 'modern_editorial', 'gold',     98,  100),
  ('wedding-botanical',      'approved', 29, 'minimal_luxury',   'sage',     93,  100),
  ('wedding-polaroid-tape',  'approved', 29, 'festive_chic',     'warm',     86,  100),
  ('wedding-deco-gold',      'approved', 29, 'festive_chic',     'gold',     92,  100),
  ('wedding-hairline-crest', 'approved', 31, 'minimal_luxury',   'ivory',    99,  100),
  -- Bar / Bat Mitzvah
  ('bar-jerusalem',          'approved', 29, 'modern_editorial', 'indigo',   76,  100),
  ('bar-electric',           'archived', 18, 'modern_editorial', 'obsidian', 0,   100),
  ('bar-retro',              'archived', 16, 'festive_chic',     'rose',     0,   100),
  ('bar-royal',              'approved', 30, 'modern_editorial', 'navy',     91,  100),
  ('bar-hebrew-classic',     'approved', 31, 'modern_editorial', 'ivory',    97,  100),
  ('bat-rose',               'approved', 28, 'modern_editorial', 'rose',     87,  100),
  ('bar-tallit',             'approved', 30, 'modern_editorial', 'navy',     90,  100),
  -- Brit
  ('brit-boy',               'approved', 28, 'modern_editorial', 'blue',     83,  100),
  ('brit-elegant',           'approved', 30, 'minimal_luxury',   'ivory',    94,  100),
  ('brit-mint',              'approved', 28, 'minimal_luxury',   'sage',     84,  100),
  -- Birthday
  ('birthday-party',         'approved', 26, 'festive_chic',     'coral',    81,  100),
  ('birthday-neon',          'archived', 19, 'festive_chic',     'obsidian', 0,   100),
  ('birthday-pastel',        'archived', 22, 'festive_chic',     'pastel',   0,   100),
  ('birthday-scrapbook',     'approved', 27, 'festive_chic',     'warm',     82,  100),
  -- Corporate
  ('corp-executive',         'approved', 30, 'minimal_luxury',   'ivory',    85,  100),
  ('corp-gradient',          'approved', 27, 'modern_editorial', 'indigo',   77,  100),
  -- General
  ('general-cinema',         'approved', 29, 'modern_editorial', 'obsidian', 80,  100),
  ('general-minimal',        'approved', 28, 'minimal_luxury',   'ivory',    78,  100),
  ('general-filmstrip',      'approved', 28, 'festive_chic',     'obsidian', 79,  100)
ON CONFLICT (frame_id) DO UPDATE SET
  status          = EXCLUDED.status,
  quality_score   = EXCLUDED.quality_score,
  style           = EXCLUDED.style,
  palette         = EXCLUDED.palette,
  sort_weight     = EXCLUDED.sort_weight,
  output_width_mm = EXCLUDED.output_width_mm,
  updated_at      = now();
