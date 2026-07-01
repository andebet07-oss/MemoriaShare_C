import { findApprovedFrameFromDB, getApprovedFramePack } from '@/lib/framesUtils';
import { loadImageEl, applyCrop, composePreview } from '@/hooks/useFaceCrop';
import { canvasToJpegBlob } from '@/lib/compositePngFrame';
import { formatEventDate } from '@/lib/formatEventDate';
import { applyOverlayFrame, printCompositedBlob } from '@/functions/applyOverlayFrame';

/** The stored composited magnet URL for a job (medium/original fallback chain). */
export function getCompositedUrl(job) {
  return job?.photos?.file_urls?.original ?? job?.photos?.file_url ?? null;
}

/** Resolve the event's frame descriptor (DB-authoritative, seed fallback). */
export async function resolveEventFrame(event) {
  const frameId = event?.overlay_frame_url;
  const assigned = (frameId && !frameId.startsWith('http'))
    ? await findApprovedFrameFromDB(frameId)
    : null;
  return assigned ?? getApprovedFramePack(event?.name || '')[0] ?? null;
}

/**
 * When the operator has re-cropped a job, regenerate the composited magnet from
 * the RAW photo + crop_config + frame. Returns a JPEG blob, or null when the
 * re-crop path isn't possible (no raw photo, no crop, or a non-PNG frame) — in
 * which case the caller prints the guest's stored composite instead.
 */
export async function buildCroppedMagnetBlob({ job, event, frame }) {
  if (!job?.crop_config || !job?.raw_photo_url) return null;
  const f = frame ?? await resolveEventFrame(event);
  if (!f?.isPng) return null;
  const rawImg = await loadImageEl(job.raw_photo_url);
  const cropped = applyCrop(rawImg, job.crop_config);
  const canvas = await composePreview(cropped, f, {
    eventName: event?.name,
    eventDate: formatEventDate(event?.date) || null,
  });
  return canvasToJpegBlob(canvas, 0.92);
}

/**
 * Print `copies` physical magnets for one queue row. Uses the re-cropped
 * composite when available, else the guest's stored composite. Does NOT change
 * status — the caller advances the job separately. Throws 'POPUP_BLOCKED'.
 */
export async function printJob({ job, event, copies = 1 }) {
  const blob = await buildCroppedMagnetBlob({ job, event });
  if (blob) await printCompositedBlob(blob, copies);
  else await applyOverlayFrame(getCompositedUrl(job), event?.overlay_frame_url, copies);
}
