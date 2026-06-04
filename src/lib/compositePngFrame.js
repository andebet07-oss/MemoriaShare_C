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

  // ── Clear text strip below hole (erases baked placeholder text in frame PNG) ─
  // Ensures our dynamic text always renders on a clean white background.
  // Skipped when text_config.preserve_strip = true — used by portrait frames
  // whose strip contains vector decoration artwork (branches, car icons, etc.)
  // that must survive to be visible under the rendered text.
  if (text_config && !text_config.preserve_strip) {
    const textStripY = hy + hh;
    if (textStripY < fh) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, textStripY, fw, fh - textStripY);
    }
  }

  // ── Decoration layers (movable/resizable built-in artwork) ──────────────────
  // text_config.decorations: [{ url, x, y, w }] where x,y = normalised CENTRE
  // and w = normalised width (height derived from the asset's aspect ratio).
  // Drawn under the text so names/dates always stay legible.
  if (text_config?.decorations?.length) {
    for (const d of text_config.decorations) {
      if (!d?.url) continue;
      try {
        const deco = await loadImage(d.url);
        const dw = Math.round((d.w ?? 0.15) * fw);
        const dh = Math.round(dw * (deco.naturalHeight / deco.naturalWidth || 1));
        const dx = Math.round((d.x ?? 0.5) * fw - dw / 2);
        const dy = Math.round((d.y ?? 0.9) * fh - dh / 2);
        ctx.drawImage(deco, dx, dy, dw, dh);
      } catch (err) {
        console.warn('[compositePngFrame] decoration load failed:', d.url, err?.message);
      }
    }
  }

  // ── Text layers (event name, date, icon) ───────────────────────────────────
  // text_config schema:
  //   event_name: { font, size, weight, color, align, y, inline_icon?, inline_icon_color? }
  //   date:       { font, size, weight, color, align, y }
  //   icon:       { emoji, y }   — rendered as large emoji above the text (stacked)
  //
  // inline_icon (e.g. "♥"): when set on event_name, the name is split on its
  // connector ("&" / Hebrew "ו" / "+") and rendered as  [part1] ♥ [part2]
  // centered, mirroring the source wedding designs ("מיכל ♥ תומר"). Falls back
  // to a plain centered name when no connector is found.
  if (text_config) {
    const splitNames = (name) => {
      const ampersand = name.split(/\s*&\s*/);
      if (ampersand.length === 2) return ampersand;
      const heAnd = name.split(/\s+ו/);        // Hebrew vav connector: "מיכל ותומר"
      if (heAnd.length === 2) return heAnd;
      const plus = name.split(/\s*\+\s*/);
      if (plus.length === 2) return plus;
      return null;
    };

    const renderInlineName = async (cfg, text) => {
      const fontSize   = Math.max(10, Math.round((cfg.size || 0.028) * fh));
      const fontWeight = cfg.weight || 'normal';
      const fontFamily = cfg.font   || 'Heebo';
      const fontStr    = `${fontWeight} ${fontSize}px '${fontFamily}', sans-serif`;
      const iconStr    = `${fontSize}px serif`;
      try { await document.fonts.load(fontStr); } catch { /* fallback */ }

      const parts = splitNames(text);
      const ty    = Math.round((cfg.y || 0.88) * fh);
      const gap   = Math.round(fontSize * 0.45);

      ctx.save();
      ctx.textBaseline = 'middle';

      if (!parts) {
        ctx.font = fontStr; ctx.textAlign = 'center'; ctx.fillStyle = cfg.color || '#444444';
        ctx.fillText(text, Math.round(fw / 2), ty);
        ctx.restore();
        return;
      }

      const [a, b] = parts.map(s => s.trim());
      ctx.font = fontStr;
      const wA = ctx.measureText(a).width;
      const wB = ctx.measureText(b).width;
      ctx.font = iconStr;
      const wI = ctx.measureText(cfg.inline_icon).width;
      const total = wA + gap + wI + gap + wB;
      let x = Math.round(fw / 2 - total / 2);

      ctx.textAlign = 'left';
      ctx.font = fontStr; ctx.fillStyle = cfg.color || '#444444';
      ctx.fillText(a, x, ty);                         x += wA + gap;
      ctx.font = iconStr; ctx.fillStyle = cfg.inline_icon_color || cfg.color || '#444444';
      ctx.fillText(cfg.inline_icon, x, ty);           x += wI + gap;
      ctx.font = fontStr; ctx.fillStyle = cfg.color || '#444444';
      ctx.fillText(b, x, ty);
      ctx.restore();
    };

    const renderText = async (cfg, text) => {
      if (!cfg || !text) return;

      if (cfg.inline_icon) { await renderInlineName(cfg, text); return; }

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
      const fontSize = Math.max(16, Math.round(0.045 * fh));
      ctx.save();
      ctx.font         = `${fontSize}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      // cfg.x: normalised x position (0-1); defaults to center
      const tx = cfg.x != null ? Math.round(cfg.x * fw) : Math.round(fw / 2);
      ctx.fillText(cfg.emoji, tx, Math.round((cfg.y || 0.78) * fh));
      ctx.restore();
    };

    await renderIcon(text_config.icon);
    await renderText(text_config.event_name, opts.eventName);
    await renderText(text_config.date,       opts.eventDate);
  }

  return canvas;
}

/**
 * Convenience: given a canvas (from compositePngFrame), return a compressed JPEG blob.
 */
export function canvasToJpegBlob(canvas, quality = 0.9) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}
