/**
 * printImage.js — print a finished magnet at its true physical size.
 *
 * The page is PRINT_SPEC (3 × 4 in, one half of the DNP 6 × 4 in media).
 * A landscape magnet is rotated 90° onto the same portrait page, so the
 * printer always gets one page size. Nothing is re-framed here: the image is
 * already the finished magnet.
 */
import { PRINT_SPEC } from '@/lib/polaroid/printSpec';

/** The image as a portrait page bitmap (landscape → rotated 90° clockwise). */
function toPortraitPage(source) {
  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (w > h) {
    canvas.width = h; canvas.height = w;
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
  } else {
    canvas.width = w; canvas.height = h;
  }
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Open a print popup with `copies` pages of the image (each on its own page)
 * and trigger a single window.print(). Throws 'POPUP_BLOCKED'.
 * @param {HTMLCanvasElement|HTMLImageElement} source  the finished magnet
 */
export function printImage(source, copies = 1) {
  const dataUrl = toPortraitPage(source);
  const n = Math.max(1, Math.min(20, Math.round(copies) || 1));
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) throw new Error('POPUP_BLOCKED');

  const { widthIn: w, heightIn: h } = PRINT_SPEC;
  // One <img> per copy; every page but the last forces a break, so the
  // printer emits N magnets from ONE popup and ONE window.print().
  const imgs = Array.from({ length: n }, (_, i) =>
    `<img class="${i < n - 1 ? 'brk' : ''}" src="${dataUrl}">`
  ).join('');

  win.document.write(`<!DOCTYPE html><html><head><title>Memoria</title>
<style>
  @page { size: ${w}in ${h}in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  img { display: block; width: ${w}in; height: ${h}in; object-fit: contain; page-break-inside: avoid; }
  .brk { page-break-after: always; break-after: page; }
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
