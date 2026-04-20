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
 * Returns the frame object (from framePacks) or null if archived/unknown.
 */
export async function findApprovedFrameFromDB(frameId) {
  if (!frameId || frameId.startsWith('http')) return null;
  try {
    const row = await memoriaService.frameMeta.getById(frameId);
    if (!row || row.status !== 'approved') return null;
    return ALL_FRAMES.find(f => f.id === frameId) ?? null;
  } catch {
    // DB unavailable — fall back to local seed
    return findApprovedFrame(frameId);
  }
}
