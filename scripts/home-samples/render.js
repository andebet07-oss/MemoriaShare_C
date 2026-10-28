// Renders the home page's sample magnets with the real renderer (see index.html).
import { renderComposite, loadImage } from '/src/lib/polaroid/renderPolaroid.js';
import { DESIGN } from '/src/lib/polaroid/printSpec.js';
import { PHOTOS, MAGNETS, THUMBNAILS } from '/src/components/home/samplePhotos.js';

const WEBP_QUALITY = 0.82;
const specs = { ...MAGNETS, ...THUMBNAILS };
const list = document.getElementById('list');
const status = document.getElementById('status');

const rendered = [];
for (const [id, spec] of Object.entries(specs)) {
  const photo = await loadImage(PHOTOS[spec.photo]);
  const scale = spec.width / DESIGN[spec.orientation].w;
  const canvas = await renderComposite({ ...spec, photo, options: spec.options ?? {} }, scale);
  const dataUrl = canvas.toDataURL('image/webp', WEBP_QUALITY);
  rendered.push({ file: `${id}.webp`, dataUrl });
  const fig = document.createElement('figure');
  const img = Object.assign(document.createElement('img'), { src: dataUrl, alt: '' });
  const link = Object.assign(document.createElement('a'), { href: dataUrl, download: `${id}.webp`, textContent: `${id}.webp` });
  const caption = document.createElement('figcaption');
  caption.append(link, ` · ${canvas.width}×${canvas.height}`);
  fig.append(img, caption);
  list.appendChild(fig);
}
status.textContent = `${rendered.length} magnets rendered. Save each file into public/samples/magnets/.`;
// For scripted export (e.g. a headless browser): the files as data URLs.
window.__homeSamples = rendered;
