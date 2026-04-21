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
  // SVG art
  { id: 'w-heart',     type: 'svg',  svgKey: 'heart' },
  { id: 'w-heartred',  type: 'svg',  svgKey: 'heartRed' },
  { id: 'w-rose',      type: 'svg',  svgKey: 'rose' },
  { id: 'w-bow',       type: 'svg',  svgKey: 'bow' },
  { id: 'w-sparkle',   type: 'svg',  svgKey: 'sparkle' },
  { id: 'w-crown',     type: 'svg',  svgKey: 'crown' },
  { id: 'w-lips',      type: 'svg',  svgKey: 'lips' },
  { id: 'w-butterfly', type: 'svg',  svgKey: 'butterfly' },
  { id: 'w-flower',    type: 'svg',  svgKey: 'flower' },
  // Emoji — wedding & celebration icons
  { id: 'w-em1',  type: 'emoji', content: '💍' },
  { id: 'w-em2',  type: 'emoji', content: '💒' },
  { id: 'w-em3',  type: 'emoji', content: '👰' },
  { id: 'w-em4',  type: 'emoji', content: '🤵' },
  { id: 'w-em5',  type: 'emoji', content: '💐' },
  { id: 'w-em6',  type: 'emoji', content: '🥂' },
  { id: 'w-em7',  type: 'emoji', content: '🎂' },
  { id: 'w-em8',  type: 'emoji', content: '🌹' },
  { id: 'w-em9',  type: 'emoji', content: '💌' },
  { id: 'w-em10', type: 'emoji', content: '🕊️' },
  { id: 'w-em11', type: 'emoji', content: '💖' },
  { id: 'w-em12', type: 'emoji', content: '🌷' },
  { id: 'w-em13', type: 'emoji', content: '✨' },
  { id: 'w-em14', type: 'emoji', content: '🔔' },
  { id: 'w-em15', type: 'emoji', content: '🎀' },
  { id: 'w-em16', type: 'emoji', content: '💎' },
  { id: 'w-em17', type: 'emoji', content: '🌸' },
  { id: 'w-em18', type: 'emoji', content: '🍾' },
  { id: 'w-em19', type: 'emoji', content: '🎊' },
  { id: 'w-em20', type: 'emoji', content: '👡' },
  // Text stickers
  { id: 'w-s1', type: 'script-text',    content: 'Forever & Always' },
  { id: 'w-s2', type: 'script-text',    content: 'Just Married' },
  { id: 'w-s3', type: 'script-text',    content: 'Mr & Mrs' },
  { id: 'w-s4', type: 'script-text',    content: 'מזל טוב' },
  { id: 'w-e1', type: 'editorial-text', content: 'LOVE STORY' },
  { id: 'w-e2', type: 'editorial-text', content: 'FOREVER' },
];

const BAR_MITZVAH = [
  // SVG art
  { id: 'b-star',      type: 'svg', svgKey: 'star' },
  { id: 'b-stargold',  type: 'svg', svgKey: 'starGold' },
  { id: 'b-davidstar', type: 'svg', svgKey: 'starOfDavid' },
  { id: 'b-chai',      type: 'svg', svgKey: 'hebrewChai' },
  { id: 'b-crown',     type: 'svg', svgKey: 'crown' },
  { id: 'b-sparkle',   type: 'svg', svgKey: 'sparkle' },
  { id: 'b-sun',       type: 'svg', svgKey: 'sun' },
  // Emoji
  { id: 'b-em1',  type: 'emoji', content: '✡️' },
  { id: 'b-em2',  type: 'emoji', content: '🕍' },
  { id: 'b-em3',  type: 'emoji', content: '📜' },
  { id: 'b-em4',  type: 'emoji', content: '🏆' },
  { id: 'b-em5',  type: 'emoji', content: '👑' },
  { id: 'b-em6',  type: 'emoji', content: '🥂' },
  { id: 'b-em7',  type: 'emoji', content: '🎂' },
  { id: 'b-em8',  type: 'emoji', content: '🎊' },
  { id: 'b-em9',  type: 'emoji', content: '💫' },
  { id: 'b-em10', type: 'emoji', content: '⭐' },
  { id: 'b-em11', type: 'emoji', content: '🌟' },
  { id: 'b-em12', type: 'emoji', content: '🎁' },
  { id: 'b-em13', type: 'emoji', content: '🍾' },
  { id: 'b-em14', type: 'emoji', content: '✨' },
  // Text stickers
  { id: 'b-r1', type: 'retro-text', content: 'MAZAL TOV' },
  { id: 'b-r2', type: 'retro-text', content: 'LEGEND' },
  { id: 'b-r3', type: 'retro-text', content: 'LEVEL UP' },
  { id: 'b-r4', type: 'retro-text', content: 'בר מצווה' },
  { id: 'b-r5', type: 'retro-text', content: 'HERO' },
  { id: 'b-r6', type: 'retro-text', content: 'בת מצווה' },
];

const BIRTHDAY = [
  // SVG art
  { id: 'bd-disco',    type: 'svg', svgKey: 'disco' },
  { id: 'bd-discopk',  type: 'svg', svgKey: 'discoPink' },
  { id: 'bd-cassette', type: 'svg', svgKey: 'cassette' },
  { id: 'bd-cherry',   type: 'svg', svgKey: 'cherry' },
  { id: 'bd-heart',    type: 'svg', svgKey: 'heart' },
  { id: 'bd-star',     type: 'svg', svgKey: 'starGold' },
  { id: 'bd-sparkle',  type: 'svg', svgKey: 'sparkle' },
  { id: 'bd-sun',      type: 'svg', svgKey: 'sun' },
  { id: 'bd-flower',   type: 'svg', svgKey: 'flower' },
  { id: 'bd-butter',   type: 'svg', svgKey: 'butterfly' },
  // Emoji
  { id: 'bd-em1',  type: 'emoji', content: '🎂' },
  { id: 'bd-em2',  type: 'emoji', content: '🎈' },
  { id: 'bd-em3',  type: 'emoji', content: '🎁' },
  { id: 'bd-em4',  type: 'emoji', content: '🥂' },
  { id: 'bd-em5',  type: 'emoji', content: '🎊' },
  { id: 'bd-em6',  type: 'emoji', content: '🎉' },
  { id: 'bd-em7',  type: 'emoji', content: '💫' },
  { id: 'bd-em8',  type: 'emoji', content: '🌟' },
  { id: 'bd-em9',  type: 'emoji', content: '🎶' },
  { id: 'bd-em10', type: 'emoji', content: '🍾' },
  { id: 'bd-em11', type: 'emoji', content: '🌈' },
  { id: 'bd-em12', type: 'emoji', content: '🎵' },
  { id: 'bd-em13', type: 'emoji', content: '🧁' },
  { id: 'bd-em14', type: 'emoji', content: '🎠' },
  // Text stickers
  { id: 'bd-h1', type: 'handwritten-text', content: 'birthday vibes' },
  { id: 'bd-h2', type: 'handwritten-text', content: 'good times' },
  { id: 'bd-h3', type: 'handwritten-text', content: 'יום הולדת שמח' },
  { id: 'bd-r1', type: 'retro-text',       content: 'PARTY' },
  { id: 'bd-r2', type: 'retro-text',       content: 'ICONIC' },
];

const BRIT = [
  // SVG art
  { id: 'br-heart',   type: 'svg', svgKey: 'heart' },
  { id: 'br-sparkle', type: 'svg', svgKey: 'sparkle' },
  { id: 'br-star',    type: 'svg', svgKey: 'starGold' },
  { id: 'br-bow',     type: 'svg', svgKey: 'bow' },
  { id: 'br-flower',  type: 'svg', svgKey: 'flower' },
  // Emoji
  { id: 'br-em1',  type: 'emoji', content: '👶' },
  { id: 'br-em2',  type: 'emoji', content: '🍼' },
  { id: 'br-em3',  type: 'emoji', content: '💙' },
  { id: 'br-em4',  type: 'emoji', content: '⭐' },
  { id: 'br-em5',  type: 'emoji', content: '✨' },
  { id: 'br-em6',  type: 'emoji', content: '🌟' },
  { id: 'br-em7',  type: 'emoji', content: '🎀' },
  { id: 'br-em8',  type: 'emoji', content: '🥂' },
  { id: 'br-em9',  type: 'emoji', content: '🎊' },
  { id: 'br-em10', type: 'emoji', content: '✡️' },
  { id: 'br-em11', type: 'emoji', content: '🌱' },
  { id: 'br-em12', type: 'emoji', content: '💫' },
  // Text
  { id: 'br-r1', type: 'retro-text',       content: 'MAZAL TOV' },
  { id: 'br-s1', type: 'script-text',      content: 'ברוך הבא' },
  { id: 'br-h1', type: 'handwritten-text', content: 'מזל טוב' },
];

const GENERAL = [
  // SVG art
  { id: 'g-camera',  type: 'svg', svgKey: 'camera' },
  { id: 'g-eye',     type: 'svg', svgKey: 'evilEye' },
  { id: 'g-moon',    type: 'svg', svgKey: 'moon' },
  { id: 'g-sparkle', type: 'svg', svgKey: 'sparkle' },
  { id: 'g-star',    type: 'svg', svgKey: 'star' },
  { id: 'g-heart',   type: 'svg', svgKey: 'heart' },
  { id: 'g-flower',  type: 'svg', svgKey: 'flower' },
  { id: 'g-butter',  type: 'svg', svgKey: 'butterfly' },
  // Emoji — happy event appropriate only
  { id: 'g-em1',  type: 'emoji', content: '📸' },
  { id: 'g-em2',  type: 'emoji', content: '❤️' },
  { id: 'g-em3',  type: 'emoji', content: '💕' },
  { id: 'g-em4',  type: 'emoji', content: '💖' },
  { id: 'g-em5',  type: 'emoji', content: '🌸' },
  { id: 'g-em6',  type: 'emoji', content: '🌺' },
  { id: 'g-em7',  type: 'emoji', content: '🌻' },
  { id: 'g-em8',  type: 'emoji', content: '🌹' },
  { id: 'g-em9',  type: 'emoji', content: '🌷' },
  { id: 'g-em10', type: 'emoji', content: '🧿' },
  { id: 'g-em11', type: 'emoji', content: '⭐' },
  { id: 'g-em12', type: 'emoji', content: '💫' },
  { id: 'g-em13', type: 'emoji', content: '✨' },
  { id: 'g-em14', type: 'emoji', content: '🎉' },
  { id: 'g-em15', type: 'emoji', content: '🥂' },
  { id: 'g-em16', type: 'emoji', content: '😊' },
  { id: 'g-em17', type: 'emoji', content: '🎊' },
  { id: 'g-em18', type: 'emoji', content: '💐' },
  // Text stickers
  { id: 'g-e1', type: 'editorial-text',   content: 'MEMORIES' },
  { id: 'g-e2', type: 'editorial-text',   content: 'ICONIC' },
  { id: 'g-h1', type: 'handwritten-text', content: 'good vibes' },
  { id: 'g-h2', type: 'handwritten-text', content: 'מגנט!' },
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
