/**
 * samplePhotos.js — the home page's placeholder event photos and the magnets
 * made from them, in one place so they can be swapped later.
 *
 * Photos live in public/samples as WebP, at most 800px wide (2x their largest
 * display). A photo is used once per section; with nine photos and about
 * twenty places, some repeat across sections (never within one).
 *
 * The decorative magnets are pre-rendered by the real template renderer into
 * public/samples/magnets (see scripts/home-samples/README.md). After changing
 * a photo, a crop or a name here, re-render them. `crop.panY` keeps faces in
 * frame (0 = top of the photo, 1 = bottom); `width` is the output width in px.
 */
export const PHOTOS = {
  party: '/samples/Left_PhoneMoucup_hero.webp',
  couple: '/samples/Center_PhoneMoucup_hero.webp',
  reception: '/samples/right_PhoneMoucup_hero.webp',
  bridesmaids: '/samples/sample_bridesmaids.webp',
  champagne: '/samples/sample_champagne_bw.webp',
  kiss: '/samples/sample_couple_kiss.webp',
  danceBw: '/samples/sample_dance_bw.webp',
  danceFloor: '/samples/sample_dance_floor.webp',
  groupNight: '/samples/sample_group_night.webp',
};

const P = 'portrait';
const L = 'landscape';

/** id → render spec. The file is /samples/magnets/{id}.webp. */
export const MAGNETS = {
  // Hero: the camera viewfinder, the finished magnet, three floating magnets
  'hero-camera': { photo: 'couple', templateId: 'C', orientation: P, name: 'נטלי & יואב', date: '2026-09-03', width: 480 },
  'hero-ready': { photo: 'party', templateId: 'A', options: { heart: 'red' }, orientation: P, name: 'עדן & רועי', date: '2026-08-12', width: 420 },
  'hero-float-1': { photo: 'bridesmaids', templateId: 'F', orientation: P, name: 'ליה & אור', date: '2026-06-18', width: 340 },
  'hero-float-2': { photo: 'danceBw', templateId: 'G', orientation: P, name: 'תמר & נדב', date: '2026-11-05', width: 340 },
  'hero-float-3': { photo: 'kiss', templateId: 'B', orientation: L, name: 'רוני & עידו', date: '2027-02-14', crop: { panY: 0.3 }, width: 420 },
  // "למה Memoria": a fridge group, the camera, a freshly printed magnet
  'why-1': { photo: 'danceFloor', templateId: 'D', orientation: P, name: 'נוי & אלון', date: '2026-07-09', width: 600 },
  'why-2': { photo: 'champagne', templateId: 'B', options: { amp: 'gold' }, orientation: P, name: 'הילה & רון', date: '2026-12-31', width: 560 },
  'why-3': { photo: 'groupNight', templateId: 'A', orientation: L, name: 'שקד & עמית', date: '2027-03-21', crop: { panY: 0.33 }, width: 680 },
  'why-camera': { photo: 'kiss', templateId: 'C', orientation: P, name: 'יעל & דניאל', date: '2027-05-02', width: 560 },
  'why-ready': { photo: 'bridesmaids', templateId: 'G', orientation: P, name: 'גלי & טל', date: '2026-10-15', width: 560 },
  // Final CTA
  'final-1': { photo: 'party', templateId: 'D', orientation: L, name: 'דנה & יוני', date: '2026-09-24', crop: { panY: 0.45 }, width: 680 },
  'final-2': { photo: 'danceBw', templateId: 'C', orientation: P, name: 'אור & ליאור', date: '2027-01-08', width: 460 },
  'final-3': { photo: 'danceFloor', templateId: 'F', orientation: P, name: 'מאי & שחר', date: '2026-08-27', width: 480 },
};

/** The designer: one photo per template, so the templates are easy to tell apart. */
export const DESIGNER_PHOTOS = {
  A: 'reception', B: 'champagne', C: 'couple', D: 'kiss', F: 'danceFloor', G: 'groupNight',
};
export const DESIGNER_SAMPLE = { name: 'שירה & עומר', date: '2027-06-17' };

/** Designer thumbnails are pre-rendered too: /samples/magnets/tpl-{id}.webp. */
export const THUMBNAILS = Object.fromEntries(Object.entries(DESIGNER_PHOTOS).map(([templateId, photo]) => [
  `tpl-${templateId}`, { photo, templateId, orientation: P, ...DESIGNER_SAMPLE, width: 300 },
]));

export const magnetSrc = (id) => `/samples/magnets/${id}.webp`;
