/**
 * icons.js — template icons drawn on canvas from their SVG geometry.
 */
const HEART = 'M12 20.5c-.3 0-.6-.1-.8-.3C8.6 18 3 13.6 3 9.2 3 6.3 5.2 4 7.9 4c1.7 0 3.2.9 4.1 2.3C12.9 4.9 14.4 4 16.1 4 18.8 4 21 6.3 21 9.2c0 4.4-5.6 8.8-8.2 11-.2.2-.5.3-.8.3z';
// The first ring's arc that passes over the second ring (so the rings interlock).
const RING_ARC = 'M21.13 21.14 A8 8 0 0 1 18.76 23.06';
const SPARKLE = 'M31 1 L31.8 3.2 L34 4 L31.8 4.8 L31 7 L30.2 4.8 L28 4 L30.2 3.2 Z';

const paths = {};
const path = (key, d) => (paths[key] ??= new Path2D(d));

const STROKE = 1.2;
const UNDER_STROKE = 4;

/** Two interlocking thin rings with a small four-point sparkle (viewBox 40 × 26). */
function drawRings(ctx, color, paper) {
  const ring = (cx) => { ctx.beginPath(); ctx.arc(cx, 16, 8, 0, Math.PI * 2); };
  // Stroke a shape over a paper-coloured under-stroke so it cuts what it crosses.
  const over = (draw) => {
    ctx.strokeStyle = paper; ctx.lineWidth = UNDER_STROKE; draw();
    ctx.strokeStyle = color; ctx.lineWidth = STROKE; draw();
  };
  ctx.lineCap = 'butt';
  ctx.strokeStyle = color; ctx.lineWidth = STROKE;
  ring(15); ctx.stroke();
  over(() => { ring(25); ctx.stroke(); });
  over(() => ctx.stroke(path('ringArc', RING_ARC)));
  ctx.fillStyle = color;
  ctx.fill(path('sparkle', SPARKLE));
}

/** Draw an icon into the box (x, y, w, h) in pixels. */
export function drawIcon(ctx, { icon, x, y, w, h, color }, paper) {
  ctx.save();
  ctx.translate(x, y);
  if (icon === 'heart') {
    ctx.scale(w / 24, h / 24);
    ctx.fillStyle = color;
    ctx.fill(path('heart', HEART));
  } else if (icon === 'rings') {
    ctx.scale(w / 40, h / 26);
    drawRings(ctx, color, paper);
  }
  ctx.restore();
}
