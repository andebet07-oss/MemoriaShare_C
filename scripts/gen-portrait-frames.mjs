/**
 * gen-portrait-frames.mjs
 *
 * Generates portrait 3:4 versions of the 5 landscape wedding/general frames
 * stored in public/FRAMES/. The source landscape PNGs (1000×730) have an
 * approximate 4:3 hole and a bottom strip with baked placeholder text and
 * decorative art. The compositor (compositePngFrame.js) renders text
 * dynamically via text_config, so these new PNGs must have:
 *   - NO baked text in the strip
 *   - Only the decorative illustration (olive branches, car, camera…)
 *   - A transparent 3:4 photo hole
 *   - The same gray vignette inner-border style as the originals
 *
 * Output: public/FRAMES/<id>-portrait.png (×5)
 * Run:    node scripts/gen-portrait-frames.mjs
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, '../public/FRAMES');

// ── Portrait canvas geometry ───────────────────────────────────────────────
const W      = 1000;
const BORDER = 40;          // top / left / right border width (px)
const HOLE_X = BORDER;      // 40
const HOLE_Y = BORDER;      // 40
const HOLE_W = W - BORDER * 2;              // 920
const HOLE_H = Math.round(HOLE_W * 4 / 3); // 1227  (exact 3:4)
const STRIP_Y = HOLE_Y + HOLE_H;           // 1267
const STRIP_H = 190;
const H = STRIP_Y + STRIP_H;               // 1457

console.log(`Canvas: ${W}×${H}  Hole: ${HOLE_W}×${HOLE_H} at (${HOLE_X},${HOLE_Y})`);
console.log(`Hole bbox (normalised): { x:${(HOLE_X/W).toFixed(4)}, y:${(HOLE_Y/H).toFixed(4)}, w:${(HOLE_W/W).toFixed(4)}, h:${(HOLE_H/H).toFixed(4)} }`);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a solid RGBA buffer (alpha 0–255). */
async function solidBuffer(w, h, r, g, b, a = 255) {
  return sharp({ create: { width: w, height: h, channels: 4,
    background: { r, g, b, alpha: a / 255 } } })
    .raw().toBuffer();
}

/** Crop a region from a source file and resize (optional). */
async function cropAndResize(srcPath, region, { width, height } = {}) {
  let p = sharp(srcPath).extract(region);
  if (width || height) p = p.resize({ width, height, fit: 'inside', withoutEnlargement: false });
  return p.png().toBuffer();
}

/**
 * Crop a region, make near-white pixels transparent, then resize.
 * This cleanly extracts only the illustration artwork (branches, car, camera)
 * from the landscape frame strip, discarding the semi-opaque gray vignette
 * background pixels that would otherwise leave a gray halo on the portrait strip.
 * threshold: pixels where R,G,B all exceed this value become alpha=0.
 */
async function cropInfo(srcPath, region, targetW, threshold = 208) {
  // 1. Crop with full RGBA preserved
  const raw = await sharp(srcPath).extract(region).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;

  // 2. Zero-alpha every near-white pixel
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold && data[i+1] > threshold && data[i+2] > threshold) {
      data[i+3] = 0;
    }
  }

  // 3. Re-encode as PNG (RGBA)
  const cleaned = await sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();

  // 4. Resize to target width
  const meta = await sharp(cleaned).metadata();
  const scale = targetW / meta.width;
  const targetH = Math.round(meta.height * scale);
  const resized = await sharp(cleaned).resize(targetW, targetH).png().toBuffer();
  return { buffer: resized, width: targetW, height: targetH };
}

// ── Base frame builder ─────────────────────────────────────────────────────
/**
 * Builds the base portrait frame PNG:
 *   - white background
 *   - soft gray inner-vignette border (matching source style)
 *   - transparent 3:4 photo hole
 */
async function buildBase() {
  // SVG produces the white background + soft gray vignette border.
  // The vignette is a blurred gray stroke on the inside of the frame edge,
  // matching the subtle depth effect in the original landscape frames.
  const vignetteInset = 14;
  const vigSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="b" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="17"/>
    </filter>
  </defs>
  <!-- White base -->
  <rect width="${W}" height="${H}" fill="white"/>
  <!-- Blurred gray inner-edge ring: sits just outside the hole, inside the border -->
  <rect x="${vignetteInset}" y="${vignetteInset}"
        width="${W - vignetteInset * 2}" height="${H - vignetteInset * 2}"
        rx="4" fill="none"
        stroke="rgba(138,138,138,0.58)" stroke-width="32"
        filter="url(#b)"/>
  <!-- Recover white fill inside vignette ring (non-hole area) -->
  <rect x="${BORDER + 1}" y="${BORDER + 1}"
        width="${HOLE_W - 2}" height="${HOLE_H - 2}"
        fill="white"/>
  <!-- Bottom strip is also white -->
  <rect x="0" y="${STRIP_Y}" width="${W}" height="${STRIP_H}" fill="white"/>
</svg>`);

  // Rasterise SVG → RGBA PNG
  const framePng = await sharp(vigSvg, { density: 96 })
    .resize(W, H)
    .ensureAlpha()
    .png()
    .toBuffer();

  // Cut the transparent photo hole using dest-out
  const holeMask = await solidBuffer(HOLE_W, HOLE_H, 255, 255, 255, 255);
  const withHole = await sharp(framePng)
    .composite([{
      input: holeMask,
      raw: { width: HOLE_W, height: HOLE_H, channels: 4 },
      left: HOLE_X,
      top: HOLE_Y,
      blend: 'dest-out',
    }])
    .png()
    .toBuffer();

  return withHole;
}

// ── Per-frame decoration configs ───────────────────────────────────────────
//
// For each frame the source landscape PNG (1000×730) is cropped to extract
// ONLY the illustration pixels (avoiding the baked placeholder text).
// The illustration is then scaled and composited onto the portrait strip.
//
// Source strip coordinate reference (landscape 1000×730):
//   - Inner hole ends at approximately y=610
//   - Strip (decoration zone): y=605..730
//   - Text in strip: centred around y=660-695
//
// Illustration bounding boxes are conservative (no text pixels):

const FRAMES = [
  {
    id: 'landscape-heart-simple',
    src: 'frame-heart-simple.png',
    // Only a small typographic heart — too small/mixed with text to crop cleanly.
    // Leave no image decoration; text_config icon provides the ♡ emoji.
    decorations: [],
    textConfig: {
      event_name: { y: 0.905, font: 'Heebo', size: 0.028, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.952, font: 'Heebo', size: 0.020, weight: '400', color: '#666666', align: 'center' },
      icon:       { emoji: '♡', y: 0.872, x: 0.5 },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-heart-calligraphy',
    src: 'frame-heart-calligraphy.png',
    // The calligraphy heart is a font glyph inline with the names — too small.
    decorations: [],
    textConfig: {
      event_name: { y: 0.905, font: 'Frank Ruhl Libre', size: 0.028, weight: '400', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.952, font: 'Heebo', size: 0.020, weight: '400', color: '#666666', align: 'center' },
      icon:       { emoji: '♡', y: 0.872, x: 0.5 },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-olive-branches',
    src: 'frame-olive-branches.png',
    // Left olive bunch: far-left of strip, before any text; right bunch: far-right.
    // Source text starts ~x=370 and ends ~x=640, so we stay well clear.
    // Start crop at y=622 to clear the landscape frame's bottom vignette border (y≈608-621).
    decorations: [
      {
        region: { left: 255, top: 600, width: 118, height: 130 }, // left bunch
        targetW: 100,
        placement: (imgW, imgH) => ({
          left: Math.round(W / 2 - imgW - 55),
          top:  Math.round(STRIP_Y + (STRIP_H - imgH) / 2 - 12),
        }),
      },
      {
        region: { left: 625, top: 600, width: 118, height: 130 }, // right bunch
        targetW: 100,
        placement: (imgW, imgH) => ({
          left: Math.round(W / 2 + 55),
          top:  Math.round(STRIP_Y + (STRIP_H - imgH) / 2 - 12),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.026, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.019, weight: '400', color: '#666666', align: 'center' },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-wedding-car',
    src: 'frame-wedding-car.png',
    // Car illustration on the left side; text starts ~x=270 in source.
    // Start crop at y=620 to clear the landscape frame's bottom vignette border.
    decorations: [
      {
        region: { left: 2, top: 600, width: 252, height: 130 },
        targetW: 190,
        // Centre the car above the caption in the portrait strip
        placement: (imgW, imgH) => ({
          left: Math.round((W - imgW) / 2),
          top:  Math.round(STRIP_Y + 8),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.026, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.019, weight: '400', color: '#666666', align: 'center' },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-camera-heart',
    src: 'frame-camera-heart.png',
    // Camera icon at bottom-left; text starts ~x=175 in source.
    decorations: [
      {
        region: { left: 2, top: 580, width: 158, height: 150 },
        targetW: 110,
        placement: (imgW, imgH) => ({
          left: Math.round((W - imgW) / 2),
          top:  Math.round(STRIP_Y + 4),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.026, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.019, weight: '400', color: '#666666', align: 'center' },
      preserve_strip: true,
    },
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('\nBuilding base portrait frame…');
  const base = await buildBase();
  console.log('  ✓ base built');

  for (const frame of FRAMES) {
    console.log(`\nProcessing ${frame.id}…`);
    const srcPath = path.join(FRAMES_DIR, frame.src);

    // Start from a fresh base for each frame
    let composite = [...[]]; // compositing layers to apply

    // Prepare decoration crops
    for (const dec of frame.decorations) {
      const { buffer, width, height } = await cropInfo(srcPath, dec.region, dec.targetW);
      const { left, top } = dec.placement(width, height);
      console.log(`  decoration: ${width}×${height} → (${left}, ${top})`);
      composite.push({ input: buffer, left, top });
    }

    let output;
    if (composite.length > 0) {
      output = await sharp(base).composite(composite).png().toBuffer();
    } else {
      output = base;
    }

    const outName = `${frame.src.replace('.png', '')}-portrait.png`;
    const outPath = path.join(FRAMES_DIR, outName);
    await sharp(output).png({ compressionLevel: 8 }).toFile(outPath);
    console.log(`  ✓ saved → ${outName}`);
  }

  // Print summary for DB migration
  console.log('\n\n── DB migration values ────────────────────────────────────────');
  console.log(`Hole bbox (same for all): ${JSON.stringify({
    x: parseFloat((HOLE_X/W).toFixed(4)),
    y: parseFloat((HOLE_Y/H).toFixed(4)),
    w: parseFloat((HOLE_W/W).toFixed(4)),
    h: parseFloat((HOLE_H/H).toFixed(4)),
  })}`);
  for (const frame of FRAMES) {
    const outName = frame.src.replace('.png', '') + '-portrait.png';
    console.log(`\n  frame_id: '${frame.id}'`);
    console.log(`  image_url: 'https://www.memoriashare.com/FRAMES/${outName}'`);
    console.log(`  text_config: ${JSON.stringify(frame.textConfig)}`);
  }

  console.log('\n\nDone.');
}

run().catch(err => { console.error('FAILED:', err); process.exit(1); });
