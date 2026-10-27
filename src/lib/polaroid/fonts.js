/**
 * fonts.js — template font registry.
 *
 * Template fonts are self-hosted (public/fonts/templates) and registered with
 * the FontFace API under `tpl-*` names, so they never clash with the UI's own
 * Heebo. Every render awaits loadFonts() first: a canvas drawn before its font
 * is ready silently falls back to a system font, which must never reach print.
 */
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const HEBREW = 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F';

/** family → { weight, files: [[file, unicodeRange]] } */
const FAMILIES = {
  'tpl-bellefair':   { weight: '400', files: [['bellefair-400-latin', LATIN], ['bellefair-400-hebrew', HEBREW]] },
  'tpl-bona-nova':   { weight: '400', files: [['bona-nova-400-latin', LATIN], ['bona-nova-400-hebrew', HEBREW]] },
  'tpl-great-vibes': { weight: '400', files: [['great-vibes-400-latin', LATIN]] },
  'tpl-karantina':   { weight: '700', files: [['karantina-700-latin', LATIN], ['karantina-700-hebrew', HEBREW]] },
  'tpl-gveret-levin': { weight: '400', files: [['gveret-levin-400-latin', LATIN], ['gveret-levin-400-hebrew', HEBREW]] },
  'tpl-heebo':       { weight: '300', files: [['heebo-300-latin', LATIN]] },
};

/** Font descriptors used by the templates: { family, weight }. */
export const FONTS = {
  bellefair:   { family: 'tpl-bellefair',   weight: '400' },
  bonaNova:    { family: 'tpl-bona-nova',   weight: '400' },
  greatVibes:  { family: 'tpl-great-vibes', weight: '400' },
  karantina:   { family: 'tpl-karantina',   weight: '700' },
  gveretLevin: { family: 'tpl-gveret-levin', weight: '400' },
  heebo300:    { family: 'tpl-heebo',       weight: '300' },
};

const BASE = `${import.meta.env.BASE_URL || '/'}fonts/templates/`;
const loaded = new Map(); // family → Promise

function loadFamily(family) {
  if (!loaded.has(family)) {
    const { weight, files } = FAMILIES[family];
    const pending = Promise.all(files.map(async ([file, unicodeRange]) => {
      const face = new FontFace(family, `url(${BASE}${file}.woff2) format('woff2')`, { weight, unicodeRange });
      await face.load();
      document.fonts.add(face);
    }));
    loaded.set(family, pending);
    // A failed load is not cached: the next render retries.
    pending.catch(() => loaded.delete(family));
  }
  return loaded.get(family);
}

/** True when the font ships Hebrew glyphs (Great Vibes and Heebo 300 here are Latin only). */
export function hasHebrewGlyphs(font) {
  return FAMILIES[font?.family]?.files.some(([, range]) => range === HEBREW) ?? false;
}

/** Load the given font descriptors. Rejects if any file fails to load. */
export function loadFonts(fonts) {
  const families = [...new Set(fonts.map(f => f.family))];
  return Promise.all(families.map(loadFamily)).then(() => undefined);
}

/** CSS/canvas font string, e.g. `300 33px "tpl-heebo"`. */
export function fontString(font, sizePx) {
  return `${font.weight} ${sizePx}px "${font.family}"`;
}
