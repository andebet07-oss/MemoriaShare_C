/**
 * renderPolaroid.js — the ONE magnet renderer.
 *
 * Every surface draws through drawPolaroid():
 *   renderComposite() — the finished magnet (paper + photo + caption) at print
 *                       resolution: review screen, upload, station, print.
 *   renderOverlay()   — the same drawing with the photo window cleared to
 *                       transparent: the frame laid over the live camera feed.
 * Same function, same layout, same window → the viewfinder, the review, the
 * station and the printed magnet match.
 */
import { DESIGN, WINDOW, PAPER, PRINT_SCALE, normalizeOrientation } from './printSpec';
import { getTemplate, eventTemplateId, resolveOptions, templateFonts } from './templates';
import { loadFonts, fontString } from './fonts';
import { layoutCaption } from './layout';
import { drawIcon } from './icons';
import { isHebrew } from './text';

const REF_PX = 100; // text is measured at 100px and used per unit of font size
const metrics = new Map();
let measureCtx = null;

/** Per-unit text metrics (see layout.js). Only valid once the font is loaded. */
function measure(text, font) {
  const key = `${font.family}|${font.weight}|${text}`;
  let m = metrics.get(key);
  if (!m) {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    measureCtx.font = fontString(font, REF_PX);
    const t = measureCtx.measureText(text);
    const hebrew = isHebrew(text);
    const ref = measureCtx.measureText(hebrew ? 'ה' : 'H');
    const refDesc = measureCtx.measureText(hebrew ? 'ךןףץק' : 'gjpqyJ');
    m = {
      width: t.width / REF_PX,
      ascent: t.actualBoundingBoxAscent / REF_PX,
      descent: t.actualBoundingBoxDescent / REF_PX,
      cap: ref.actualBoundingBoxAscent / REF_PX,
      desc: refDesc.actualBoundingBoxDescent / REF_PX,
    };
    metrics.set(key, m);
  }
  return m;
}

/**
 * Source rectangle of the photo shown in the window: the largest rect of the
 * window's aspect (cover — never letterboxed), centred by default. `crop`
 * ({ panX, panY, zoom }) moves its centre (normalised source coords) and
 * shrinks it (zoom ≥ 1); it is clamped inside the photo.
 */
export function photoSourceRect(imgW, imgH, aspect, crop) {
  let baseW, baseH;
  if (imgW / imgH > aspect) { baseH = imgH; baseW = imgH * aspect; }
  else { baseW = imgW; baseH = imgW / aspect; }
  const zoom = Math.max(1, crop?.zoom || 1);
  const w = baseW / zoom, h = baseH / zoom;
  const x = (crop?.panX ?? 0.5) * imgW - w / 2;
  const y = (crop?.panY ?? 0.5) * imgH - h / 2;
  return {
    x: Math.max(0, Math.min(imgW - w, x)),
    y: Math.max(0, Math.min(imgH - h, y)),
    w, h,
  };
}

function drawOps(ctx, ops, s) {
  for (const op of ops) {
    ctx.fillStyle = op.color;
    if (op.type === 'text') {
      ctx.font = fontString(op.font, op.size * s);
      ctx.direction = op.dir;
      ctx.textAlign = 'center';
      ctx.fillText(op.text, op.x * s, op.y * s);
    } else if (op.type === 'glyphs') {
      ctx.font = fontString(op.font, op.size * s);
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      for (const g of op.glyphs) ctx.fillText(g.ch, g.x * s, op.y * s);
    } else if (op.type === 'rect') {
      ctx.fillRect(op.x * s, op.y * s, op.w * s, op.h * s);
    } else if (op.type === 'icon') {
      drawIcon(ctx, { ...op, x: op.x * s, y: op.y * s, w: op.w * s, h: op.h * s }, PAPER);
    } else if (op.type === 'vglyphs') {
      ctx.save();
      ctx.font = fontString(op.font, op.size * s);
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.translate(op.cx * s, op.cy * s);
      ctx.rotate(Math.PI / 2); // reads top → bottom
      for (const g of op.glyphs) ctx.fillText(g.ch, g.x * s, (op.xHeight / 2) * s);
      ctx.restore();
    }
  }
}

/** Neutral stand-in photo for template previews without a real photo. */
function drawPlaceholder(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#D8D3CB');
  g.addColorStop(1, '#A39D94');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/**
 * Draw a magnet onto ctx at `scale` px per design unit.
 * mode 'composite' draws the photo (or a placeholder) in the window;
 * mode 'overlay' leaves the window transparent.
 */
function drawPolaroid(ctx, { template, options, orientation, scale, name, date, photo, crop, mode }) {
  const o = normalizeOrientation(orientation);
  const { w: W, h: H } = DESIGN[o];
  const win = WINDOW[o];
  const [wx, wy, ww, wh] = [win.x * scale, win.y * scale, win.w * scale, win.h * scale];

  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W * scale, H * scale);
  if (mode === 'overlay') {
    ctx.clearRect(wx, wy, ww, wh);
  } else if (photo) {
    const pw = photo.naturalWidth || photo.videoWidth || photo.width;
    const ph = photo.naturalHeight || photo.videoHeight || photo.height;
    const r = photoSourceRect(pw, ph, win.w / win.h, crop);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(photo, r.x, r.y, r.w, r.h, wx, wy, ww, wh);
  } else {
    drawPlaceholder(ctx, wx, wy, ww, wh);
  }

  ctx.textBaseline = 'alphabetic';
  const { ops } = layoutCaption(template, o, { name, date, options }, measure);
  drawOps(ctx, ops, scale);
  ctx.restore();
}

/**
 * The render input for an event: { templateId, options, name, date }.
 * Add orientation, photo and crop to render a magnet.
 */
export function eventRenderSpec(event) {
  const templateId = eventTemplateId(event);
  return {
    templateId,
    options: resolveOptions(getTemplate(templateId), event?.template_options),
    name: event?.name || '',
    date: event?.date || '',
  };
}

async function render(spec, mode, scale) {
  const template = getTemplate(spec.templateId);
  const options = resolveOptions(template, spec.options);
  // Rejects when a font fails: never draw a magnet in fallback fonts.
  await loadFonts(templateFonts(template));
  const o = normalizeOrientation(spec.orientation);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(DESIGN[o].w * scale);
  canvas.height = Math.round(DESIGN[o].h * scale);
  drawPolaroid(canvas.getContext('2d'), { ...spec, template, options, orientation: o, scale, mode });
  return canvas;
}

/**
 * The finished magnet. Default scale is print resolution (900 × 1200 /
 * 1200 × 900 at 3 × 4 in, 300 DPI); pass a smaller scale for previews.
 * spec: { templateId, options, orientation, name, date, photo?, crop? }
 */
export function renderComposite(spec, scale = PRINT_SCALE) {
  return render(spec, 'composite', scale);
}

/** The frame with a transparent photo window, `widthPx` wide. */
export function renderOverlay(spec, widthPx) {
  const o = normalizeOrientation(spec.orientation);
  return render({ ...spec, photo: null }, 'overlay', widthPx / DESIGN[o].w);
}

export function canvasToJpegBlob(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('JPEG encode failed'))), 'image/jpeg', quality);
  });
}

/** Load an image with anonymous CORS so canvases drawn from it stay untainted. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}
