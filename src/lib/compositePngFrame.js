/**
 * compositePngFrame.js
 *
 * Composites a photo onto a canvas using a PNG frame with a transparent hole.
 * The PNG is drawn on top of the photo; the hole reveals the photo beneath.
 * Optionally renders the event name text at the bottom using per-frame text_config.
 *
 * hole_bbox is stored normalised (0-1) relative to the PNG canvas dimensions.
 * Accepts both normalised and pixel-unit bboxes (pixel if any value > 1).
 *
 * Usage:
 *   const canvas = await compositePngFrame(photoImg, frame, { eventName, maxWidth, maxHeight });
 */

const PNG_CACHE = new Map();

function loadImage(src) {
  if (PNG_CACHE.has(src)) return PNG_CACHE.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    // Always anonymous — prevents tainted-canvas on cross-origin hosts
    // (www.memoriashare.com vs memoriashare.com, Supabase storage, CDN, etc.)
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => {
      PNG_CACHE.delete(src);
      reject(new Error(`Frame load failed: ${src}`));
    };
    img.src = src;
  });
  PNG_CACHE.set(src, p);
  return p;
}

/**
 * @param {HTMLImageElement} photoImg  - already-loaded photo image
 * @param {object}           frame     - { image_url, hole_bbox, text_config? }
 * @param {object}           [opts]    - { maxWidth?, maxHeight?, eventName? }
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function compositePngFrame(photoImg, frame, opts = {}) {
  const { image_url, hole_bbox, text_config } = frame;

  const frameImg = await loadImage(image_url);

  const srcW = frameImg.naturalWidth  || 800;
  const srcH = frameImg.naturalHeight || 1200;

  // Scale down to maxWidth/maxHeight when provided (preview mode)
  const scale = (opts.maxWidth || opts.maxHeight)
    ? Math.min(
        opts.maxWidth  ? opts.maxWidth  / srcW : 1,
        opts.maxHeight ? opts.maxHeight / srcH : 1,
        1,
      )
    : 1;

  const fw = Math.round(srcW * scale);
  const fh = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = fw;
  canvas.height = fh;
  const ctx = canvas.getContext('2d');

  // Resolve hole bbox — normalised (0-1) or absolute px (any value > 1)
  const isNormalised = hole_bbox.w <= 1 && hole_bbox.h <= 1;
  const hx = isNormalised ? Math.round(hole_bbox.x * fw) : hole_bbox.x;
  const hy = isNormalised ? Math.round(hole_bbox.y * fh) : hole_bbox.y;
  const hw = isNormalised ? Math.round(hole_bbox.w * fw) : hole_bbox.w;
  const hh = isNormalised ? Math.round(hole_bbox.h * fh) : hole_bbox.h;

  // White base (frame background is always white/light per brand direction)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, fw, fh);

  // Photo scaled to fill the hole (cover fit)
  const photoAspect = photoImg.naturalWidth / photoImg.naturalHeight;
  const holeAspect  = hw / hh;
  let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight;
  if (photoAspect > holeAspect) {
    sw = Math.round(sh * holeAspect);
    sx = Math.round((photoImg.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(sw / holeAspect);
    sy = Math.round((photoImg.naturalHeight - sh) / 2);
  }
  ctx.drawImage(photoImg, sx, sy, sw, sh, hx, hy, hw, hh);

  // PNG frame overlay (transparent hole reveals photo)
  ctx.drawImage(frameImg, 0, 0, fw, fh);

  // ── Text layers (event name, date, icon) ───────────────────────────────────
  // text_config schema:
  //   event_name: { font, size, weight, color, align, y }
  //   date:       { font, size, weight, color, align, y }
  //   icon:       { emoji, y }   — rendered as large emoji above the text
  if (text_config) {
    const renderText = async (cfg, text) => {
      if (!cfg || !text) return;
      const fontSize   = Math.max(10, Math.round((cfg.size || 0.028) * fh));
      const fontWeight = cfg.weight || 'normal';
      const fontFamily = cfg.font   || 'Heebo';
      const fontStr    = `${fontWeight} ${fontSize}px '${fontFamily}', sans-serif`;

      try { await document.fonts.load(fontStr); } catch { /* fallback */ }

      ctx.save();
      ctx.font         = fontStr;
      ctx.textAlign    = cfg.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = cfg.color || '#444444';

      const tx = (cfg.align === 'left')  ? Math.round(fw * 0.12)
               : (cfg.align === 'right') ? Math.round(fw * 0.88)
               : Math.round(fw / 2);
      const ty = Math.round((cfg.y || 0.88) * fh);

      ctx.fillText(text, tx, ty);
      ctx.restore();
    };

    const renderIcon = async (cfg) => {
      if (!cfg?.emoji) return;
      