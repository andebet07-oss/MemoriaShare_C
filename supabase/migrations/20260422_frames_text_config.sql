-- Add per-frame event-name text rendering config
-- text_config drives how the event name is rendered at the bottom of each PNG frame.
-- Shape: { y, font, size, color, weight } — all optional, renderer uses sensible defaults.
ALTER TABLE frames_meta
  ADD COLUMN IF NOT EXISTS text_config JSONB DEFAULT NULL;
