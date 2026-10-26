import { eventRenderSpec, renderComposite, loadImage } from '@/lib/polaroid/renderPolaroid';
import { printImage } from '@/lib/printImage';

/** The stored composited magnet URL for a job (medium/original fallback chain). */
export function getCompositedUrl(job) {
  return job?.photos?.file_urls?.original ?? job?.photos?.file_url ?? null;
}

/**
 * The orientation saved with an operator crop, or null when there is none.
 * Reads the legacy `aspect: '3:4' | '4:3'` shape too.
 */
export function cropOrientation(cropConfig) {
  if (!cropConfig) return null;
  if (cropConfig.orientation) return cropConfig.orientation === 'landscape' ? 'landscape' : 'portrait';
  if (cropConfig.aspect) return cropConfig.aspect === '4:3' ? 'landscape' : 'portrait';
  return null;
}

/** A composite's orientation, from its size (900 × 1200 / 1200 × 900). */
export function imageOrientation(img) {
  const w = img?.naturalWidth || img?.width || 0;
  const h = img?.naturalHeight || img?.height || 0;
  return w > h ? 'landscape' : 'portrait';
}

/**
 * When the operator has re-cropped a job, re-render the magnet from the RAW
 * photo + crop_config with the event's template. Returns a canvas at print
 * resolution, or null when there is nothing to re-render (no raw photo or no
 * crop) — the caller then prints the guest's stored composite as is.
 */
export async function buildCroppedMagnet({ job, event }) {
  if (!job?.crop_config || !job?.raw_photo_url) return null;
  const photo = await loadImage(job.raw_photo_url);
  return renderComposite({
    ...eventRenderSpec(event),
    orientation: cropOrientation(job.crop_config),
    photo,
    crop: job.crop_config,
  });
}

/**
 * Print `copies` physical magnets for one queue row: the re-cropped render when
 * there is one, else the stored composite exactly as the guest saw it. Does NOT
 * change status — the caller advances the job. Throws 'POPUP_BLOCKED'.
 */
export async function printJob({ job, event, copies = 1 }) {
  const magnet = await buildCroppedMagnet({ job, event }) ?? await loadImage(getCompositedUrl(job));
  printImage(magnet, copies);
}
