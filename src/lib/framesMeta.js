/**
 * framesMeta.js — LOCAL FALLBACK ONLY.
 * Source of truth is the `frames_meta` Supabase table (useFramesMeta hook).
 * This file is used as a seed / offline fallback; do not treat it as authoritative.
 */
export const FRAMES_META = {
  // ── Wedding ──────────────────────────────────────────────────────────────────
  'wedding-classic':        { style: 'minimal_luxury',   quality: 28, status: 'approved', palette: 'ivory'    },
  'wedding-editorial':      { style: 'minimal_luxury',   quality: 33, status: 'approved', palette: 'ivory'    },
  'wedding-arch':           { style: 'modern_editorial', quality: 29, status: 'approved', palette: 'indigo'   },
  'wedding-emerald':        { style: 'modern_editorial', quality: 30, status: 'approved', palette: 'emerald'  },
  'wedding-burgundy':       { style: 'modern_editorial', quality: 30, status: 'approved', palette: 'burgundy' },
  'wedding-romance':        { style: 'minimal_luxury',   quality: 20, status: 'archived', palette: 'ivory'    },
  'wedding-monogram':       { style: 'modern_editorial', quality: 31, status: 'approved', palette: 'gold'     },
  'wedding-botanical':      { style: 'minimal_luxury',   quality: 29, status: 'approved', palette: 'sage'     },
  'wedding-polaroid-tape':  { style: 'festive_chic',     quality: 29, status: 'approved', palette: 'warm'     },
  'wedding-deco-gold':      { style: 'festive_chic',     quality: 29, status: 'approved', palette: 'gold'     },
  'wedding-hairline-crest': { style: 'minimal_luxury',   quality: 31, status: 'approved', palette: 'ivory'    },

  // ── Bar / Bat Mitzvah ─────────────────────────────────────────────────────────
  'bar-jerusalem':          { style: 'modern_editorial', quality: 29, status: 'approved', palette: 'indigo'   },
  'bar-electric':           { style: 'modern_editorial', quality: 18, status: 'archived', palette: 'obsidian' },
  'bar-retro':              { style: 'festive_chic',     quality: 16, status: 'archived', palette: 'rose'     },
  'bar-royal':              { style: 'modern_editorial', quality: 30, status: 'approved', palette: 'navy'     },
  'bar-hebrew-classic':     { style: 'modern_editorial', quality: 31, status: 'approved', palette: 'ivory'    },
  'bat-rose':               { style: 'modern_editorial', quality: 28, status: 'approved', palette: 'rose'     },
  'bar-tallit':             { style: 'modern_editorial', quality: 30, status: 'approved', palette: 'navy'     },

  // ── Brit ─────────────────────────────────────────────────────────────────────
  'brit-boy':               { style: 'modern_editorial', quality: 28, status: 'approved', palette: 'blue'     },
  'brit-elegant':           { style: 'minimal_luxury',   quality: 30, status: 'approved', palette: 'ivory'    },
  'brit-mint':              { style: 'minimal_luxury',   quality: 28, status: 'approved', palette: 'sage'     },

  // ── Birthday ─────────────────────────────────────────────────────────────────
  'birthday-party':         { style: 'festive_chic',     quality: 26, status: 'approved', palette: 'coral'    },
  'birthday-neon':          { style: 'festive_chic',     quality: 19, status: 'archived', palette: 'obsidian' },
  'birthday-pastel':        { style: 'festive_chic',     quality: 22, status: 'archived', palette: 'pastel'   },
  'birthday-scrapbook':     { style: 'festive_chic',     quality: 27, status: 'approved', palette: 'warm'     },

  // ── Corporate ────────────────────────────────────────────────────────────────
  'corp-executive':         { style: 'minimal_luxury',   quality: 30, status: 'approved', palette: 'ivory'    },
  'corp-gradient':          { style: 'modern_editorial', quality: 27, status: 'approved', palette: 'indigo'   },

  // ── General ──────────────────────────────────────────────────────────────────
  'general-cinema':         { style: 'modern_editorial', quality: 29, status: 'approved', palette: 'obsidian' },
  'general-minimal':        { style: 'minimal_luxury',   quality: 28, status: 'approved', palette: 'ivory'    },
  'general-filmstrip':      { style: 'festive_chic',     quality: 28, status: 'approved', palette: 'obsidian' },
};

export const STYLE_LABELS = {
  minimal_luxury:   'מינימל יוקרתי',
  modern_editorial: 'עורכי מודרני',
  festive_chic:     'חגיגי שיק',
};

export const CATEGORY_LABELS = {
  wedding:     'חתונה',
  bar_mitzvah: 'בר/בת מצווה',
  brit:        'ברית',
  birthday:    'יום הולדת',
  corporate:   'עסקי',
  general:     'כללי',
};

export const STYLE_ACCENT = {
  minimal_luxury:   { pill: 'bg-cool-700/60 text-cool-300 border border-cool-600/60',   dot: '#b4b4b4' },
  modern_editorial: { pill: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', dot: '#7c86e1' },
  festive_chic:     { pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',    dot: '#f59e0b' },
};

/** Manual curation order — used for default "curated" sort */
export const SORT_WEIGHT = {
  'wedding-editorial':       100,
  'wedding-hairline-crest':   99,
  'wedding-monogram':          98,
  'bar-hebrew-classic':        97,
  'wedding-emerald':           96,
  'wedding-arch':              95,
  'brit-elegant':              94,
  'wedding-botanical':         93,
  'wedding-deco-gold':         92,
  'bar-royal':                 91,
  'bar-tallit':                90,
  'wedding-burgundy':          89,
  'wedding-classic':           88,
  'bat-rose':                  87,
  'wedding-polaroid-tape':     86,
  'corp-executive':            85,
  'brit-mint':                 84,
  'brit-boy':                  83,
  'birthday-scrapbook':        82,
  'birthday-party':            81,
  'general-cinema':            80,
  'general-filmstrip':         79,
  'general-minimal':           78,
  'corp-gradient':             77,
  'bar-jerusalem':             76,
};
