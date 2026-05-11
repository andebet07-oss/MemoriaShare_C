// api/resize-photo.ts
// Vercel Node 20 serverless function — resize uploaded photos into thumbnail +
// medium JPEGs and populate photos.file_urls JSONB.
//
// Trigger: Supabase STORAGE webhook — a database webhook on `storage.objects`
// INSERT, filtered by bucket_id='photos'. Fires the moment a guest's upload
// lands in Storage. Because our client flow does storage.upload → photos.create,
// the matching photos row may not yet be committed when the webhook fires; we
// mitigate with a bounded retry on the photos lookup (LOOKUP_ATTEMPTS × LOOKUP_DELAY_MS).
//
// Idempotency: looks up the photos row by storage path; if file_urls.thumbnail
// is already populated the request short-circuits with 200. The final UPDATE
// is also guarded by `.is('file_urls', null)` so a webhook retry is a no-op
// even if our 200 response was lost. Derived keys (`*/derived/*`) are also
// skipped to prevent the webhook re-firing on our own thumbnail/medium writes.
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL                — project URL
//   SUPABASE_SERVICE_ROLE_KEY   — service role JWT (server-only)
//   SUPABASE_WEBHOOK_SECRET     — random string; set as Authorization header
//                                 ("Bearer <secret>") on the Supabase webhook
//
// Required package.json move: `sharp` is currently in devDependencies; promote
// it to `dependencies` so Vercel installs it into the function bundle.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

const SUPABASE_URL     = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBHOOK_SECRET   = process.env.SUPABASE_WEBHOOK_SECRET!;
const STORAGE_BUCKET   = 'photos';
const THUMBNAIL_WIDTH  = 256;
const MEDIUM_WIDTH     = 1280;
const JPEG_QUALITY     = 82;
const LOOKUP_ATTEMPTS  = 3;
const LOOKUP_DELAY_MS  = 500;

interface StorageWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;        // 'objects'
  schema: string;       // 'storage'
  record: {
    id: string;                              // storage object UUID (NOT photos.id)
    bucket_id: string;
    name: string;                            // storage key: '{event_id}/{ts}_{filename}'
    owner: string | null;
    metadata: Record<string, unknown> | null;
  };
  old_record: unknown;
}

interface PhotosRow {
  id: string;
  event_id: string;
  path: string | null;
  file_urls: { thumbnail?: string; medium?: string; original?: string } | null;
}

/** Look up the photos row by storage key, retrying briefly to win the race
 *  against the client's storage.upload → photos.create ordering. Returns
 *  null after LOOKUP_ATTEMPTS — caller treats that as "row never landed". */
async function findPhotoByPath(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<PhotosRow | null> {
  for (let attempt = 0; attempt < LOOKUP_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from('photos')
      .select('id, event_id, path, file_urls')
      .eq('path', storagePath)
      .maybeSingle();
    if (error) throw new Error(`חיפוש photos.path נכשל: ${error.message}`);
    if (data) return data as PhotosRow;
    if (attempt < LOOKUP_ATTEMPTS - 1) {
      await new Promise(r => setTimeout(r, LOOKUP_DELAY_MS));
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // ── Layer 1: shared-secret gate (matches Authorization header on the webhook)
  if (req.headers.authorization !== `Bearer ${WEBHOOK_SECRET}`) {
    console.error('[resize-photo] שגיאת אימות: ה-webhook secret אינו תואם.');
    return res.status(401).json({ error: 'unauthorized' });
  }

  const payload = req.body as StorageWebhookPayload | undefined;
  if (
    !payload || payload.type !== 'INSERT' ||
    payload.schema !== 'storage' || payload.table !== 'objects' ||
    payload.record?.bucket_id !== STORAGE_BUCKET
  ) {
    return res.status(200).json({ skipped: 'irrelevant_event' });
  }

  const storagePath = payload.record.name;
  if (!storagePath) {
    console.error('[resize-photo] storage event ללא שם אובייקט — דילוג.');
    return res.status(200).json({ skipped: 'no_path' });
  }

  // Skip derivatives we generated ourselves; otherwise the webhook re-fires
  // on our own writes and the function would recurse on its own output.
  if (storagePath.includes('/derived/')) {
    return res.status(200).json({ skipped: 'derived_output', path: storagePath });
  }

  // ── Layer 2: service-role client — server-only, never reaches the browser
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let photoId: string | undefined;
  try {
    // 1. Race-aware lookup of the photos row (storage event may precede DB INSERT)
    const photo = await findPhotoByPath(supabase, storagePath);
    if (!photo) {
      console.error(`[resize-photo] רשומת photos לא נמצאה עבור ${storagePath} לאחר ${LOOKUP_ATTEMPTS} נסיונות — ייתכן שההעלאה בוטלה.`);
      return res.status(200).json({ skipped: 'no_photos_row', path: storagePath });
    }
    photoId = photo.id;

    // ── Idempotency check #1 — read DB state (not stale webhook payload) ────
    if (photo.file_urls?.thumbnail) {
      return res.status(200).json({ skipped: 'already_processed', photo_id: photoId });
    }

    // 2. Download original from Storage
    const { data: originalBlob, error: downloadError } = await supabase
      .storage.from(STORAGE_BUCKET).download(storagePath);
    if (downloadError || !originalBlob) {
      throw new Error(`הורדת המקור נכשלה: ${downloadError?.message ?? 'blob ריק'}`);
    }
    const originalBuffer = Buffer.from(await originalBlob.arrayBuffer());

    // 3. Resize in parallel — `.rotate()` honours EXIF orientation first, then
    //    Sharp strips metadata by default (no `.withMetadata()` call = stripped)
    const [thumbnailBuffer, mediumBuffer] = await Promise.all([
      sharp(originalBuffer).rotate()
        .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer(),
      sharp(originalBuffer).rotate()
        .resize({ width: MEDIUM_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer(),
    ]);

    // 4. Upload derivatives — sibling keys under `derived/`. upsert:true so a
    //    retry that already wrote the storage object but failed the DB update
    //    cleanly overwrites instead of throwing 409.
    const lastSlash   = storagePath.lastIndexOf('/');
    const eventPrefix = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : photo.event_id;
    const filename    = lastSlash >= 0 ? storagePath.slice(lastSlash + 1) : `${photoId}`;
    const thumbPath   = `${eventPrefix}/derived/thumb_${filename}.jpg`;
    const mediumPath  = `${eventPrefix}/derived/med_${filename}.jpg`;
    const uploadOpts  = { contentType: 'image/jpeg', upsert: true };

    const [thumbUp, medUp] = await Promise.all([
      supabase.storage.from(STORAGE_BUCKET).upload(thumbPath, thumbnailBuffer, uploadOpts),
      supabase.storage.from(STORAGE_BUCKET).upload(mediumPath, mediumBuffer, uploadOpts),
    ]);
    if (thumbUp.error) throw new Error(`העלאת thumbnail נכשלה: ${thumbUp.error.message}`);
    if (medUp.error)   throw new Error(`העלאת medium נכשלה: ${medUp.error.message}`);

    // 5. Public URLs — bucket is public; getPublicUrl is deterministic, no network
    const thumbUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(thumbPath).data.publicUrl;
    const medUrl   = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(mediumPath).data.publicUrl;
    const origUrl  = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;

    // 6. Patch photos row — `.is('file_urls', null)` is idempotency check #2.
    //    On a concurrent retry, the row already has file_urls populated and
    //    this UPDATE matches 0 rows — a safe no-op.
    const { error: updateError, count } = await supabase
      .from('photos')
      .update(
        { file_urls: { thumbnail: thumbUrl, medium: medUrl, original: origUrl } },
        { count: 'exact' }
      )
      .eq('id', photoId)
      .is('file_urls', null);

    if (updateError) throw new Error(`עדכון photos.file_urls נכשל: ${updateError.message}`);

    return res.status(200).json({
      ok: true,
      photo_id: photoId,
      rows_updated: count ?? 0,
      sizes: { thumbnail: THUMBNAIL_WIDTH, medium: MEDIUM_WIDTH },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[resize-photo] עיבוד תמונה ${photoId ?? '?'} נכשל:`, message);
    // 5xx → Supabase webhook retries with backoff. Idempotency checks above
    // make retries safe even if the storage uploads already succeeded.
    return res.status(500).json({ error: 'processing_failed', photo_id: photoId, message });
  }
}
