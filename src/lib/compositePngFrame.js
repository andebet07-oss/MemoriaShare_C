/**
 * compositePngFrame.js
 *
 * Composites a photo onto a canvas using a PNG frame with a transparent hole.
 * The PNG is drawn on top of the photo; the hole reveals the photo beneath.
 *
 * hole_bbox is stored normalised (0-1) relative to the PNG canvas dimensions.
 * Accepts both normalised and pixel-unit bboxes (pixel if any value > 1).
 *
 * Usage:
 *   const canvas = await compositePngFrame(photoImg, { image_url, hole_bbox });
 *   // canvas is ready for toDataURL / toBlob
 */

const PNG_CACHE = new Map();

function loadImage(src) {
  if (PNG_CACHE.has(src)) {
    const cached = PNG_CACHE.get(src);
    // Don't reuse a rejected promise — retry on next call
    return cached;
  }
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin only for cross-origin Supabase storage URLs; same-origin SVGs don't need it
    if (src.includes('supabase') || src.includes('storage')) img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = (e) => {
      PNG_CACHE.delete(src); // remove failed entry so next render retries
      reject(new Error(`Frame load failed: ${src}`));
    };
    img.src = src;
  });
  PNG_CACHE.set(src, p);
  return p;
}

/**
 * @param {HTMLImageElement} photoImg  - already-loaded photo image
 * @param {object}           frame     - { image_url: string, hole_bbox: {x,y,w,h} (normalised 0-1) }
 * @param {object}           [opts]    - { maxWidth?, maxHeight? } — cap canvas size (useful for previews)
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function compositePngFrame(photoImg, frame, opts = {}) {
  const { image_url, hole_bbox } = frame;

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

  // White base
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

  return canvas;
}

/**
 * Convenience: given a canvas (from compositePngFrame), return a compressed JPEG blob.
 */
export function canvasToJpegBlob(canvas, quality = 0.9) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}
