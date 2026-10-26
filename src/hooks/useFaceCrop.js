/**
 * useFaceCrop — face detection + face-centred auto-crop for MagnetProStation.
 *
 * Face detection is SIMULATED for now behind a swappable interface (FACE_ENGINE);
 * the crop itself (cover, pan, zoom) is drawn by the polaroid renderer
 * (photoSourceRect in src/lib/polaroid/renderPolaroid.js).
 *
 * crop_config shape: { orientation:'portrait'|'landscape', panX, panY, zoom }
 *   - panX/panY  normalised centre of the crop window in source-image coords (0..1)
 *   - zoom       ≥ 1, magnifies (shrinks the source rect around the centre)
 */

const FACE_ENGINE = 'sim'; // 'sim' | 'faceapi'

// Gates face-count UI. Flip to true only once detectFaces() really calls a
// detector — simulated counts must never be shown to the operator.
export const HAS_REAL_FACE_ENGINE = FACE_ENGINE !== 'sim';

/**
 * SIMULATED face detection. Deterministic per image (samples a downscaled copy
 * and hashes the pixels) so re-running yields a stable count/boxes — important
 * because the crop editor re-runs it and the auto-crop must not jump between opens.
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
export function computeAutoCrop({ boxes, orientation }) {
  if (!boxes?.length) return { orientation, panX: 0.5, panY: 0.5, zoom: 1 };
  let sx = 0, sy = 0;
  for (const b of boxes) { sx += b.x + b.w / 2; sy += b.y + b.h / 2; }
  return {
    orientation,
    panX: Math.min(1, Math.max(0, sx / boxes.length)),
    panY: Math.min(1, Math.max(0, sy / boxes.length)),
    zoom: 1,
  };
}

export function useFaceCrop() {
  return { detectFaces, computeAutoCrop };
}
