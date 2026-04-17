// Sticker packs for MagnetReview — auto-selected by event name.
//
// Types:
//   emoji           — single emoji character
//   text            — white bold text with black stroke
//   badge           — pill-shaped sticker
//   stamp           — rectangular label
//   svg             — inline SVG from svgStickers.js (svgKey references SVG_STICKERS)
//   script-text     — cursive script font (Great Vibes / Parisienne)
//   retro-text      — bold retro caps (Bebas Neue / Limelight)
//   handwritten-text — casual handwritten (Caveat / Patrick Hand)
//   editorial-text  — editorial/magazine (Abril Fatface / Playfair Display)

const WEDDING = [
  { id: 'w-heart',     type: 'svg',           svgKey: 'heart' },
  { id: 'w-heartred',  type: 'svg',           svgKey: 'heartRed' },
  { id: 'w-rose',      type: 'svg',           svgKey: 'rose' },
  { id: 'w-bow',       type: 'svg',           svgKey: 'bow' },
  { id: 'w-sparkle',   type: 'svg',           svgKey: 'sparkle' },
  { id: 'w-crown',     type: 'svg',           svgKey: 'crown' },
  { id: 'w-lips',      type: 'svg',           svgKey: 'lips' },
  { id: 'w-butterfly', type: 'svg',           svgKey: 'butterfly' },
  { id: 'w-flower',    type: 'svg',           svgKey: 'flower' },
  { id: 'w-s1',        type: 'script-text',   content: 'Forever & Always' },
  { id: 'w-s2',        type: 'script-text',   content: 'Just Married' },
  { id: 'w-s3',        type: 'script-text',   content: 'Mr & Mrs' },
  { id: 'w-s4',        type: 'script-text',   content: 'מזל טוב' },
  { id: 'w-e1',        type: 'editorial-text',content: 'LOVE STORY' },
  { id: 'w-e2',        type: 'editorial-text',content: 'FOREVER' },
];

const BAR_MITZVAH = [
  { id: 'b-star',      type: 'svg',        svgKey: 'star' },
  { id: 'b-stargold',  type: 'svg',        svgKey: 'starGold' },
  { id: 'b-davidstar', type: 'svg',        svgKey: 'starOfDavid' },
  { id: 'b-chai',      type: 'svg',        svgKey: 'hebrewChai' },
  { id: 'b-crown',     type: 'svg',        svgKey: 'crown' },
  { id: 'b-sparkle',   type: 'svg',        svgKey: 'sparkle' },
  { id: 'b-sun',       type: 'svg',        svgKey: 'sun' },
  { id: 'b-r1',        type: 'retro-text', content: 'MAZAL TOV' },
  { id: 'b-r2',        type: 'retro-text', content: 'LEGEND' },
  { id: 'b-r3',        type: 'retro-text', content: 'LEVEL UP' },
  { id: 'b-r4',        type: 'retro-text', content: 'בר מצווה' },
  { id: 'b-r5',        type: 'retro-text', content: 'HERO' },
];

const BIRTHDAY = [
  { id: 'bd-disco',    type: 'svg',              svgKey: 'disco' },
  { id: 'bd-discopk',  type: 'svg',              svgKey: 'discoPink' },
  { id: 'bd-cassette', type: 'svg',              svgKey: 'cassette' },
  { id: 'bd-cherry',   type: 'svg',              svgKey: 'cherry' },
  { id: 'bd-heart',    type: 'svg',              svgKey: 'heart' },
  { id: 'bd-star',     type: 'svg',              svgKey: 'starGold' },
  { id: 'bd-sparkle',  type: 'svg',              svgKey: 'sparkle' },
  { id: 'bd-sun',      type: 'svg',              svgKey: 'sun' },
  { id: 'bd-flower',   type: 'svg',              svgKey: 'flower' },
  { id: 'bd-butter',   type: 'svg',              svgKey: 'butterfly' },
  { id: 'bd-h1',       type: 'handwritten-text', content: 'birthday vibes' },
  { id: 'bd-h2',       type: 'handwritten-text', content: 'good times' },
  { id: 'bd-h3',       type: 'handwritten-text', content: 'יום הולדת שמח' },
  { id: 'bd-r1',       type: 'retro-text',       content: 'PARTY' },
  { id: 'bd-r2',       type: 'retro-text',       content: 'ICONIC' },
];

const GENERAL = [
  { id: 'g-camera',  type: 'svg',            svgKey: 'camera' },
  { id: 'g-eye',     type: 'svg',            svgKey: 'evilEye' },
  { id: 'g-eiffel',  type: 'svg',            svgKey: 'eiffel' },
  { id: 'g-moon',    type: 'svg',            svgKey: 'moon' },
  { id: 'g-coffee',  type: 'svg',            svgKey: 'coffee' },
  { id: 'g-straw',   type: 'svg',            svgKey: 'strawberry' },
  { id: 'g-sparkle', type: 'svg',            svgKey: 'sparkle' },
  { id: 'g-star',    type: 'svg',            svgKey: 'star' },
  { id: 'g-heart',   type: 'svg',            svgKey: 'heart' },
  { id: 'g-flower',  type: 'svg',            svgKey: 'flower' },
  { id: 'g-e1',      type: 'editorial-text', content: 'MEMORIES' },
  { id: 'g-e2',      type: 'editorial-text', content: 'VOGUE' },
  { id: 'g-e3',      type: 'editorial-text', content: 'ICONIC' },
  { id: 'g-h1',      type: 'handwritten-text', content: 'good vibes' },
  { id: 'g-h2',      type: 'handwritten-text', content: 'מגנט!' },
];

export function getStickerPack(eventName = '') {
  if (eventName.includes('חתונה') || eventName.toLowerCase().includes('wedding'))
    return WEDDING;
  if (
    eventName.includes('בר מצווה') ||
    eventName.includes('בת מצווה') ||
    eventName.includes('ברית') ||
    eventName.toLowerCase().includes('bar mitzvah')
  )
    return BAR_MITZVAH;
  if (eventName.includes('יום הולדת') || eventName.toLowerCase().includes('birthday'))
    return BIRTHDAY;
  return GENERAL;
}
