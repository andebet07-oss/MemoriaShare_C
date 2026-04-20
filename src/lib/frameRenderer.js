import { LABEL_H_RATIO } from '@/components/magnet/framePacks';

function previewBgToPhotoColor(previewBg = '') {
  const match = previewBg.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#1a1410';
}

/**
 * Draws a frame onto a canvas element with a simulated photo background.
 * @param {HTMLCanvasElement} el
 * @param {object} frame  — frame object from framePacks.js
 * @param {{ name?: string, date?: string, tagline?: string }} eventData
 */
export function drawOnCanvas(el, frame, eventData = {}) {
  if (!el || !frame) return;
  const ctx = el.getContext('2d');
  const w   = el.width;
  const pH  = el.height - Math.round(w * LABEL_H_RATIO);
  const tH  = el.height;
  const photoColor = previewBgToPhotoColor(frame.previewBg);
  const grad = ctx.createLinearGradient(0, 0, w, pH);
  grad.addColorStop(0, photoColor);
  grad.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, tH);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pH);
  frame.drawFrame(ctx, w, tH, pH, {
    name:    eventData.name    || 'שם האירוע',
    date:    eventData.date    || null,
    tagline: eventData.tagline || null,
  });
}

/**
 * Overlays print-safety guides on an already-rendered canvas.
 * Pixel margins are computed from the frame's actual output width:
 *   pxPerMm = canvas.width / outputWidthMm
 *   bleed    = 3mm × pxPerMm
 *   typeSafe = 5mm × pxPerMm
 *
 * @param {HTMLCanvasElement} el
 * @param {number} outputWidthMm  — physical print width in mm (default 100)
 */
export function drawSafeZone(el, outputWidthMm = 100) {
  if (!el || !outputWidthMm) return;
  const ctx = el.getContext('2d');
  const w   = el.width;
  const h   = el.height;
  const pxPerMm  = w / outputWidthMm;
  const bleed    = Math.round(3 * pxPerMm);
  const typeSafe = Math.round(5 * pxPerMm);

  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,60,60,0.8)';
  ctx.strokeRect(bleed, bleed, w - bleed * 2, h - bleed * 2);
  ctx.strokeStyle = 'rgba(255,200,0,0.8)';
  ctx.strokeRect(typeSafe, typeSafe, w - typeSafe * 2, h - typeSafe * 2);
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.font = `bold 8px monospace`;
  ctx.fillStyle = 'rgba(255,60,60,0.9)';
  ctx.fillText(`bleed 3mm (${bleed}px @ ${outputWidthMm}mm)`, bleed + 3, bleed + 9);
  ctx.fillStyle = 'rgba(255,200,0,0.9)';
  ctx.fillText(`type-safe 5mm (${typeSafe}px)`, typeSafe + 3, typeSafe + 9);
  ctx.restore();
}
