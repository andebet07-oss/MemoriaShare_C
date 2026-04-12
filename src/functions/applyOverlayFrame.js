/**
 * applyOverlayFrame(photoUrl, overlayUrl?)
 *
 * Composites a guest photo with the event's overlay PNG frame on an
 * off-screen canvas, then opens a print-ready popup and triggers window.print().
 *
 * If overlayUrl is null/undefined, the photo is printed without a frame.
 * If the overlay fails to load, it is silently skipped (graceful fallback).
 */
export async function applyOverlayFrame(photoUrl, overlayUrl) {
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

  // Step 3: open print popup
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) throw new Error('POPUP_BLOCKED');

  win.document.write(`<!DOCTYPE html><html><head><title>Print Photo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  img { max-width: 100%; max-height: 100vh; }
  @media print {
    html, body { height: 100%; margin: 0; }
    img { width: 100%; height: auto; page-break-inside: avoid; }
  }
</style></head>
<body><img src="${dataUrl}" onload="setTimeout(function(){ window.print(); }, 150);"></body></html>`);
  win.document.close();
}
