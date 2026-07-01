import { compositePngFrame } from '@/lib/compositePngFrame';

/**
 * useFaceCrop — the AI + crop engine for MagnetProStation.
 *
 * Face detection is SIMULATED for now behind a swappable interface (FACE_ENGINE);
 * the rest of the pipeline (auto-crop, manual pan/zoom, frame re-composite) is real
 * and unchanged when the real detector lands.
 *
 * The pure functions are exported at module scope so non-React helpers
 * (e.g. buildMagnetBlob) can reuse them; the useFaceCrop() hook returns the same
 * functions for convenience inside components.
 *
 * crop_config shape: { aspect:'3:4'|'4:3', panX, panY, zoom }
 *   - panX/panY  normalised centre of the crop window in source-image coords (0..1)
 *   - zoom       ≥ 1, magnifies (shrinks the source rect around the centre)
 */

const FACE_ENGINE = 'sim'; // 'sim' | 'faceapi'

// Load an <img> with anonymous CORS so the resulting canvas is never tainted.
export function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

function canvasToImage(canvas) {
  return loadImageEl(canvas.toDataURL('image/jpeg', 0.95));
}

/**
 * SIMULATED face detection. Deterministic per image (samples a downscaled copy
 * and hashes the pixels) so re-running yields a stable count/boxes — important
 * because auto-analysis persists the result and must not flip on every re-render.
 *
 * ── To swap in face-api.js later, replace ONLY this function body: ──
 *   import * as faceapi from 'face-api.js';
 *   await faceapi.nets.tinyFaceDetector.loadFromUri('/models'); // once, in an effect
 *   const res = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
 *   return { count: res.length, boxes: res.map(r => ({
 *     x: r.box.x / img.naturalWidth,  y: r.box.y / img.naturalHeight,
 *     w: r.box.width / img.naturalWidth, h: r.box.height / img.naturalHeight })) };
 */
function detectFacesSim(img) {
  const W = 32, H = 32;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  let hash = 0;
  try {
    const { data } = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < data.length; i += 40) hash = (hash * 31 + data[i]) & 0xffffffff;
  } catch {
    hash = (img.naturalWidth || 1) * 7 + (img.naturalHeight || 1) * 13;
  }
  const count = 1 + (Math.abs(hash) % 4); // 1..4 people
  // Believable boxes: spread across the upper-centre band where faces usually sit.
  const boxes = Array.from({ length: count }, (_, i) => {
    const cx = count === 1 ? 0.5 : 0.5 + ((i - (count - 1) / 2) * 0.62) / count;
    return { x: Math.max(0, cx - 0.09), y: 0.28, w: 0.18, h: 0.22 };
  });
  return { count, boxes };
}

// Returns { count, boxes } — boxes normalised (0..1). Accepts an <img> element.
export async function detectFaces(img) {
  if (FACE_ENGINE === 'sim') return detectFacesSim(img);
  return detectFacesSim(img); // fallback until a real engine is wired
}

// Face-centered crop config: centre the window on the face centroid, no zoom,
// so the maximum area is kept and no face is pushed out of frame.
export function computeAutoCrop({ boxes, aspect }) {
  if (!boxes?.length) return { aspect, panX: 0.5, panY: 0.5, zoom: 1 };
  let sx = 0, sy = 0;
  for (const b of boxes) { sx += b.x + b.w / 2; sy += b.y + b.h / 2; }
  return {
    aspect,
    panX: Math.min(1, Math.max(0, sx / boxes.length)),
    panY: Math.min(1, Math.max(0, sy / boxes.length)),
    zoom: 1,
  };
}

// Source-pixel crop rectangle for a given config.
export function cropRect(imgW, imgH, cfg) {
  const ar = cfg?.aspect === '4:3' ? 4 / 3 : 3 / 4;
  let baseW, baseH;
  if (imgW / imgH > ar) { baseH = imgH; baseW = imgH * ar; }
  else { baseW = imgW; baseH = imgW / ar; }
  const z = Math.max(1, cfg?.zoom || 1);
  const w = baseW / z, h = baseH / z;
  let x = (cfg?.panX ?? 0.5) * imgW - w / 2;
  let y = (cfg?.panY ?? 0.5) * imgH - h / 2;
  x = Math.max(0, Math.min(imgW - w, x));
  y = Math.max(0, Math.min(imgH - h, y));
  return { x, y, w, h };
}

// Draw the cropped region into a fixed-resolution canvas of the chosen aspect.
export function applyCrop(img, cfg) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const { x, y, w, h } = cropRect(iw, ih, cfg);
  const outW = cfg?.aspect === '4:3' ? 1600 : 1200;
  const outH = cfg?.aspect === '4:3' ? 1200 : 1600;
  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, x, y, w, h, 0, 0, outW, outH);
  return canvas;
}

// Cropped photo → framed magnet canvas (WYSIWYG). `maxWidth` keeps previews light.
export async function composePreview(croppedCanvas, frame, opts = {}) {
  const photoImg = await canvasToImage(croppedCanvas);
  return compositePngFrame(photoImg, frame, opts);
}

export function useFaceCrop() {
  return { detectFaces, computeAutoCrop, cropRect, applyCrop, composePreview, loadImageEl };
}
