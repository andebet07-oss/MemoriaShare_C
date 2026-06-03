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
// Photo hole: exactly 776×1031 px as specified by the Pacdora template.
// White border: 50px on left/right/top → clearly visible polaroid frame.
// Bottom strip: 185px for name/date/decoration (≈15% of total height).
const HOLE_W  = 776;
const HOLE_H  = 1031;
const BORDER  = 50;           // top / left / right border
const HOLE_X  = BORDER;       // 50
const HOLE_Y  = BORDER;       // 50
const STRIP_H = 185;
const W       = HOLE_W + BORDER * 2;   // 876
const STRIP_Y = HOLE_Y + HOLE_H;       // 1081
const H       = STRIP_Y + STRIP_H;     // 1266

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
  // Pure white background — no SVG effects, no shadows, no borders.
  // The photo inside the transparent hole provides natural contrast against
  // the white frame. Any graphic effect would bleed onto the white area.
  const framePng = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
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
    // Strip: y=1081..1266 (185px). Icon at ~y=1110, name at ~y=1155, date at ~y=1200
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.032, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.023, weight: '400', color: '#666666', align: 'center' },
      icon:       { emoji: '♡', y: 0.872, x: 0.5 },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-heart-calligraphy',
    src: 'frame-heart-calligraphy.png',
    decorations: [],
    textConfig: {
      event_name: { y: 0.912, font: 'Frank Ruhl Libre', size: 0.032, weight: '400', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.023, weight: '400', color: '#666666', align: 'center' },
      icon:       { emoji: '♡', y: 0.872, x: 0.5 },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-olive-branches',
    src: 'frame-olive-branches.png',
    decorations: [
      {
        region: { left: 255, top: 600, width: 118, height: 130 },
        targetW: 90,
        placement: (imgW, imgH) => ({
          left: Math.round(W / 2 - imgW - 45),
          top:  Math.round(STRIP_Y + 12),
        }),
      },
      {
        region: { left: 625, top: 600, width: 118, height: 130 },
        targetW: 90,
        placement: (imgW, imgH) => ({
          left: Math.round(W / 2 + 45),
          top:  Math.round(STRIP_Y + 12),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.030, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.022, weight: '400', color: '#666666', align: 'center' },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-wedding-car',
    src: 'frame-wedding-car.png',
    decorations: [
      {
        region: { left: 2, top: 600, width: 252, height: 130 },
        targetW: 170,
        placement: (imgW, imgH) => ({
          left: Math.round((W - imgW) / 2),
          top:  Math.round(STRIP_Y + 10),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.030, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.022, weight: '400', color: '#666666', align: 'center' },
      preserve_strip: true,
    },
  },
  {
    id: 'landscape-camera-heart',
    src: 'frame-camera-heart.png',
    decorations: [
      {
        region: { left: 2, top: 580, width: 158, height: 150 },
        targetW: 100,
        placement: (imgW, imgH) => ({
          left: Math.round((W - imgW) / 2),
          top:  Math.round(STRIP_Y + 8),
        }),
      },
    ],
    textConfig: {
      event_name: { y: 0.912, font: 'Heebo', size: 0.030, weight: '700', color: '#1a1a1a', align: 'center' },
      date:       { y: 0.955, font: 'Heebo', size: 0.022, weight: '400', color: '#666666', align: 'center' },
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
