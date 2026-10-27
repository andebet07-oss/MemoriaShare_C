/**
 * printSpec.js — physical print spec + shared polaroid geometry.
 *
 * The magnet is 7.5 × 10 cm ≈ 3 × 4 in. The printer is likely a DNP with
 * 6 × 4 in media cut in two, so the output size lives in this ONE value:
 * change PRINT_SPEC and every render, preview and print page follows.
 *
 * Templates are designed in units of 300 × 400 (portrait) / 400 × 300
 * (landscape) — 100 units per inch — and scaled to the output.
 */
export const PRINT_SPEC = { widthIn: 3, heightIn: 4, dpi: 300 };

export const ORIENTATIONS = ['portrait', 'landscape'];

export const DESIGN = {
  portrait:  { w: 300, h: 400 },
  landscape: { w: 400, h: 300 },
};

/** Photo window, in design units. The caption is the strip below it. */
export const WINDOW = {
  portrait:  { x: 14, y: 14, w: 272, h: 300 },
  landscape: { x: 13, y: 13, w: 374, h: 213 },
};

export const PAPER = '#FDFDFB';

/** Text stays at least this far inside the trim edge. */
export const SAFE_MARGIN_MM = 4;

const MM_PER_IN = 25.4;
const UNITS_PER_IN = DESIGN.portrait.w / PRINT_SPEC.widthIn; // 100

/** The safe margin in design units (≈ 15.75). */
export const SAFE_INSET = (SAFE_MARGIN_MM / MM_PER_IN) * UNITS_PER_IN;

export const normalizeOrientation = (o) => (o === 'landscape' ? 'landscape' : 'portrait');

/** Output pixel size for an orientation, e.g. 900 × 1200 / 1200 × 900. */
export function printSize(orientation) {
  const short = Math.round(PRINT_SPEC.widthIn * PRINT_SPEC.dpi);
  const long = Math.round(PRINT_SPEC.heightIn * PRINT_SPEC.dpi);
  return normalizeOrientation(orientation) === 'landscape' ? { w: long, h: short } : { w: short, h: long };
}

/** Pixels per design unit at print resolution (3 at 300 DPI). */
export const PRINT_SCALE = printSize('portrait').w / DESIGN.portrait.w;

/** Window aspect ratio (w / h) — the crop aspect for a photo in this orientation. */
export function windowAspect(orientation) {
  const win = WINDOW[normalizeOrientation(orientation)];
  return win.w / win.h;
}

/** Window as fractions of the magnet — for positioning the live video in CSS. */
export function windowFractions(orientation) {
  const o = normalizeOrientation(orientation);
  const { w, h } = DESIGN[o];
  const win = WINDOW[o];
  return { left: win.x / w, top: win.y / h, width: win.w / w, height: win.h / h };
}
