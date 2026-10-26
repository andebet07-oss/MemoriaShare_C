/**
 * templates.js — the polaroid magnet templates, as data.
 *
 * Sizes are in design units (see printSpec.js) as [portrait, landscape].
 * Colours here are printed-design colours, outside the UI token system.
 *
 * Name layouts:
 *   split  — event.name split on "&" into two names with a separator between
 *            them (an icon, or a decorative "&" glyph). No "&" → name shown whole.
 *   joined — the name drawn as "n1 & n2" text.
 * Options are stored on the event as named choices (events.template_options).
 */
import { FONTS } from './fonts';

export const DEFAULT_TEMPLATE_ID = 'A';

// Shared colour choices for options (label = Hebrew UI label).
const STONE_LIGHT = { label: 'אבן', value: '#A89F92' };
const STONE = { label: 'אבן', value: '#8C857A' };
const RED = { label: 'אדום', value: '#C9473F' };
const GOLD = { label: 'זהב', value: '#B08D57' };

export const TEMPLATES = {
  A: {
    id: 'A',
    label: 'רך',
    names: {
      layout: 'split', font: FONTS.bellefair, size: [31, 27], color: '#3B3936',
      separator: { kind: 'icon', icon: 'heart', size: [12, 11], gap: [10, 9], color: { option: 'heart' } },
    },
    date: { font: FONTS.heebo300, size: [11, 10.5], color: '#8A857D', tracking: 0.2, gap: [4, 3] },
    url: { option: 'url', text: 'memoriashare.com', font: FONTS.heebo300, size: 7, color: '#B4B4B4', tracking: 0.18 },
    options: {
      heart: {
        label: 'צבע הלב', type: 'color', default: 'taupe',
        choices: { taupe: STONE_LIGHT, red: RED, charcoal: { label: 'פחם', value: '#3B3936' } },
      },
      url: { label: 'כתובת האתר בשוליים', type: 'toggle', default: false },
    },
  },

  B: {
    id: 'B',
    label: 'קלאסי',
    names: {
      layout: 'split', font: FONTS.bonaNova, size: [25, 22], color: '#2F2C28',
      separator: { kind: 'glyph', text: '&', font: FONTS.greatVibes, size: [38, 33], gap: [8, 7], color: { option: 'amp' } },
    },
    date: {
      font: FONTS.heebo300, size: [10.5, 10], color: '#8C857A', tracking: 0.26, gap: [5, 4],
      hairlines: { width: [22, 20], color: '#CFC6B6', gap: 10 },
    },
    options: {
      amp: { label: 'צבע ה־&', type: 'color', default: 'gold', choices: { gold: GOLD, red: RED, taupe: STONE } },
    },
  },

  C: {
    id: 'C',
    label: 'לב אדום',
    names: {
      layout: 'split', font: FONTS.karantina, size: [42, 37], color: '#242424',
      separator: { kind: 'icon', icon: 'heart', size: [15, 13], gap: [10, 9], color: '#D0443C' },
    },
    date: { font: FONTS.heebo300, size: [11, 10.5], color: '#7A7A7A', tracking: 0.3, gap: [4, 3] },
    options: {},
  },

  D: {
    id: 'D',
    label: 'טבעות',
    names: { layout: 'joined', font: FONTS.bonaNova, size: [24, 22], color: '#2F2C28' },
    // Portrait: icon above the names. Landscape: icon beside the names+date block.
    icon: { icon: 'rings', w: 34, h: 22, color: { option: 'icon' }, gapAbove: [6, 5], gapBeside: 14 },
    date: { font: FONTS.heebo300, size: [10.5, 10], color: '#8C857A', tracking: 0.24, gap: [4, 3] },
    options: {
      icon: {
        label: 'צבע הסמל', type: 'color', default: 'gold',
        choices: { gold: GOLD, taupe: STONE, charcoal: { label: 'פחם', value: '#2F2C28' } },
      },
    },
  },

  F: {
    id: 'F',
    label: 'כתב יד',
    names: {
      layout: 'split', font: FONTS.gveretLevin, size: [30, 27], color: '#2E2E2E',
      separator: { kind: 'icon', icon: 'heart', size: [13, 12], gap: [9, 8], color: '#D0443C' },
    },
    date: { font: FONTS.heebo300, size: [11.5, 11], color: '#777777', tracking: 0.12, gap: [4, 3] },
    options: {},
  },

  G: {
    id: 'G',
    label: 'מסולסל',
    // Latin names in Great Vibes, Hebrew names in Gveret Levin.
    names: {
      layout: 'joined', color: '#2B2926',
      font: FONTS.greatVibes, size: [40, 35],
      hebrew: { font: FONTS.gveretLevin, size: [30, 27] },
    },
    date: { font: FONTS.heebo300, size: [10.5, 10], color: '#8C857A', tracking: 0.28, gap: [4, 3], separator: ' · ' },
    options: {},
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

export function getTemplate(id) {
  return TEMPLATES[id] ?? TEMPLATES[DEFAULT_TEMPLATE_ID];
}

/** The event's template id (unknown / missing → default). */
export function eventTemplateId(event) {
  return TEMPLATES[event?.template_id] ? event.template_id : DEFAULT_TEMPLATE_ID;
}

/**
 * The template's options with defaults filled in. Unknown keys are dropped and
 * unknown values fall back to the default, so stored options can never break
 * a render.
 */
export function resolveOptions(template, stored = {}) {
  const out = {};
  for (const [key, def] of Object.entries(template.options)) {
    const value = stored?.[key];
    if (def.type === 'toggle') out[key] = typeof value === 'boolean' ? value : def.default;
    else out[key] = def.choices[value] ? value : def.default;
  }
  return out;
}

/** A colour spec is either a literal or { option } → the chosen option colour. */
export function resolveColor(template, spec, options) {
  if (typeof spec === 'string') return spec;
  const def = template.options[spec.option];
  return def.choices[options[spec.option]].value;
}

/** Every font a template can draw with (load them all before rendering). */
export function templateFonts(template) {
  const fonts = [template.names.font, template.date.font];
  if (template.names.hebrew) fonts.push(template.names.hebrew.font);
  if (template.names.separator?.font) fonts.push(template.names.separator.font);
  if (template.url) fonts.push(template.url.font);
  return fonts;
}
