/**
 * punchHole.js
 *
 * Turns a frame image into a transparent-window PNG: draws the frame to a
 * canvas at natural resolution, then clears the photo-window rectangle so the
 * guest photo shows through exactly there. This is what makes the fit "clean" —
 * compositePngFrame draws the photo, then the frame on top, so the window MUST
 * be transparent or the frame would cover the photo.
 *
 * hole_bbox is normalised 0–1 relative to the image's own dimensions.
 */

const px = (v, size) => Math.round((v ?? 0) * size);

/**
 * Draw the image and clear the hole rectangle. Returns the canvas.
 * `healBbox` (optional): a previous hole filled with white BEFORE clearing the
 * new one — used when re-editing an already-punched frame so the old transparent
 * window doesn't linger. White is correct for these white-bordered frames.
 */
export function punchHoleCanvas(imageEl, hole_bbox, healBbox = null) {
  const w = imageEl.naturalWidth || imageEl.width;
  const h = imageEl.naturalHeight || imageEl.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageEl, 0, 0, w, h);
  if (healBbox) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px(healBbox.x, w), px(healBbox.y, h), px(healBbox.w, w), px(healBbox.h, h));
  }
  ctx.clearRect(px(hole_bbox.x, w), px(hole_bbox.y, h), px(hole_bbox.w, w), px(hole_bbox.h, h));
  return canvas;
}

/** Punched PNG as a data URL — used for the live editor preview. */
export function punchHoleToDataUrl(imageEl, hole_bbox, healBbox = null) {
  return punchHoleCanvas(imageEl, hole_bbox, healBbox).toDataURL('image/png');
}

/** Punched PNG as a Blob — used when uploading the frame asset. */
export function punchHoleToBlob(imageEl, hole_bbox, healBbox = null) {
  return new Promise((resolve, reject) => {
    punchHoleCanvas(imageEl, hole_bbox, healBbox).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PUNCH_FAILED'))),
      'image/png',
    );
  });
}

/** Load an image with anonymous CORS so the canvas is never tainted. */
export function loadFrameImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`frame image load failed: ${src}`));
    img.src = src;
  });
}
