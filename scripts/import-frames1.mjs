/**
 * import-frames1.mjs
 *
 * Triage + import the FRAMES1 webp templates into the frames_meta library.
 *
 * Usage:
 *   node scripts/import-frames1.mjs --triage          # classify only, no DB changes
 *   node scripts/import-frames1.mjs --import          # import A1 frames
 *   node scripts/import-frames1.mjs --import --dry    # show what would be imported
 *
 * Env: reads .env.local for VITE_SUPABASE_URL + VITE_SUPABASE_SERVICE_ROLE_KEY
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ── load env ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}
const isRealUpload = process.argv.includes('--import') && !process.argv.includes('--dry') && !process.argv.includes('--preview');
if (!SUPABASE_KEY && isRealUpload) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (required for --import without --preview)');
  process.exit(1);
}

const SUPABASE_KEY_FALLBACK = env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || SUPABASE_KEY_FALLBACK);

// ── constants ─────────────────────────────────────────────────────────────────
const FRAMES_DIR  = path.join(ROOT, 'public', 'FRAMES1', 'frames');
const TRIAGE_OUT  = path.join(ROOT, 'public', 'FRAMES1', 'frames-triage.json');

const MEMORIA_TEXT  = 'MEMORIA';
const MEMORIA_PHONE = '055-7209335';

const LIGHT_THRESHOLD = 230;  // luminance > this = "light pixel"
const MIN_LIGHT_RATIO = 0.25; // at least 25% of image must be light for A1

// ── helpers ───────────────────────────────────────────────────────────────────
function slugFromFilename(name) {
  return name
    .replace(/\.(jpg\.webp|webp|png)$/i, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
}

function categoryFromSlug(slug) {
  if (slug.includes('mit') || slug.includes('bar') || slug.includes('bat')) return 'bar_mitzvah';
  if (slug.includes('birth') || slug.includes('birthday')) return 'birthday';
  if (slug.includes('brit')) return 'brit';
  return 'wedding';
}

async function triageFrame(filePath) {
  const image = sharp(filePath);
  const meta  = await image.metadata();
  const { width, height } = meta;

  const { data } = await image
    .flatten({ background: '#ffffff' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let lightPixels = 0;
  const totalPixels = width * height;
  for (let i = 0; i < data.length; i += 3) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > LIGHT_THRESHOLD) lightPixels++;
  }

  const lightRatio = lightPixels / totalPixels;
  const aspect = Math.abs(width / height - 1) < 0.1 ? 'square'
    : width > height ? 'landscape'
    : 'portrait';
  const isA1 = lightRatio >= MIN_LIGHT_RATIO;

  return { aspect, lightRatio: Math.round(lightRatio * 100) / 100, isA1, width, height };
}

async function detectHoleBbox(filePath, width, height) {
  const { data } = await sharp(filePath)
    .flatten({ background: '#ffffff' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const light = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 3) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    light[Math.floor(i / 3)] = lum > LIGHT_THRESHOLD ? 1 : 0;
  }

  const margin = 0.05;
  const mx = Math.round(width  * margin);
  const my = Math.round(height * margin);

  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = my; y < height - my; y++) {
    for (let x = mx; x < width - mx; x++) {
      if (light[y * width + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { x: 0.05, y: 0.05, w: 0.90, h: 0.72 };
  }

  return {
    x: +(minX / width).toFixed(4),
    y: +(minY / height).toFixed(4),
    w: +((maxX - minX) / width).toFixed(4),
    h: +((maxY - minY) / height).toFixed(4),
  };
}

async function convertToFramePng(filePath, bbox, width, height) {
  const raw = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const data = Buffer.from(raw.data);

  // Erase the photo hole → fully transparent.
  // Always erase from the TOP of the interior (5% margin) down to bbox bottom,
  // so sample-photo frames with dark tops are fully cleared.
  const MARGIN    = 0.05;
  const STRIP_X   = 0.92; // right-edge MEMORIA strip starts here
  const hx  = Math.round(bbox.x * width);
  const hy  = Math.round(MARGIN * height);
  // Clip right edge to not exceed the MEMORIA strip (prevents SVG overwrite bug)
  const hRight = Math.min(Math.round((bbox.x + bbox.w) * width), Math.round(STRIP_X * width));
  const hBt = Math.round((bbox.y + bbox.h) * height);

  for (let y = hy; y < hBt; y++) {
    for (let x = hx; x < hRight; x++) {
      const idx = (y * width + x) * 4;
      data[idx + 3] = 0;
    }
  }

  // Mask the studio watermark area: the entire top strip from y=0 to bbox.y,
  // left 65% of width — that's where studio names typically appear.
  if (bbox.y > 0.052) {
    const wmBt = Math.round(bbox.y * height);
    const wmW  = Math.round(width * 0.65);
    for (let y = 0; y < wmBt; y++) {
      for (let x = 0; x < wmW; x++) {
        const idx = (y * width + x) * 4;
        data[idx]     = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  }

  // Erase right-edge strip (studio branding) → white
  const stripX = Math.round(width * STRIP_X);
  for (let y = 0; y < height; y++) {
    for (let x = stripX; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx]     = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  // Overlay MEMORIA + phone as vertical SVG text on the right strip
  const stripW   = width - stripX;
  const fontSize  = Math.max(8, Math.round(stripW * 0.55));
  const fontSizeS = Math.max(6, Math.round(fontSize * 0.72));

  const svgOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${stripW}" height="${height}">
    <rect width="${stripW}" height="${height}" fill="white"/>
    <text
      x="${stripW / 2}" y="${Math.round(height * 0.38)}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${fontSize}" font-weight="bold" fill="#2a2a2a"
      text-anchor="middle" dominant-baseline="middle"
      writing-mode="vertical-rl"
      transform="rotate(180 ${stripW / 2} ${Math.round(height * 0.38)})"
    >${MEMORIA_TEXT}</text>
    <text
      x="${stripW / 2}" y="${Math.round(height * 0.70)}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${fontSizeS}" fill="#555555"
      text-anchor="middle" dominant-baseline="middle"
      writing-mode="vertical-rl"
      transform="rotate(180 ${stripW / 2} ${Math.round(height * 0.70)})"
    >${MEMORIA_PHONE}</text>
  </svg>`);

  return sharp(data, { raw: { width, height, channels: 4 } })
    .composite([{ input: svgOverlay, left: stripX, top: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function uploadFrame(slug, pngBuffer, meta) {
  const storagePath = `overlays/library/photo_print/${slug}.png`;

  const { error: upErr } = await supabase.storage
    .from('overlays')
    .upload(storagePath, pngBuffer, { upsert: true, contentType: 'image/png' });
  if (upErr) throw new Error(`Storage: ${upErr.message}`);

  const { data: urlData } = supabase.storage.from('overlays').getPublicUrl(storagePath);
  const image_url = urlData.publicUrl;

  const { error: dbErr } = await supabase.from('frames_meta').upsert({
    frame_id:        slug,
    status:          'active',
    quality_score:   3,
    style:           'photo_print',
    palette:         'white',
    sort_weight:     0,
    output_width_mm: 100,
    image_url,
    hole_bbox:       meta.hole_bbox,
    text_config:     meta.text_config,
    aspect:          meta.aspect,
    category:        meta.category,
    name:            meta.name,
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'frame_id' });
  if (dbErr) throw new Error(`DB: ${dbErr.message}`);

  return image_url;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const doImport = args.includes('--import');
const dryRun   = args.includes('--dry');

const files = fs.readdirSync(FRAMES_DIR).filter(f => /\.(webp|png|jpg)$/i.test(f));
console.log(`\nFound ${files.length} files in FRAMES1/frames/\n`);

const triageResults = [];

for (const file of files) {
  const filePath = path.join(FRAMES_DIR, file);
  const slug     = slugFromFilename(file);
  const category = categoryFromSlug(slug);

  process.stdout.write(`  [triage] ${file.padEnd(30)} `);
  try {
    const { aspect, lightRatio, isA1, width, height } = await triageFrame(filePath);
    const entry = { file, slug, category, aspect, width, height, lightRatio, isA1, classification: isA1 ? 'A1' : 'A2' };
    triageResults.push(entry);
    console.log(`${isA1 ? '✓ A1' : '⚠ A2'}  light=${lightRatio}  ${aspect}  ${width}x${height}`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    triageResults.push({ file, slug, error: err.message });
  }
}

fs.writeFileSync(TRIAGE_OUT, JSON.stringify(triageResults, null, 2));

const a1 = triageResults.filter(f => f.isA1);
const a2 = triageResults.filter(f => f && !f.isA1 && !f.error);

console.log(`\n${'─'.repeat(60)}`);
console.log(`A1 (auto-import): ${a1.length}`);
console.log(`A2 (manual prep): ${a2.length}`);
console.log(`Triage saved → ${TRIAGE_OUT}\n`);

if (a2.length) {
  console.log('A2 files (need manual prep in Figma/Photoshop):');
  a2.forEach(f => console.log(`  ${f.file}`));
  console.log('');
}

if (!doImport) {
  console.log('Run with --import to process A1 frames.');
  process.exit(0);
}

// ── IMPORT A1 frames ──────────────────────────────────────────────────────────
const doPreview = args.includes('--preview');
const previewDir = path.join(ROOT, 'public', 'FRAMES1', 'preview');
if (doPreview) fs.mkdirSync(previewDir, { recursive: true });

console.log(`Importing ${a1.length} A1 frames${dryRun ? ' (DRY RUN)' : doPreview ? ' (PREVIEW — local only)' : ''}…\n`);
let ok = 0, fail = 0;

for (const frame of a1) {
  const filePath = path.join(FRAMES_DIR, frame.file);
  process.stdout.write(`  [import] ${frame.file.padEnd(30)} `);
  try {
    const bbox = await detectHoleBbox(filePath, frame.width, frame.height);

    const pngBuffer = await convertToFramePng(filePath, bbox, frame.width, frame.height);

    if (doPreview || dryRun) {
      const outFile = path.join(previewDir, `${frame.slug}.png`);
      fs.writeFileSync(outFile, pngBuffer);
      console.log(`PREVIEW  bbox=${JSON.stringify(bbox)}  → preview/${frame.slug}.png`);
      ok++;
      continue;
    }

    const text_config = {
      font: 'Heebo', weight: 'bold', size: 0.027, color: '#444444', align: 'center', y: 0.935,
    };

    const url = await uploadFrame(frame.slug, pngBuffer, {
      hole_bbox: bbox, text_config,
      aspect:    frame.aspect,
      category:  frame.category,
      name:      frame.slug.replace(/-/g, ' '),
    });

    console.log(`✓  …${url.slice(-45)}`);
    ok++;
  } catch (err) {
    console.log(`FAIL  ${err.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} processed, ${fail} failed.`);
if (doPreview) console.log(`Preview PNGs saved to public/FRAMES1/preview/`);
if (fail) process.exit(1);
