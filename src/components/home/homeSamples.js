/**
 * homeSamples.js — the sample event behind the hero's phone mockups. The
 * photos are the hero's original images in /public, one per phone.
 */

/** One photo per phone, by screen position. */
export const HERO_PHOTOS = {
  left: '/Left_PhoneMoucup_hero.jpeg',     // dance floor → the finished magnet
  center: '/Center_PhoneMoucup_hero.jpeg', // the couple → the camera
  right: '/right_PhoneMoucup_hero.jpeg',   // beach → the guest landing (event cover)
};

/** The event behind the hero mockups, shaped like an events row. */
export const SAMPLE_EVENT = {
  name: 'שרה & דניאל',
  date: '2026-06-18',
  template_id: 'A',
  template_options: { heart: 'red' },
  cover_image: HERO_PHOTOS.right,
  print_quota_per_device: 5,
};
