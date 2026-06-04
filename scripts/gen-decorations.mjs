/**
 * gen-decorations.mjs
 *
 * Exports the wedding "built-in" artwork (arrows / rings / couple) as STANDALONE
 * transparent PNG layers, cropped from the FRAMES-NEW WebP mock-ups.
 *
 * These are no longer baked into the frame PNG. Instead they are composited
 * dynamically by compositePngFrame.js (print) and FrameStripText.jsx (camera)
 * at positions/sizes stored in frames_meta.text_config.decorations — so the
 * admin can move and resize them in the editor.
 *
 * Output: public/FRAMES/deco-<id>.png
 * Run:    node scripts/gen-decorations.mjs
 *
 * Also prints suggested default decoration arrays (normalised x/y/w relative to
 * the 876×1266 frame) for the DB migration.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const NEW_DIR    = path.join(__dirname, '../public/FRAMES1/FRAMES-NEW');
const OUT_DIR    = path.join(__dirname, '../public/FRAMES');

// Frame geometry the defaults are relative to (must match gen-portrait-frames.mjs)
const FW = 876, FH = 1266, STRIP_Y = 1081;

/** Crop + key near-white pixels to transparent (line-art artwork). */
async function cropKeyed(src, region, threshold = 208) {
  const { data, info } = await sharp(src).extract(region).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold && data[i+1] > threshold && data[i+2] > threshold) data[i+3] = 0;
  }
  return sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** Crop opaque (preserves white content like a bride's dress). */
async function cropOpaque(src, region) {
  return sharp(src).extract(region).png().toBuffer();
}

const ASSETS = [
  { id: 'arrow-left',  src: '17.jpg.webp', region: { left: 180, top: 636, width: 185, height: 42 },  keyed: true },
  { id: 'arrow-right', src: '17.jpg.webp', region: { left: 632, top: 636, width: 190, height: 42 },  keyed: true },
  { id: 'rings',       src: '11.jpg.webp', region: { left: 452, top: 631, width: 92,  height: 50 },  keyed: true },
  { id: 'couple',      src: '45.jpg.webp', region: { left: 802, top: 500, width: 158, height: 228 }, keyed: false },
];

// Default placements per frame (normalised to FW×FH), matching the previous
// baked positions. x/y = CENTRE, w = width fraction.
const DEFAULTS = {
  'wedding-arrows': [
    { id: 'arrow-left',  x: 0.113, y: 0.909, w: 0.171 },
    { id: 'arrow-right', x: 0.887, y: 0.909, w: 0.171 },
  ],
  'wedding-rings':  [
    { id: 'rings',  x: 0.5,   y: 0.877, w: 0.091 },
  ],
  'wedding-couple': [
    { id: 'couple', x: 0.905, y: 0.930, w: 0.150 },
  ],
};

const BASE_URL = 'https://www.memoriashare.com/FRAMES';

async function run() {
  console.log(`Frame ref: ${FW}×${FH}\n`);
  const dims = {};
  for (const a of ASSETS) {
    const src = path.join(NEW_DIR, a.src);
    const buf = a.keyed ? await cropKeyed(src, a.region) : await cropOpaque(src, a.region);
    const out = path.join(OUT_DIR, `deco-${a.id}.png`);
    await sharp(buf).png({ compressionLevel: 9 }).toFile(out);
    const meta = await sharp(buf).metadata();
    dims[a.id] = { w: meta.width, h: meta.height };
    console.log(`  ✓ deco-${a.id}.png  (${meta.width}×${meta.height}, ${a.keyed ? 'keyed' : 'opaque'})`);
  }

  console.log('\n── decorations JSON for migration ──────────────────────────────');
  for (const [frameId, decos] of Object.entries(DEFAULTS)) {
    const arr = decos.map(d => ({ id: d.id, url: `${BASE_URL}/deco-${d.id}.png`, x: d.x, y: d.y, w: d.w }));
    console.log(`\n  ${frameId}:`);
    console.log(`  ${JSON.stringify(arr)}`);
  }
  console.log('\nDone.');
}

run().catch(err => { console.error('FAILED:', err); process.exit(1); });
