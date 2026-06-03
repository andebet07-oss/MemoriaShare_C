-- ============================================================
-- 7 wedding frame style variants for the CreateMagnetEvent picker
-- Applied to live DB: 2026-06-04
-- ============================================================
--
-- Gives the admin 7 distinct design options to offer per wedding event.
-- All share the portrait geometry (canvas 876×1266, photo hole 776×1031):
--   hole_bbox = {"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}
--
-- 4 typographic variants share the blank white PNG (frame-heart-simple-portrait.png)
--   and differ only by text_config (font / weight / inline-icon).
-- 3 artwork variants have their own PNG with baked decoration (arrows / couple / rings).
--
-- inline_icon renders the name as "מיכל ♥ תומר" (heart between the two names).
-- See src/lib/compositePngFrame.js (renderInlineName) and FrameStripText.jsx.
-- ============================================================

INSERT INTO frames_meta (frame_id, status, category, aspect, image_url, hole_bbox, text_config, sort_weight, notes)
VALUES
  -- 1. Bold Hebrew sans, black ♥ between names (source design #4)
  ('wedding-bold-heart', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.918,"font":"Heebo","size":0.034,"weight":"700","color":"#1a1a1a","align":"center","inline_icon":"♥","inline_icon_color":"#1a1a1a"},"date":{"y":0.962,"font":"Heebo","size":0.022,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   70, 'Wedding: bold Hebrew, inline black heart'),

  -- 2. Elegant serif display (Suez One), black ♥
  ('wedding-elegant', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.918,"font":"Suez One","size":0.032,"weight":"400","color":"#1a1a1a","align":"center","inline_icon":"♥","inline_icon_color":"#1a1a1a"},"date":{"y":0.962,"font":"Heebo","size":0.021,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   65, 'Wedding: elegant serif display, inline black heart'),

  -- 3. Rubik medium, red ❤ (source design #41)
  ('wedding-red-heart', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.918,"font":"Rubik","size":0.034,"weight":"500","color":"#1a1a1a","align":"center","inline_icon":"❤","inline_icon_color":"#e63946"},"date":{"y":0.962,"font":"Rubik","size":0.022,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   60, 'Wedding: Rubik, inline red heart'),

  -- 4. Heavy geometric (Secular One), larger, black ♥ (source design #62)
  ('wedding-caps-bold', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-heart-simple-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.918,"font":"Secular One","size":0.038,"weight":"400","color":"#1a1a1a","align":"center","inline_icon":"♥","inline_icon_color":"#1a1a1a"},"date":{"y":0.962,"font":"Heebo","size":0.022,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   55, 'Wedding: heavy geometric, large inline black heart'),

  -- 5. ARTWORK: arrows flanking the name, coral ❤ (source design #17)
  ('wedding-arrows', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-wedding-arrows-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.918,"font":"Heebo","size":0.034,"weight":"700","color":"#1a1a1a","align":"center","inline_icon":"❤","inline_icon_color":"#e8654f"},"date":{"y":0.962,"font":"Heebo","size":0.022,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   50, 'Wedding artwork: decorative arrows + inline coral heart'),

  -- 6. ARTWORK: bride+groom illustration bottom-right, typewriter-ish serif (source design #45)
  ('wedding-couple', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-wedding-couple-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.915,"font":"David Libre","size":0.034,"weight":"500","color":"#1a1a1a","align":"left"},"date":{"y":0.962,"font":"David Libre","size":0.022,"weight":"400","color":"#666666","align":"left"},"preserve_strip":true}'::jsonb,
   45, 'Wedding artwork: bride+groom illustration, left-aligned serif'),

  -- 7. ARTWORK: interlocking rings emblem above the name, elegant serif (source design #11)
  ('wedding-rings', 'approved', 'wedding', 'portrait',
   'https://www.memoriashare.com/FRAMES/frame-wedding-rings-portrait.png',
   '{"x":0.0571,"y":0.0395,"w":0.8858,"h":0.8144}'::jsonb,
   '{"event_name":{"y":0.928,"font":"Frank Ruhl Libre","size":0.030,"weight":"400","color":"#1a1a1a","align":"center"},"date":{"y":0.968,"font":"Heebo","size":0.021,"weight":"400","color":"#666666","align":"center"},"preserve_strip":true}'::jsonb,
   40, 'Wedding artwork: interlocking rings emblem, elegant serif')

ON CONFLICT (frame_id) DO UPDATE SET
  status      = EXCLUDED.status,
  category    = EXCLUDED.category,
  aspect      = EXCLUDED.aspect,
  image_url   = EXCLUDED.image_url,
  hole_bbox   = EXCLUDED.hole_bbox,
  text_config = EXCLUDED.text_config,
  sort_weight = EXCLUDED.sort_weight,
  notes       = EXCLUDED.notes,
  updated_at  = NOW();
