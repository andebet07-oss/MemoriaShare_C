/**
 * text.js — pure name/date helpers for the templates (no DOM).
 */
import { formatEventDate } from '@/lib/formatEventDate';

const HEBREW_RE = /[֐-׿יִ-ﭏ]/;

/** True when the text contains Hebrew letters (→ drawn RTL). */
export const isHebrew = (text = '') => HEBREW_RE.test(text);

export const textDirection = (text) => (isHebrew(text) ? 'rtl' : 'ltr');

/**
 * Split an event name on "&" into two names. Returns null unless there are
 * exactly two non-empty parts — such names are shown whole.
 */
export function splitNames(name = '') {
  const parts = name.split('&').map(p => p.trim());
  return parts.length === 2 && parts[0] && parts[1] ? parts : null;
}

/** "n1&n2" / "n1  &  n2" → "n1 & n2"; other names are only trimmed. */
export function joinNames(name = '') {
  const parts = splitNames(name);
  return parts ? `${parts[0]} & ${parts[1]}` : name.trim();
}

/** The template date: DD.MM.YYYY, or with a custom separator (G: ' · '). */
export function formatTemplateDate(date, separator = '.') {
  return formatEventDate(date, separator);
}
