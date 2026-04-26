/**
 * gen-insert-sql.mjs
 * Reads A1 frames from triage JSON, computes hole_bbox for each,
 * and outputs a ready-to-run SQL INSERT for frames_meta.
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const FRAMES_DIR  = path.join(ROOT, 'public', 'FRAMES1', 'frames');
const TRIAGE_FILE = path.join(ROOT, 'public', 'FRAMES1', 'frames-triage.json');
const BASE_URL    = 'https://memoriashare.com/FRAMES';

const LIGHT_THRESHOLD = 230;

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

  // Clip right edge to exclude the MEMORIA strip (right 8%)
  const STRIP_X = 0.92;
  const clampedMaxX = Math.min(maxX, Math.round(STRIP_X * width) - 1);

  return {
    x: +(minX / width).toFixed(4),
    y: +(minY / height).toFixed(4),
    w: +((clampedMaxX - minX) / width).toFixed(4),
    h: +((maxY - minY) / height).toFixed(4),
  };
}

const triage = JSON.parse(fs.readFileSync(TRIAGE_FILE, 'utf8'));
const a1 = triage.filter(f => f.isA1 && !f.error);

const text_config = JSON.stringify({
  font: 'Heebo', weight: 'bold', size: 0.027, color: '#444444', align: 'center', y: 0.935,
});

console.log('Computing bboxes for', a1.length, 'A1 frames...\n');

const rows = [];
for (const frame of a1) {
  const filePath = path.join(FRAMES_DIR, frame.file);
  process.stdout.write(`  ${frame.slug.padEnd(20)} `);
  try {
    const bbox = await detectHoleBbox(filePath, frame.width, frame.height);
    rows.push({ frame, bbox });
    console.log(`bbox=${JSON.stringify(bbox)}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

const now = new Date().toISOString();
const values = rows.map(({ frame, bbox }) => {
  const imageUrl = `${BASE_URL}/${frame.slug}.png`;
  const holeBbox = JSON.stringify(bbox);
  return `('${frame.slug}', 'active', 'photo_print', '${frame.aspect}', '${frame.category}', '${holeBbox}'::jsonb, '${text_config}'::jsonb, '${imageUrl}', '${now}')`;
});

const sql = `INSERT INTO frames_meta
  (frame_id, status, style, aspect, category, hole_bbox, text_config, image_url, updated_at)
VALUES
${values.join(',\n')}
ON CONFLICT (frame_id) DO UPDATE SET
  status = EXCLUDED.status,
  style = EXCLUDED.style,
  aspect = EXCLUDED.aspect,
  category = EXCLUDED.category,
  hole_bbox = EXCLUDED.hole_bbox,
  text_config = EXCLUDED.text_config,
  image_url = EXCLUDED.image_url,
  updated_at = EXCLUDED.updated_at;`;

const outFile = path.join(ROOT, 'scripts', 'insert-frames1.sql');
fs.writeFileSync(outFile, sql);
console.log(`\nSQL written to scripts/insert-frames1.sql (${rows.length} rows)`);
