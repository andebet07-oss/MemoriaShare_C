/**
 * layout.js — pure caption layout for a template (no DOM).
 *
 * Turns a template + names + date into draw ops in design units. The text
 * metrics come from an injected `measure(text, font)` that returns, per unit of
 * font size: { width, ascent, descent, cap, desc } — advance width, the text's
 * ink extents above and below the baseline, and the script's reference cap
 * height ('H' / 'ה') and descender depth ('gjpqyJ' / 'ךןףץק').
 * Measuring per unit makes the layout identical at every output scale, so the
 * viewfinder overlay and the print are the same design.
 *
 * Ops (design units, y grows down):
 *   { type: 'text',   text, font, size, color, x (centre), y (baseline), dir }
 *   { type: 'glyphs', glyphs: [{ ch, x }], font, size, color, y }   — tracked text
 *   { type: 'icon',   icon, x, y, w, h, color }                     — x, y top-left
 *   { type: 'rect',   x, y, w, h, color }                           — hairline
 *   { type: 'vglyphs', glyphs, font, size, color, cx, cy, xHeight } — vertical tracked text
 */
import { DESIGN, WINDOW, SAFE_INSET, normalizeOrientation } from './printSpec';
import { resolveColor } from './templates';
import { isHebrew, textDirection, splitNames, joinNames, formatTemplateDate } from './text';

const pick = (v, i) => (Array.isArray(v) ? v[i] : v);

/** Glyph-by-glyph positions for tracked text, starting at x = 0. */
function trackedRun(text, font, size, tracking, measure) {
  const glyphs = [];
  let x = 0;
  for (const ch of text) {
    glyphs.push({ ch, x });
    x += measure(ch, font).width * size + tracking * size;
  }
  const width = text ? x - tracking * size : 0;
  return { glyphs, width };
}

/** The names row, fitted to maxWidth. Box is around a baseline at y = 0. */
function namesRow(template, oi, name, options, measure, maxWidth) {
  const spec = template.names;
  const trimmed = (name || '').trim();
  if (!trimmed) return null;

  const hebrew = isHebrew(trimmed);
  const font = hebrew && spec.hebrew ? spec.hebrew.font : spec.font;
  const baseSize = pick(hebrew && spec.hebrew ? spec.hebrew.size : spec.size, oi);
  const parts = spec.layout === 'split' ? splitNames(trimmed) : null;
  const textItem = (text) => ({ kind: 'text', text, dir: textDirection(text), m: measure(text, font), size: baseSize });

  let items;
  let gap = 0;
  if (parts) {
    const sep = spec.separator;
    // Visual order left → right: RTL names read first-name-on-the-right.
    const [left, right] = hebrew ? [parts[1], parts[0]] : parts;
    const sepColor = resolveColor(template, sep.color, options);
    const sepItem = sep.kind === 'icon'
      ? { kind: 'icon', icon: sep.icon, size: pick(sep.size, oi), color: sepColor }
      : { kind: 'glyph', text: sep.text, font: sep.font, m: measure(sep.text, sep.font), size: pick(sep.size, oi), color: sepColor };
    items = [textItem(left), sepItem, textItem(right)];
    gap = pick(sep.gap, oi);
  } else {
    items = [textItem(spec.layout === 'joined' ? joinNames(trimmed) : trimmed)];
  }

  const widthOf = (it, f) => (it.kind === 'icon' ? it.size : it.m.width * it.size) * f;
  const natural = items.reduce((s, it) => s + widthOf(it, 1), 0) + gap * (items.length - 1);
  // Long names shrink — names, separator and gaps by one factor — to fit.
  const f = natural > maxWidth ? maxWidth / natural : 1;

  const cap = Math.max(...items.filter(it => it.kind === 'text').map(it => it.m.cap * it.size)) * f;
  let top = -cap, bottom = 0, inkTop = 0, inkBottom = 0;
  const placed = items.map((it) => {
    const size = it.size * f;
    const w = widthOf(it, f);
    if (it.kind === 'text') {
      // The row box reaches the script's descender line, so the gap below the
      // names never depends on which letters they happen to contain.
      bottom = Math.max(bottom, Math.max(it.m.desc, it.m.descent) * size);
      inkTop = Math.min(inkTop, -it.m.ascent * size);
      inkBottom = Math.max(inkBottom, it.m.descent * size);
      return { ...it, size, w };
    }
    if (it.kind === 'icon') {
      const y = -cap / 2 - size / 2; // centred on the names' cap height
      top = Math.min(top, y); bottom = Math.max(bottom, y + size);
      inkTop = Math.min(inkTop, y); inkBottom = Math.max(inkBottom, y + size);
      return { ...it, size, w, y };
    }
    // Decorative glyph: its ink centre sits on the names' cap centre.
    const baseline = -cap / 2 + ((it.m.ascent - it.m.descent) * size) / 2;
    const gTop = baseline - it.m.ascent * size;
    const gBottom = baseline + it.m.descent * size;
    top = Math.min(top, gTop); bottom = Math.max(bottom, gBottom);
    inkTop = Math.min(inkTop, gTop); inkBottom = Math.max(inkBottom, gBottom);
    return { ...it, size, w, baseline };
  });

  const width = placed.reduce((s, it) => s + it.w, 0) + gap * f * (placed.length - 1);
  const color = spec.color;
  return {
    width, top, bottom, inkTop: Math.min(inkTop, top), inkBottom: Math.max(inkBottom, bottom), fit: f,
    ops(cx, y) {
      const out = [];
      let x = cx - width / 2;
      for (const it of placed) {
        if (it.kind === 'text') out.push({ type: 'text', text: it.text, font, size: it.size, color, x: x + it.w / 2, y, dir: it.dir });
        else if (it.kind === 'icon') out.push({ type: 'icon', icon: it.icon, x, y: y + it.y, w: it.size, h: it.size, color: it.color });
        else out.push({ type: 'text', text: it.text, font: it.font, size: it.size, color: it.color, x: x + it.w / 2, y: y + it.baseline, dir: 'ltr' });
        x += it.w + gap * f;
      }
      return out;
    },
  };
}

/** The date row (tracked digits, optional hairlines either side). */
function dateRow(template, oi, date, measure) {
  const spec = template.date;
  const text = formatTemplateDate(date, spec.separator);
  if (!text) return null;
  const size = pick(spec.size, oi);
  const run = trackedRun(text, spec.font, size, spec.tracking, measure);
  const cap = measure(text, spec.font).ascent * size; // digit height
  const lines = spec.hairlines;
  const lineW = lines ? pick(lines.width, oi) : 0;
  const lineGap = lines ? lines.gap : 0;
  const width = run.width + (lines ? 2 * (lineW + lineGap) : 0);
  return {
    width, top: -cap, bottom: 0, inkTop: -cap, inkBottom: 0,
    ops(cx, y) {
      const start = cx - width / 2;
      const textX = start + (lines ? lineW + lineGap : 0);
      const out = [{ type: 'glyphs', glyphs: run.glyphs.map(g => ({ ch: g.ch, x: textX + g.x })), font: spec.font, size, color: spec.color, y }];
      if (lines) {
        const ly = y - cap / 2 - 0.5;
        out.push({ type: 'rect', x: start, y: ly, w: lineW, h: 1, color: lines.color });
        out.push({ type: 'rect', x: textX + run.width + lineGap, y: ly, w: lineW, h: 1, color: lines.color });
      }
      return out;
    },
  };
}

/** A fixed-size icon row (D's rings), baseline at its bottom edge. */
function iconRow(template, options) {
  const spec = template.icon;
  const color = resolveColor(template, spec.color, options);
  return {
    width: spec.w, top: -spec.h, bottom: 0, inkTop: -spec.h, inkBottom: 0,
    ops: (cx, y) => [{ type: 'icon', icon: spec.icon, x: cx - spec.w / 2, y: y - spec.h, w: spec.w, h: spec.h, color }],
  };
}

/** Stack rows top → bottom with gaps; returns the block box and placement fn. */
function stack(rows, gaps) {
  let y = 0;
  const placed = rows.map((row, i) => {
    if (i > 0) y += gaps[i - 1];
    const baseline = y - row.top;
    y = baseline + row.bottom;
    return { row, baseline };
  });
  const first = placed[0], last = placed[placed.length - 1];
  return {
    height: y,
    width: Math.max(...rows.map(r => r.width)),
    inkTop: first.baseline + first.row.inkTop,          // ≤ 0
    inkBottom: last.baseline + last.row.inkBottom,     // ≥ height
    ops: (cx, top) => placed.flatMap(p => p.row.ops(cx, top + p.baseline)),
  };
}

/**
 * Lay out the caption (and A's vertical URL) for a template.
 * @returns {{ ops: object[], block: { top, height }, fit: number }}
 */
export function layoutCaption(template, orientation, { name, date, options }, measure) {
  const o = normalizeOrientation(orientation);
  const oi = o === 'landscape' ? 1 : 0;
  const { w: W, h: H } = DESIGN[o];
  const win = WINDOW[o];
  const capTop = win.y + win.h;
  const safeWidth = W - 2 * SAFE_INSET;
  const isD = !!template.icon;
  const iconBeside = isD && o === 'landscape';
  const besideW = iconBeside ? template.icon.w + template.icon.gapBeside : 0;

  const names = namesRow(template, oi, name, options, measure, safeWidth - besideW);
  const dateR = dateRow(template, oi, date, measure);
  const dateGap = pick(template.date.gap, oi);

  // Rows of the text block (names over date) and the gaps between them.
  const rows = [], gaps = [];
  if (isD && !iconBeside) { rows.push(iconRow(template, options)); }
  if (names) { if (rows.length) gaps.push(pick(template.icon.gapAbove, oi)); rows.push(names); }
  if (dateR) { if (rows.length) gaps.push(names ? dateGap : pick(template.icon?.gapAbove ?? 0, oi)); rows.push(dateR); }

  const ops = [];
  let block = { top: capTop, height: 0 };
  if (rows.length) {
    const s = stack(rows, gaps);
    // D landscape: the rings sit beside the block, on the reading-start side.
    const icon = iconBeside ? iconRow(template, options) : null;
    const height = icon ? Math.max(s.height, template.icon.h) : s.height;
    const totalW = s.width + besideW;

    // Centre in the caption strip, then keep the ink inside the safe area.
    let top = capTop + (H - capTop - height) / 2;
    const textTop = top + (height - s.height) / 2;
    const overflow = textTop + s.inkBottom - (H - SAFE_INSET);
    if (overflow > 0) top -= overflow;
    const tTop = top + (height - s.height) / 2;

    const rtl = isHebrew(name || '');
    const left = W / 2 - totalW / 2;
    const blockCx = icon ? (rtl ? left + s.width / 2 : left + besideW + s.width / 2) : W / 2;
    ops.push(...s.ops(blockCx, tTop));
    if (icon) {
      const iconCx = rtl ? left + s.width + template.icon.gapBeside + template.icon.w / 2 : left + template.icon.w / 2;
      ops.push(...icon.ops(iconCx, top + height / 2 + template.icon.h / 2));
    }
    block = { top, height };
  }

  // A: "memoriashare.com" set vertically in the right border, centred on the photo.
  if (template.url && options[template.url.option]) {
    const u = template.url;
    const run = trackedRun(u.text, u.font, u.size, u.tracking, measure);
    ops.push({
      type: 'vglyphs', font: u.font, size: u.size, color: u.color,
      glyphs: run.glyphs.map(g => ({ ch: g.ch, x: g.x - run.width / 2 })),
      cx: (win.x + win.w + W) / 2, cy: win.y + win.h / 2,
      xHeight: measure('x', u.font).ascent * u.size,
    });
  }

  return { ops, block, fit: names ? names.fit : 1 };
}
