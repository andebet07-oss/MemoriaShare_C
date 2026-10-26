/**
 * framesUtils.js — approved-only frame resolution helpers.
 *
 * Sync variants (isFrameApproved, getApprovedFrames, etc.) use the local
 * framesMeta.js seed as fallback — safe for cases where DB is unavailable.
 *
 * Async variant (findApprovedFrameFromDB) checks the DB first and falls back
 * to the local seed only on DB error. Used by MagnetReview assignment path.
 */
import { ALL_FRAMES, getFramePack } from '@/components/magnet/framePacks';
import { FRAMES_META } from '@/lib/framesMeta';
import memoriaService from '@/components/memoriaService';
import { loadImage as loadFrameImage } from '@/lib/compositePngFrame';
import { detectHoleBbox } from '@/lib/detectHoleBbox';

export function isFrameApproved(frameId) {
  return (FRAMES_META[frameId]?.status ?? 'approved') === 'approved';
}

/** ALL_FRAMES filtered to approved status only. */
export function getApprovedFrames() {
  return ALL_FRAMES.filter(f => isFrameApproved(f.id));
}

/**
 * Like getFramePack() but skips archived frames.
 * Falls back to full pack only if every frame in the pack is archived (should never happen in production).
 */
export function getApprovedFramePack(eventName) {
  const pack = getFramePack(eventName);
  const approved = pack.filter(f => isFrameApproved(f.id));
  return approved.length > 0 ? approved : pack;
}

/**
 * Resolve a frame by ID for guest-facing use (sync, local fallback).
 * Returns null if the frame is archived or unknown per local seed.
 */
export function findApprovedFrame(frameId) {
  if (!frameId || !isFrameApproved(frameId)) return null;
  return ALL_FRAMES.find(f => f.id === frameId) ?? null;
}

/**
 * DB-authoritative approved-frame lookup for assignment paths.
 * Primary: checks frames_meta table status.
 * Fallback: local FRAMES_META seed (used only when DB call fails).
 *
 * Returns either:
 *   - A procedural frame object { id, name, drawFrame, ... } from framePacks
 *   - A PNG frame descriptor  { id, isPng: true, image_url, hole_bbox }
 *   - null if archived/unknown
 */
export async function findApprovedFrameFromDB(frameId) {
  if (!frameId || frameId.startsWith('http')) return null;
  try {
    const row = await memoriaService.frameMeta.getById(frameId);

    // No DB row — fall through to local seed (handles procedural frames not yet in DB)
    if (!row) return findApprovedFrame(frameId);

    if (row.status !== 'approved') return null;

    // PNG frame — return lightweight descriptor; no drawFrame needed
    if (row.image_url && row.hole_bbox) {
      return { id: frameId, isPng: true, image_url: row.image_url, hole_bbox: row.hole_bbox, text_config: row.text_config ?? null, aspect: row.aspect ?? 'portrait' };
    }

    // Procedural frame — resolve from local pack
    return ALL_FRAMES.find(f => f.id === frameId) ?? null;
  } catch {
    // DB unavailable — fall back to local seed (procedural only)
    return findApprovedFrame(frameId);
  }
}

const FULL_CANVAS = { x: 0, y: 0, w: 1, h: 1 };

/**
 * PNG descriptor for an admin-uploaded custom frame (overlay_frame_url is a
 * URL). The photo window is the PNG's transparent hole; a PNG without one is a
 * full-canvas overlay drawn over the photo. No text_config: the uploaded design
 * is used exactly as drawn.
 */
async function customFrameDescriptor(url) {
  const img = await loadFrameImage(url);
  let hole = null;
  try {
    hole = (await detectHoleBbox(img)).bbox;
  } catch (err) {
    console.warn('[framesUtils] hole detection failed — using full canvas:', err?.message);
  }
  return {
    id: 'custom',
    isPng: true,
    image_url: url,
    hole_bbox: hole ?? FULL_CANVAS,
    text_config: null,
    aspect: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait',
  };
}

const RESOLVED_FRAMES = new Map();

/**
 * The single "event → frame" resolver. The guest camera, the review composite,
 * the operator crop editor and the print path all use it, so the frame the
 * guest sees is the one that gets printed.
 *   overlay_frame_url = http(s) URL    → uploaded custom PNG
 *   overlay_frame_url = frames_meta id → approved library frame
 *   otherwise                          → name-based pack fallback (may be null)
 * Cached per event frame; a failed resolution is not cached (retry next call).
 */
export function resolveEventFrame(event) {
  const ref = event?.overlay_frame_url || '';
  const key = `${ref}|${event?.name || ''}`;
  if (!RESOLVED_FRAMES.has(key)) {
    const pending = (async () => {
      if (/^https?:\/\//i.test(ref)) return customFrameDescriptor(ref);
      const assigned = ref ? await findApprovedFrameFromDB(ref) : null;
      return assigned ?? getApprovedFramePack(event?.name || '')[0] ?? null;
    })();
    RESOLVED_FRAMES.set(key, pending);
    pending.catch(() => RESOLVED_FRAMES.delete(key));
  }
  return RESOLVED_FRAMES.get(key);
}
