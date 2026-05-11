#!/usr/bin/env node
/**
 * scripts/backfill-thumbnails.mjs
 *
 * One-shot backfill: triggers the /api/resize-photo serverless function for
 * every photos row that pre-dates the thumbnail pipeline
 * (file_urls IS NULL OR file_urls.thumbnail is missing).
 *
 * Usage:
 *   1. Create scripts/backfill-thumbnails.env (gitignored — see template below).
 *   2. Run with Node 20.6+ so the --env-file flag is available:
 *        node --env-file=scripts/backfill-thumbnails.env scripts/backfill-thumbnails.mjs
 *
 * scripts/backfill-thumbnails.env template (DO NOT COMMIT):
 *   SUPABASE_URL=https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service role JWT>
 *   SUPABASE_WEBHOOK_SECRET=<same secret as Vercel env>
 *   RESIZE_ENDPOINT=https://memoriashare.com/api/resize-photo
 *   CONCURRENCY=5
 *   DRY_RUN=1     # set to '0' for the real run
 *
 * The resize function is idempotent (DB row check + `.is('file_urls', null)`
 * guard), so re-running this script is safe.
 */

import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_WEBHOOK_SECRET,
  RESIZE_ENDPOINT,
  CONCURRENCY = '5',
  DRY_RUN = '1',
} = process.env;

for (const [k, v] of Object.entries({
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_WEBHOOK_SECRET, RESIZE_ENDPOINT,
})) {
  if (!v) {
    console.error(`[backfill] חסר משתנה סביבה: ${k}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Build the same payload Supabase's storage-objects webhook would send.
 *  The resize function only reads `record.bucket_id` and `record.name`,
 *  so the synthetic `id` is harmless. */
function buildPayload(photo) {
  return {
    type: 'INSERT',
    table: 'objects',
    schema: 'storage',
    record: {
      id: `backfill-${photo.id}`,
      bucket_id: 'photos',
      name: photo.path,
      owner: null,
      metadata: null,
    },
    old_record: null,
  };
}

async function fireOne(photo) {
  if (DRY_RUN === '1') {
    console.log(`[backfill][dry-run] ${photo.id}  ${photo.path}`);
    return { ok: true, dry: true };
  }
  try {
    const res = await fetch(RESIZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(buildPayload(photo)),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[backfill] ❌ ${photo.id} → HTTP ${res.status}`, body);
      return { ok: false, status: res.status, body };
    }
    const label = body.skipped ?? (body.ok ? 'processed' : 'unknown');
    console.log(`[backfill] ✓ ${photo.id} → ${label}`);
    return { ok: true, body };
  } catch (err) {
    console.error(`[backfill] ❌ ${photo.id} שגיאת רשת:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Tiny worker-pool — keeps `concurrency` requests in flight without an
 *  external dep. Each worker pulls from a shared iterator until exhausted. */
async function runPool(items, concurrency, worker) {
  const iter = items[Symbol.iterator]();
  const workers = Array.from({ length: concurrency }, async () => {
    for (let next = iter.next(); !next.done; next = iter.next()) {
      await worker(next.value);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log(`[backfill] DRY_RUN=${DRY_RUN}  CONCURRENCY=${CONCURRENCY}  ENDPOINT=${RESIZE_ENDPOINT}`);

  // Pull every photo with a storage path. We filter the unprocessed set
  // client-side rather than via a PostgREST JSON-arrow OR clause — simpler
  // and survives any PostgREST version quirks with `file_urls->>thumbnail`.
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, path, file_urls')
    .not('path', 'is', null);

  if (error) {
    console.error('[backfill] שאילתת photos נכשלה:', error.message);
    process.exit(1);
  }

  const todo = photos.filter(p => !p.file_urls?.thumbnail);
  console.log(`[backfill] סך הכל ${photos.length} תמונות עם path, מתוכן ${todo.length} ללא thumbnail — לעיבוד.`);
  if (todo.length === 0) return;

  const stats = { ok: 0, fail: 0 };
  await runPool(todo, Number(CONCURRENCY), async (p) => {
    const r = await fireOne(p);
    stats[r.ok ? 'ok' : 'fail']++;
  });

  console.log(`[backfill] סיום. הצליחו: ${stats.ok}, נכשלו: ${stats.fail}.`);
  if (stats.fail > 0) process.exit(2);
}

main().catch(err => {
  console.error('[backfill] fatal:', err);
  process.exit(1);
});
