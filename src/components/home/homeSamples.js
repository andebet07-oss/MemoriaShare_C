/**
 * homeSamples.js — the sample events behind the hero's three phone mockups,
 * one couple per phone, each shaped like an events row. Photos are in /public.
 */

/** Left: a finished magnet of the dance floor. */
export const MAGNET_EVENT = {
  name: 'עדן & רועי',
  date: '2026-08-12',
  template_id: 'A',
  template_options: { heart: 'red' },
  photo: '/Left_PhoneMoucup_hero.jpeg',
};

/** Centre: the camera, the couple seen through the frame. */
export const CAMERA_EVENT = {
  name: 'נטלי & יואב',
  date: '2026-09-03',
  template_id: 'C',
  template_options: {},
  photo: '/Center_PhoneMoucup_hero.jpeg',
};

/** Right: the guest landing, with the couple as the event cover. */
export const LANDING_EVENT = {
  name: 'מאיה & איתי',
  date: '2026-10-21',
  template_id: 'A',
  template_options: {},
  cover_image: '/right_PhoneMoucup_hero.jpeg',
  print_quota_per_device: 5,
};
