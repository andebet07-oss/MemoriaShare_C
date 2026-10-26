import { describe, it, expect } from 'vitest';
import {
  PRINT_SCALE, DESIGN, WINDOW, SAFE_INSET, printSize, windowAspect, windowFractions,
} from '@/lib/polaroid/printSpec';
import {
  TEMPLATES, TEMPLATE_IDS, getTemplate, eventTemplateId, resolveOptions, resolveColor,
} from '@/lib/polaroid/templates';
import { splitNames, joinNames, isHebrew, formatTemplateDate } from '@/lib/polaroid/text';
import { layoutCaption } from '@/lib/polaroid/layout';
import { photoSourceRect } from '@/lib/polaroid/renderPolaroid';

// Deterministic stand-in for canvas metrics (per unit of font size).
const measure = (text) => ({
  width: [...text].length * 0.5,
  ascent: 0.7,
  descent: /[gjpqyךןףץק]/.test(text) ? 0.2 : 0,
  cap: 0.7,
  desc: 0.25,
});

const lay = (id, orientation, name, date = '2026-12-24', options) =>
  layoutCaption(getTemplate(id), orientation, {
    name, date, options: resolveOptions(getTemplate(id), options),
  }, measure);

const textOps = (ops) => ops.filter(op => op.type === 'text');
const extent = (op) => {
  const w = measure(op.text).width * op.size;
  return [op.x - w / 2, op.x + w / 2];
};

describe('printSpec', () => {
  it('outputs 3 × 4 in at 300 DPI in both orientations', () => {
    expect(printSize('portrait')).toEqual({ w: 900, h: 1200 });
    expect(printSize('landscape')).toEqual({ w: 1200, h: 900 });
    expect(PRINT_SCALE).toBe(3);
  });

  it('maps the window to whole pixels at print scale', () => {
    for (const o of ['portrait', 'landscape']) {
      for (const v of Object.values(WINDOW[o])) expect(Number.isInteger(v * PRINT_SCALE)).toBe(true);
    }
  });

  it('exposes the window as fractions for the viewfinder', () => {
    expect(windowFractions('portrait')).toEqual({ left: 14 / 300, top: 14 / 400, width: 272 / 300, height: 300 / 400 });
    expect(windowAspect('landscape')).toBeCloseTo(374 / 213);
  });

  it('keeps a 4 mm safe inset (~15.75 units)', () => {
    expect(SAFE_INSET).toBeCloseTo(15.748, 2);
  });
});

describe('names and dates', () => {
  it('splits on exactly one "&"', () => {
    expect(splitNames('שרה & דניאל')).toEqual(['שרה', 'דניאל']);
    expect(splitNames('Alexandra&Jonathan')).toEqual(['Alexandra', 'Jonathan']);
    expect(splitNames('בר המצווה של יונתן')).toBeNull();
    expect(splitNames('A & B & C')).toBeNull();
    expect(splitNames(' & Daniel')).toBeNull();
  });

  it('normalises joined names', () => {
    expect(joinNames('Sarah&Daniel')).toBe('Sarah & Daniel');
    expect(joinNames('  יום הולדת 40 ')).toBe('יום הולדת 40');
  });

  it('detects Hebrew', () => {
    expect(isHebrew('אלכסנדרה & יהונתן')).toBe(true);
    expect(isHebrew('Alexandra & Jonathan')).toBe(false);
  });

  it('formats DD.MM.YYYY and the G variant without a timezone shift', () => {
    expect(formatTemplateDate('2026-01-01')).toBe('01.01.2026');
    expect(formatTemplateDate('2026-12-24', ' · ')).toBe('24 · 12 · 2026');
    expect(formatTemplateDate('')).toBe('');
  });
});

describe('templates', () => {
  it('defaults unknown ids to A', () => {
    expect(eventTemplateId({ template_id: 'Z' })).toBe('A');
    expect(eventTemplateId({})).toBe('A');
    expect(eventTemplateId({ template_id: 'G' })).toBe('G');
  });

  it('fills defaults and drops invalid option values', () => {
    expect(resolveOptions(TEMPLATES.A, {})).toEqual({ heart: 'taupe', url: false });
    expect(resolveOptions(TEMPLATES.A, { heart: 'pink', url: 'yes', extra: 1 })).toEqual({ heart: 'taupe', url: false });
    expect(resolveOptions(TEMPLATES.B, { amp: 'red' })).toEqual({ amp: 'red' });
    expect(resolveColor(TEMPLATES.A, { option: 'heart' }, { heart: 'red' })).toBe('#C9473F');
  });
});

describe('layoutCaption', () => {
  const XLONG_HE = 'אלכסנדרה-מרגריטה & יהונתן-אליעזר';
  const XLONG_EN = 'Alexandra-Margaret & Jonathan-Elliot';
  const NAMES = ['שרה & דניאל', 'אלכסנדרה & יהונתן', 'Sarah & Daniel', 'Alexandra & Jonathan', XLONG_HE, XLONG_EN];
  const minScale = (id, o, name) => {
    const n = TEMPLATES[id].names;
    const script = isHebrew(name) && n.hebrew ? n.hebrew : n;
    const i = o === 'landscape' ? 1 : 0;
    return script.minSize[i] / script.size[i];
  };

  it('keeps all caption text inside the 4 mm safe area and clear of the photo', () => {
    for (const id of TEMPLATE_IDS) for (const o of ['portrait', 'landscape']) for (const name of NAMES) {
      const { w: W, h: H } = DESIGN[o];
      const { ops } = lay(id, o, name);
      for (const op of textOps(ops)) {
        const [l, r] = extent(op);
        const m = measure(op.text);
        expect(l).toBeGreaterThanOrEqual(SAFE_INSET - 1e-6);
        expect(r).toBeLessThanOrEqual(W - SAFE_INSET + 1e-6);
        expect(op.y + m.descent * op.size).toBeLessThanOrEqual(H - SAFE_INSET + 1e-6);
        expect(op.y - m.ascent * op.size).toBeGreaterThanOrEqual(WINDOW[o].y + WINDOW[o].h);
      }
      const date = ops.find(op => op.type === 'glyphs');
      expect(date.y).toBeLessThanOrEqual(H - SAFE_INSET + 1e-6);
      expect(date.y).toBeGreaterThan(WINDOW[o].y + WINDOW[o].h);
    }
  });

  it('shrinks names on one line no further than the template minimum', () => {
    expect(lay('A', 'portrait', 'שרה & דניאל').fit).toBe(1);
    const medium = lay('C', 'portrait', 'אלכסנדרה & יהונתן');
    expect(medium.lines).toBe(1);
    expect(medium.fit).toBeLessThan(1);
    for (const id of TEMPLATE_IDS) for (const o of ['portrait', 'landscape']) for (const name of NAMES) {
      const r = lay(id, o, name);
      if (r.lines === 1) expect(r.fit).toBeGreaterThanOrEqual(minScale(id, o, name) - 1e-9);
    }
  });

  it('wraps longer names onto two lines with the separator leading the second name', () => {
    const en = lay('A', 'portrait', XLONG_EN);
    expect(en.lines).toBe(2);
    const [first, second] = textOps(en.ops);
    const heart = en.ops.find(o => o.icon === 'heart');
    expect([first.text, second.text]).toEqual(['Alexandra-Margaret', 'Jonathan-Elliot']);
    expect(second.y).toBeGreaterThan(first.y);
    expect(heart.y).toBeGreaterThan(first.y);                 // on the second line
    expect(heart.y + heart.h).toBeLessThanOrEqual(second.y + 1e-6);
    expect(heart.x).toBeLessThan(second.x);                   // Latin: before the name
    expect(first.size).toBeGreaterThanOrEqual(TEMPLATES.A.names.minSize[0]);

    const he = lay('A', 'portrait', XLONG_HE.replace('&', ' & ').replace('מרגריטה', 'מרגריטה-שושנה'));
    expect(he.lines).toBe(2);
    const [heFirst, heSecond] = textOps(he.ops);
    const heHeart = he.ops.find(o => o.icon === 'heart');
    expect(heFirst.text).toBe('אלכסנדרה-מרגריטה-שושנה');
    expect(heHeart.x).toBeGreaterThan(heSecond.x);            // Hebrew: reads first, on the right
  });

  it('keeps the "&" with the second name for joined templates', () => {
    const g = lay('G', 'portrait', XLONG_HE);
    expect(g.lines).toBe(2);
    expect(textOps(g.ops).map(o => o.text)).toEqual(['אלכסנדרה-מרגריטה', '& יהונתן-אליעזר']);
    const b = lay('B', 'portrait', XLONG_EN);
    expect(b.lines).toBe(2);
    expect(textOps(b.ops).map(o => o.text)).toEqual(['Alexandra-Margaret', '&', 'Jonathan-Elliot']);
  });

  it('moves D\'s rings beside the names when they wrap in portrait', () => {
    const { ops, lines } = lay('D', 'portrait', XLONG_EN);
    expect(lines).toBe(2);
    const rings = ops.find(o => o.icon === 'rings');
    const names = textOps(ops);
    expect(rings.x + rings.w).toBeLessThanOrEqual(Math.min(...names.map(o => extent(o)[0])));
    expect(rings.y).toBeGreaterThan(names[0].y - 30);         // not stacked above the block
  });

  it('breaks a long name without "&" at the most balanced space', () => {
    const r = lay('C', 'portrait', 'בר המצווה של יונתן-אליעזר בן-דוד');
    expect(r.lines).toBe(2);
    expect(textOps(r.ops).map(o => o.text)).toEqual(['בר המצווה של', 'יונתן-אליעזר בן-דוד']);
  });

  it('shrinks an unbreakable name on one line instead of clipping it', () => {
    const r = lay('C', 'portrait', 'אלכסנדרהמרגריטהיהונתןאליעזר');
    expect(r.lines).toBe(1);
    expect(r.fit).toBeLessThan(minScale('C', 'portrait', 'א'));
    const [l, rr] = extent(textOps(r.ops)[0]);
    expect(l).toBeGreaterThanOrEqual(SAFE_INSET - 1e-6);
    expect(rr).toBeLessThanOrEqual(300 - SAFE_INSET + 1e-6);
  });

  it('reads Hebrew names right to left and Latin names left to right', () => {
    const he = textOps(lay('A', 'portrait', 'שרה & דניאל').ops);
    expect(he.find(o => o.text === 'שרה').x).toBeGreaterThan(he.find(o => o.text === 'דניאל').x);
    expect(he.every(o => o.dir === 'rtl')).toBe(true);
    const en = textOps(lay('A', 'portrait', 'Sarah & Daniel').ops);
    expect(en.find(o => o.text === 'Sarah').x).toBeLessThan(en.find(o => o.text === 'Daniel').x);
  });

  it('puts the separator between split names and shows unsplit names whole', () => {
    const { ops } = lay('A', 'portrait', 'שרה & דניאל');
    expect(ops.filter(o => o.type === 'icon' && o.icon === 'heart')).toHaveLength(1);
    const whole = lay('A', 'portrait', 'בר המצווה של יונתן').ops;
    expect(textOps(whole).map(o => o.text)).toEqual(['בר המצווה של יונתן']);
    expect(whole.some(o => o.type === 'icon')).toBe(false);
    expect(textOps(lay('B', 'portrait', 'Sarah & Daniel').ops).map(o => o.text)).toEqual(['Sarah', '&', 'Daniel']);
    expect(textOps(lay('D', 'portrait', 'Sarah&Daniel').ops).map(o => o.text)).toEqual(['Sarah & Daniel']);
  });

  it('tracks the date glyph by glyph', () => {
    const date = lay('A', 'portrait', 'Sarah & Daniel').ops.find(o => o.type === 'glyphs');
    expect(date.glyphs.map(g => g.ch).join('')).toBe('24.12.2026');
    const step = date.glyphs[1].x - date.glyphs[0].x;
    expect(step).toBeCloseTo(0.5 * 11 + 0.2 * 11);
    const g = lay('G', 'portrait', 'Sarah & Daniel').ops.find(o => o.type === 'glyphs');
    expect(g.glyphs.map(x => x.ch).join('')).toBe('24 · 12 · 2026');
  });

  it('draws B\'s date between two hairlines', () => {
    const rects = lay('B', 'landscape', 'Sarah & Daniel').ops.filter(o => o.type === 'rect');
    expect(rects.map(r => r.w)).toEqual([20, 20]);
  });

  it('places D\'s rings above the names in portrait and beside them in landscape', () => {
    const p = lay('D', 'portrait', 'Sarah & Daniel').ops;
    const ringsP = p.find(o => o.icon === 'rings');
    const namesP = textOps(p)[0];
    expect(ringsP.y + ringsP.h).toBeLessThan(namesP.y);

    const he = lay('D', 'landscape', 'שרה & דניאל').ops;
    const en = lay('D', 'landscape', 'Sarah & Daniel').ops;
    expect(he.find(o => o.icon === 'rings').x).toBeGreaterThan(textOps(he)[0].x);
    expect(en.find(o => o.icon === 'rings').x).toBeLessThan(textOps(en)[0].x);
  });

  it('switches G to Gveret Levin for Hebrew names', () => {
    expect(textOps(lay('G', 'portrait', 'שרה & דניאל').ops)[0].font.family).toBe('tpl-gveret-levin');
    expect(textOps(lay('G', 'portrait', 'Sarah & Daniel').ops)[0].font.family).toBe('tpl-great-vibes');
  });

  it('adds A\'s vertical URL only when the option is on', () => {
    expect(lay('A', 'portrait', 'Sarah & Daniel').ops.some(o => o.type === 'vglyphs')).toBe(false);
    const url = lay('A', 'portrait', 'Sarah & Daniel', undefined, { url: true }).ops.find(o => o.type === 'vglyphs');
    expect(url.cx).toBeCloseTo((14 + 272 + 300) / 2);
    expect(url.cy).toBeCloseTo(14 + 300 / 2);
  });
});

describe('photoSourceRect', () => {
  it('covers the window from the centre by default', () => {
    const r = photoSourceRect(1600, 1200, 272 / 300, null);
    expect(r.h).toBe(1200);
    expect(r.w).toBeCloseTo(1088);
    expect(r.x).toBeCloseTo((1600 - 1088) / 2);
    expect(r.y).toBe(0);
  });

  it('zooms and pans, clamped inside the photo', () => {
    const r = photoSourceRect(1600, 1200, 374 / 213, { panX: 1, panY: 0, zoom: 2 });
    expect(r.w).toBeCloseTo(800);
    expect(r.x + r.w).toBeCloseTo(1600);
    expect(r.y).toBe(0);
  });
});
