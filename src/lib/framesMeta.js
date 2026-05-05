/**
 * framesMeta.js — local fallback / seed.
 * Source of truth is the frames_meta Supabase table.
 * All frame definitions removed. New templates will be added here.
 */
export const FRAMES_META = {};

export const STYLE_LABELS = {
  minimal_luxury:   'מינימל יוקרתי',
  modern_editorial: 'עורכי מודרני',
  festive_chic:     'חגיגי שיק',
  photo_print:      'הדפסת תמונה',
};

export const CATEGORY_LABELS = {
  wedding:       'חתונה',
  'bar-mitzvah': 'בר/בת מצווה',
  brit:          'ברית',
  birthday:      'יום הולדת',
  corporate:     'עסקי',
  general:       'כללי',
};

export const STYLE_ACCENT = {
  minimal_luxury:   { pill: 'bg-cool-700/60 text-cool-300 border border-cool-600/60',          dot: '#b4b4b4' },
  modern_editorial: { pill: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',    dot: '#7c86e1' },
  festive_chic:     { pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',       dot: '#f59e0b' },
  photo_print:      { pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: '#34d399' },
};

export const SORT_WEIGHT = {};
