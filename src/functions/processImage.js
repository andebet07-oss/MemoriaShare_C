/**
 * compressImage(source, options)
 * Client-side image compression via Canvas API.
 * Used by MagnetCamera for both live-capture and file-fallback paths.
 *
 * • Resizes so neither dimension exceeds maxDim (default 1600px, aspect preserved)
 * • Exports as image/webp at quality 0.65 by default
 * • Falls back to image/jpeg on pre-Safari-14 where toBlob('image/webp') returns null
 *
 * @param {File|Blob|HTMLCanvasElement} source
 *   Pass an HTMLCanvasElement to preserve pixel-level filters (e.g. vintage sepia)
 *   already baked into the canvas. Pass a File/Blob for the file-picker fallback.
 * @param {{ maxDim?: number, quality?: number, format?: string }} [options]
 * @returns {Promise<Blob>}
 */
export async function compressImage(
  source,
  { maxDim = 1600, quality = 0.65, format = 'image/webp' } = {},
) {
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');

  let drawSource, srcW, srcH;

  if (source instanceof HTMLCanvasElement) {
    // Canvas pixels already contain any CSS-filter effects applied at draw time
    drawSource = source;
    srcW = source.width;
    srcH = source.height;
  } else {
    // File / Blob — load into an Image element
    drawSource = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(source);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
    srcW = drawSource.naturalWidth || drawSource.width;
    srcH = drawSource.naturalHeight || drawSource.height;
  }

  // Scale down proportionally if either dimension exceeds maxDim
  let dstW = srcW;
  let dstH = srcH;
  if (srcW > maxDim || srcH > maxDim) {
    if (srcW >= srcH) {
      dstW = maxDim;
      dstH = Math.round((srcH / srcW) * maxDim);
    } else {
      dstH = maxDim;
      dstW = Math.round((srcW / srcH) * maxDim);
    }
  }

  out.width = dstW;
  out.height = dstH;
  ctx.drawImage(drawSource, 0, 0, dstW, dstH);

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        // WebP not supported — fall back to JPEG at same quality
        out.toBlob((jpegBlob) => {
          if (jpegBlob) resolve(jpegBlob);
          else reject(new Error('Canvas toBlob failed for both WebP and JPEG'));
        }, 'image/jpeg', quality);
      }
    }, format, quality);
  });
}

// ─── Legacy Edge Function wrapper ─────────────────────────────────────────────
// Kept for the MemoriaShare gallery flow which routes through the `processImage`
// Edge Function to generate thumbnail/medium/original variants server-side.
// The Magnet flow uses compressImage() above (client-side, no network roundtrip).
import { supabase } from '@/lib/supabase';

export async function processImage({ file_base64, file_name }) {
  try {
    const { data, error } = await supabase.functions.invoke('processImage', {
      body: { file_base64, file_name },
    });
    if (error) {
      console.warn('processImage Edge Function not available, falling back to direct upload:', error.message);
      return null;
    }
    return { data };
  } catch (error) {
    console.warn('processImage failed, falling back to direct upload:', error.message);
    return null;
  }
}
