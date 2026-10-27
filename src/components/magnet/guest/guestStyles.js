/**
 * guestStyles.js — shared tokens + helpers for the guest landing and its
 * status sheet. Colours come from the guest-* tokens (index.css): a deeper,
 * warmer surface than the admin screens, with muted status hues.
 */

/**
 * The guest sees three states: pending and printing read as one
 * "printing" state — the difference only matters at the station.
 */
export const GUEST_STATUS = {
  printing: { label: 'בהדפסה', dot: 'bg-guest-printing' },
  ready:    { label: 'מוכן',   dot: 'bg-guest-ready' },
  rejected: { label: 'נדחה',   dot: 'bg-guest-rejected' },
};

/** 'pending' | 'printing' → 'printing'; ready / rejected as is. */
export function guestStatus(status) {
  return status === 'ready' || status === 'rejected' ? status : 'printing';
}

/** The stored composite thumbnail of a job (falls back to the full image). */
export function jobThumb(job) {
  return job?.photos?.file_urls?.thumbnail ?? job?.photos?.file_url ?? null;
}

/** Per-status counts for the landing: { printing, ready, rejected }. */
export function countJobs(jobs) {
  const out = { printing: 0, ready: 0, rejected: 0 };
  for (const j of jobs) out[guestStatus(j.status)] += 1;
  return out;
}

const DATE_FMT = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const TIME_FMT = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

/** 'YYYY-MM-DD' → '15 בדצמבר 2026' ('' when missing or invalid). */
export function formatGuestDate(date) {
  if (!date) return '';
  const d = new Date(typeof date === 'string' && date.length === 10 ? `${date}T00:00:00` : date);
  return Number.isNaN(d.getTime()) ? '' : DATE_FMT.format(d);
}

/** ISO timestamp → '21:34' ('' when missing or invalid). */
export function formatTime(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? TIME_FMT.format(d) : '';
}

/** Shared class strings: one radius (16), one hairline, one raised surface. */
export const SURFACE = 'bg-guest-raised border border-guest-line rounded-2xl';
export const ICON = { strokeWidth: 1.75, 'aria-hidden': true };
