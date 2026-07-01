/**
 * Opens a print-ready popup that renders `dataUrl` `copies` times (each on its
 * own page) and triggers a single window.print(). Shared by both print paths.
 * Throws 'POPUP_BLOCKED' if the browser blocks the popup.
 */
function openPrintPopup(dataUrl, copies = 1) {
  const n = Math.max(1, Math.min(20, Math.round(copies) || 1));
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) throw new Error('POPUP_BLOCKED');

  // One <img> per copy; every page but the last forces a page break so the
  // printer emits N physical magnets from ONE popup and ONE window.print().
  const imgs = Array.from({ length: n }, (_, i) =>
    `<img class="${i < n - 1 ? 'brk' : ''}" src="${dataUrl}">`
  ).join('');

  win.document.write(`<!DOCTYPE html><html><head><title>Print Photo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; }
  img { display: block; margin: 0 auto; max-width: 100%; max-height: 100vh; }
  .brk { page-break-after: always; }
  @media print {
    html, body { height: auto; margin: 0; }
    img { width: 100%; height: auto; page-break-inside: avoid; }
    img.brk { page-break-after: always; }
  }
</style></head>
<body>${imgs}
<script>
  // Wait for every image to decode before printing so no page is blank.
  var imgs = Array.prototype.slice.call(document.images);
  var left = imgs.length;
  function go(){ if(--left <= 0) setTimeout(function(){ window.print(); }, 150); }
  imgs.forEach(function(im){ if(im.complete) go(); else { im.onload = go; im.onerror = go; } });
<\/script>
</body></html>`);
  win.document.close();
}

/**
 * applyOverlayFrame(photoUrl, overlayUrl?, copies?)
 *
 * Composites a guest photo with the event's overlay PNG frame on an
 * off-screen canvas, then opens a print-ready popup and triggers window.print().
 *
 * If overlayUrl is null/undefined, the photo is printed without a frame.
 * If the overlay fails to load, it is silently skipped (graceful fallback).
 * `copies` (default 1) prints that many physical magnets from ONE popup.
 */
export async function applyOverlayFrame(photoUrl, overlayUrl, copies = 1) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Step 1: draw the guest photo
  await new Promise((resolve, reject) => {
    const photo = new Image();
    photo.crossOrigin = 'anonymous';
    photo.onload = () => {
      canvas.width = photo.naturalWidth || photo.width;
      canvas.height = photo.naturalHeight || photo.height;
      ctx.drawImage(photo, 0, 0);
      resolve();
    };
    photo.onerror = reject;
    photo.src = photoUrl;
  });

  // Step 2: draw the overlay frame on top (full canvas size)
  if (overlayUrl) {
    await new Promise((resolve) => {
      const overlay = new Image();
      overlay.crossOrigin = 'anonymous';
      overlay.onload = () => {
        ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      overlay.onerror = resolve; // graceful: skip overlay, still print photo
      overlay.src = overlayUrl;
    });
  }

  // Step 3: open print popup (repeats the image `copies` times)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  openPrintPopup(dataUrl, copies);
}

/**
 * printCompositedBlob(blob, copies?)
 *
 * Prints an ALREADY-composited magnet (frame + text baked in) — used by the
 * MagnetProStation re-crop path, which regenerates the composite from the raw
 * photo + operator crop + frame. No overlay is re-applied here (the blob is
 * already the finished magnet). Prints `copies` physical magnets from ONE popup.
 * Throws 'POPUP_BLOCKED' if the popup is blocked.
 */
export function printCompositedBlob(blob, copies = 1) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        openPrintPopup(reader.result, copies); // reader.result is a data: URL
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('BLOB_READ_FAILED'));
    reader.readAsDataURL(blob);
  });
}
