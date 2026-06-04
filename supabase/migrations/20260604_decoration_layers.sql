-- ============================================================
-- Movable/resizable decoration layers for wedding artwork frames
-- Applied to live DB: 2026-06-04
-- ============================================================
--
-- The 3 artwork wedding frames (arrows / couple / rings) previously had their
-- decoration baked into a dedicated PNG. To let the admin move & resize that
-- artwork in the editor, the decorations are now separate transparent PNG
-- layers (public/FRAMES/deco-*.png) placed via text_config.decorations:
--   [{ id, url, x, y, w }]   x,y = normalised centre · w = normalised width
--
-- The frame image_url switches to the blank white portrait frame; the
-- compositor (compositePngFrame.js) and camera (FrameStripText.jsx) draw the
-- decoration layers dynamically on top.
-- ============================================================

UPDATE frames_meta
SET image_url   = 'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
    text_config = text_config || jsonb_build_object('decorations', '[
      {"id":"arrow-left","url":"https://www.memoriashare.com/FRAMES/deco-arrow-left.png","x":0.113,"y":0.909,"w":0.171},
      {"id":"arrow-right","url":"https://www.memoriashare.com/FRAMES/deco-arrow-right.png","x":0.887,"y":0.909,"w":0.171}
    ]'::jsonb),
    updated_at  = NOW()
WHERE frame_id = 'wedding-arrows';

UPDATE frames_meta
SET image_url   = 'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
    text_config = text_config || jsonb_build_object('decorations', '[
      {"id":"rings","url":"https://www.memoriashare.com/FRAMES/deco-rings.png","x":0.5,"y":0.877,"w":0.091}
    ]'::jsonb),
    updated_at  = NOW()
WHERE frame_id = 'wedding-rings';

UPDATE frames_meta
SET image_url   = 'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
    text_config = text_config || jsonb_build_object('decorations', '[
      {"id":"couple","url":"https://www.memoriashare.com/FRAMES/deco-couple.png","x":0.905,"y":0.93,"w":0.15}
    ]'::jsonb),
    updated_at  = NOW()
WHERE frame_id = 'wedding-couple';
