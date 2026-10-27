import { useEffect, useMemo, useState } from 'react';
import { getTemplate, eventTemplateId } from '@/lib/polaroid/templates';
import { FONTS, loadFonts, fontString, hasHebrewGlyphs } from '@/lib/polaroid/fonts';
import { isHebrew, joinNames, splitNames } from '@/lib/polaroid/text';

export const TITLE_MIN = 34;
const FALLBACK = FONTS.bellefair;

/**
 * The guest-page title font: the names font of the event's magnet template
 * (its Hebrew font for Hebrew names), or Bellefair when that font has no
 * Hebrew glyphs.
 */
export function titleFont(templateId, name) {
  const { names } = getTemplate(eventTemplateId({ template_id: templateId }));
  if (!isHebrew(name)) return names.font;
  const font = names.hebrew?.font ?? names.font;
  return hasHebrewGlyphs(font) ? font : FALLBACK;
}

/** Two lines for a long name: "n1" / "& n2", else the most even split on a space. */
export function splitTitle(name) {
  const parts = splitNames(name);
  if (parts) return [parts[0], `& ${parts[1]}`];
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return null;
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) { best = i; bestDiff = diff; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/**
 * Fit the title to `width`: one line, shrunk from `base` down to TITLE_MIN;
 * if that is not enough, two lines, never smaller than TITLE_MIN.
 * `widthAt1px(text)` is the text's width at a 1px font size.
 */
export function fitTitle(name, width, base, widthAt1px) {
  const fit = (text) => Math.min(base, Math.floor(width / widthAt1px(text)));
  const one = fit(name);
  const lines = one >= TITLE_MIN ? null : splitTitle(name);
  if (!lines) return { lines: [name], size: Math.max(TITLE_MIN, one) };
  return { lines, size: Math.max(TITLE_MIN, Math.min(...lines.map(fit))) };
}

let canvas;
function widthAt1px(font, text) {
  canvas ??= document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font ? fontString(font, 100) : '400 100px serif';
  return ctx.measureText(text).width / 100 || 1;
}

/**
 * The event names as the guest page shows them: in the template's font,
 * sized to fit `width` (48px, 44px on narrow screens). `ready` turns true
 * once the font has loaded (or failed over), so the names never flash in a
 * fallback font.
 */
export function useEventTitle(event, width) {
  const name = joinNames(event?.name || '');
  const wanted = useMemo(() => titleFont(event?.template_id, name), [event?.template_id, name]);
  const [font, setFont] = useState({ wanted: null, loaded: undefined });

  useEffect(() => {
    let alive = true;
    const settle = (loaded) => { if (alive) setFont({ wanted, loaded }); };
    loadFonts([wanted])
      .then(() => settle(wanted))
      .catch(() => loadFonts([FALLBACK]).then(() => settle(FALLBACK), () => settle(null)));
    return () => { alive = false; };
  }, [wanted]);

  const ready = font.wanted === wanted && width > 0;
  const fitted = useMemo(() => (ready
    ? fitTitle(name, width, width >= 350 ? 48 : 44, (text) => widthAt1px(font.loaded, text))
    : { lines: [name], size: 48 }), [ready, name, width, font.loaded]);

  const family = font.loaded ? `"${font.loaded.family}", serif` : 'serif';
  return {
    ready,
    lines: fitted.lines,
    style: { fontFamily: family, fontWeight: font.loaded?.weight ?? 400, fontSize: fitted.size },
  };
}
