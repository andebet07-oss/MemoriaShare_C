/**
 * homeSamples.js — the sample event the home page shows in its phone mockups
 * and designs section. Photos are the site's own sample images in /public.
 */

export const SAMPLE_NAMES = { he: 'שרה & דניאל', en: 'Sarah & Daniel' };
export const SAMPLE_DATE = '2026-06-18';

/** Couple portrait on the beach (square): the event cover and the designs section. */
export const COUPLE_PHOTO = '/right_PhoneMoucup_hero.jpeg';
/** Dance floor: what the guest photographs in the camera mockup. */
export const PARTY_PHOTO = '/Left_PhoneMoucup_hero.jpeg';

/** Crops (renderer `crop`: centre + zoom) that keep the faces in the window. */
export const CROPS = {
  couple: { portrait: { panX: 0.5, panY: 0.5, zoom: 1 }, landscape: { panX: 0.5, panY: 0.32, zoom: 1 } },
  party: { portrait: { panX: 0.5, panY: 0.42, zoom: 1 } },
};

/** The event behind the hero mockups, shaped like an events row. */
export const SAMPLE_EVENT = {
  name: SAMPLE_NAMES.he,
  date: SAMPLE_DATE,
  template_id: 'A',
  template_options: { heart: 'red' },
  cover_image: COUPLE_PHOTO,
  print_quota_per_device: 5,
};

/** One line per template for the designs section. */
export const TEMPLATE_CAPTIONS = {
  A: 'שמות בגופן עדין ולב קטן ביניהם',
  B: 'סריף קלאסי עם & מסולסל',
  C: 'שמות בולטים ולב אדום',
  D: 'שתי טבעות מעל השמות',
  F: 'השמות בכתב יד חם',
  G: 'כתב מסולסל, בעברית ובאנגלית',
};
