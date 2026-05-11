const PNG_CACHE = new Map();

function loadImage(src) {
  if (PNG_CACHE.has(src)) return PNG_CACHE.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    // Always anonymous - prevents tainted-canvas on cross-origin hosts
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
 * Composites a photo onto a canvas using a PNG frame with a transparent hole.
 * text_config schema:
 *   icon:       { emoji, y }
 *   event_name: { font, size, weight, color, align, y }
 *   date:       { font, size, weight, color, align, y }
 */
export async function compositePngFrame(photoImg, frame, opts = {}) {
  const { image_url, hole_bbox, text_config } = frame;
  const frameImg = await loadImage(image_url);

  const srcW = frameImg.naturalWidth  || 800;
  const srcH = frameImg.naturalHeight || 1200;

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

  const isNormalised = hole_bbox.w <= 1 && hole_bbox.h <= 1;
  const hx = isNormalised ? Math.round(hole_bbox.x * fw) : hole_bbox.x;
  const hy = isNormalised ? Math.round(hole_bbox.y * fh) : hole_bbox.y;
  const hw = isNormalised ? Math.round(hole_bbox.w * fw) : hole_bbox.w;
  const hh = isNormalised ? Math.round(hole_bbox.h * fh) : hole_bbox.h;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, fw, fh);

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
  ctx.drawImage(frameImg, 0, 0, fw, fh);

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
      ctx.fillText(text, tx, Math.round((cfg.y || 0.88) * fh));
      ctx.restore();
    };

    const renderIcon = async (cfg) => {
      if (!cfg?.emoji) return;
      const fontSize = Math.max(16, Math.round(0.045 * fh));
      ctx.save();
      ctx.font         = `${fontSize}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.emoji, Math.round(fw / 2), Math.round((cfg.y || 0.78) * fh));
      ctx.restore();
    };

    await renderIcon(text_config.icon);
    await renderText(text_config.event_name, opts.eventName);
    await renderText(text_config.date,       opts.eventDate);
  }

  return canvas;
}

export function canvasToJpegBlob(canvas, quality = 0.9) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}
