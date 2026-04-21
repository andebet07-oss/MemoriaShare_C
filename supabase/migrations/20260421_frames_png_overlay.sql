-- ── frames_meta PNG overlay extension ────────────────────────────────────────
-- Adds columns required by the PNG overlay pipeline (second-gen frames).
-- Procedural (drawFrame) frames leave these NULL and continue to work unchanged.
-- PNG frames require image_url + hole_bbox; aspect + category are optional meta.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE frames_meta
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS hole_bbox  JSONB,
  ADD COLUMN IF NOT EXISTS aspect     TEXT
                              CHECK (aspect IN ('portrait', 'square', 'strip')),
  ADD COLUMN IF NOT EXISTS category   TEXT
                              CHECK (category IN ('wedding', 'bar-mitzvah', 'birthday', 'brit', 'corporate', 'general'));

-- Index for filtering PNG frames only
CREATE INDEX IF NOT EXISTS frames_meta_image_url_idx ON frames_meta ((image_url IS NOT NULL));

-- Index for category filtering in admin library
CREATE INDEX IF NOT EXISTS frames_meta_category_idx ON frames_meta (category);
