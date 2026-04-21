/**
 * detectHoleBbox.js
 *
 * Analyses a PNG's alpha channel to find the rectangular transparent "hole"
 * used as the photo area in photo-booth frame templates.
 *
 * Returns the bbox in normalised 0-1 coordinates and a confidence score:
 *   1.0 = perfect transparent rectangle
 *   <0.7 = irregular shape — fall back to manual HolePicker
 *
 * Usage:
 *   const { bbox, confidence } = await detectHoleBbox(file);   // File | HTMLImageElement
 */

const ALPHA_THRESH = 8;   // pixels with alpha < this are "transparent"
const MIN_HOLE_RATIO = 0.25; // hole must be at least 25% of image area
const SCAN_MAX = 800;     // scale down to this before pixel scan (perf)

async function toLoadedImage(source) {
  if (source instanceof HTMLImageElement) return source;
  const url = source instanceof File ? URL.createObjectURL(source) : source;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (source instanceof File) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (source instanceof File) URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for bbox detection'));
    };
    img.src = url;
  });
}

/**
 * @param {File|HTMLImageElement} source
 * @returns {Promise<{ bbox: {x,y,w,h}|null, confidence: number }>}
 *   bbox is normalised 0-1; null when no clear hole detected.
 */
export async function detectHoleBbox(source) {
  const img = await toLoadedImage(source);

  const iw = img.naturalWidth  || img.width  || 800;
  const ih = img.naturalHeight || img.height || 1200;

  // Scale down for a fast pixel scan
  const scale = Math.min(SCAN_MAX / iw, SCAN_MAX / ih, 1);
  const sw = Math.max(1, Math.round(iw * scale));
  const sh = Math.max(1, Math.round(ih * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sw; canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, sw, sh);

  const { data, width: W, height: H } = ctx.getImageData(0, 0, sw, sh);

  // Find bounding box of interior transparent pixels (ignore 1-px outer border
  // to avoid counting transparent padding that some PNGs have around the whole image)
  let minX = W, minY = H, maxX = -1, maxY = -1;

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (data[(y * W + x) * 4 + 3] < ALPHA_THRESH) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return { bbox: null, confidence: 0 }; // no transparent pixels found

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;
  const bboxArea = bboxW * bboxH;

  if (bboxArea / (W * H) < MIN_HOLE_RATIO) {
    return { bbox: null, confidence: 0 }; // hole too small — probably just decorative transparency
  }

  // Confidence = fraction of pixels inside the bbox that are actually transparent.
  // A clean rectangle scores ~1.0; irregular / feathered shapes score lower.
  let innerTransparent = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * W + x) * 4 + 3] < ALPHA_THRESH) innerTransparent++;
    }
  }

  const confidence = innerTransparent / bboxArea;

  return {
    bbox: {
      x: minX / W,
      y: minY / H,
      w: bboxW / W,
      h: bboxH / H,
    },
    confidence,
  };
}
