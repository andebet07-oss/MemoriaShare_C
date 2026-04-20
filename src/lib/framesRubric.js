/**
 * framesRubric.js — rubric criteria definitions and hard-fail gating logic.
 * Source of truth for the moderation queue.
 */

export const RUBRIC_CRITERIA = [
  { key: 'composition',      label: 'קומפוזיציה',     hardFail: true,  description: 'ריכוז ויזואלי, יחסי גודל, שימוש ברווח' },
  { key: 'typography',       label: 'טיפוגרפיה',      hardFail: true,  description: 'קריאות, היררכיה, התאמת גופן לאירוע' },
  { key: 'print_safety',     label: 'בטיחות הדפסה',   hardFail: true,  description: 'bleed, אזורי בטיחות, ניקיון קצוות' },
  { key: 'originality',      label: 'מקוריות',         hardFail: true,  description: 'ייחודיות עיצובית — לא גנרי/template' },
  { key: 'export_readiness', label: 'מוכנות לייצוא',  hardFail: true,  description: 'רזולוציה, ממוסגר נכון, אין artifacts' },
  { key: 'aesthetic',        label: 'אסתטיקה',         hardFail: false, description: 'יופי כללי, שכבות, עומק ויזואלי' },
  { key: 'event_fit',        label: 'התאמה לאירוע',    hardFail: false, description: 'מתאים לקהל היעד ולסגנון האירוע' },
];

export const HARD_FAIL_KEYS = new Set(
  RUBRIC_CRITERIA.filter(c => c.hardFail).map(c => c.key)
);

export const PUBLISH_THRESHOLD = 26; // out of 35

/**
 * Returns { total, hardFailCriteria, canApprove, reason }
 * canApprove = total >= 26 AND no hard-fail criterion scored 0.
 */
export function evaluateRubric(scores = {}) {
  const total = RUBRIC_CRITERIA.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
  const hardFailCriteria = RUBRIC_CRITERIA
    .filter(c => c.hardFail && (scores[c.key] ?? 0) === 0)
    .map(c => c.label);

  const canApprove = total >= PUBLISH_THRESHOLD && hardFailCriteria.length === 0;

  let reason = null;
  if (!canApprove) {
    const parts = [];
    if (total < PUBLISH_THRESHOLD) parts.push(`ניקוד כולל ${total}/35 (סף: ${PUBLISH_THRESHOLD})`);
    if (hardFailCriteria.length > 0) parts.push(`כישלון חובה: ${hardFailCriteria.join(', ')}`);
    reason = parts.join(' · ');
  }

  return { total, hardFailCriteria, canApprove, reason };
}
