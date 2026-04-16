// Sticker packs for MagnetReview — auto-selected by event name.
//
// Types:
//   emoji  — single emoji character (rendered large)
//   text   — white bold text with black stroke (floating label)
//   badge  — pill-shaped sticker; dark=false → lime bg / dark text, dark=true → black bg / white text
//   stamp  — rectangular label, white bg, black border, bold uppercase text

const WEDDING = [
  { id: 'w1',  type: 'badge',  content: 'JUST MARRIED ✨', dark: false },
  { id: 'w2',  type: 'badge',  content: 'FOREVER ♾',       dark: true  },
  { id: 'w3',  type: 'stamp',  content: 'LOVE STORY' },
  { id: 'w4',  type: 'stamp',  content: 'YES!' },
  { id: 'w5',  type: 'emoji',  content: '💋' },
  { id: 'w6',  type: 'emoji',  content: '👑' },
  { id: 'w7',  type: 'emoji',  content: '🥂' },
  { id: 'w8',  type: 'emoji',  content: '💎' },
  { id: 'w9',  type: 'text',   content: 'מזל טוב! 🎊' },
  { id: 'w10', type: 'text',   content: 'יאללה! ❤️' },
  { id: 'w11', type: 'text',   content: 'WOW!' },
];

const BAR_MITZVAH = [
  { id: 'b1',  type: 'badge',  content: 'BAR MITZVAH 🌟', dark: false },
  { id: 'b2',  type: 'badge',  content: 'LEGEND',          dark: true  },
  { id: 'b3',  type: 'stamp',  content: 'LEVEL UP' },
  { id: 'b4',  type: 'stamp',  content: 'HERO' },
  { id: 'b5',  type: 'emoji',  content: '⭐' },
  { id: 'b6',  type: 'emoji',  content: '👑' },
  { id: 'b7',  type: 'emoji',  content: '🔥' },
  { id: 'b8',  type: 'text',   content: 'מזל טוב! 🎊' },
  { id: 'b9',  type: 'text',   content: 'שחקן! 🌟' },
  { id: 'b10', type: 'text',   content: 'כוכב! ✨' },
];

const BIRTHDAY = [
  { id: 'bd1', type: 'badge',  content: 'BIRTHDAY STAR 🌟', dark: false },
  { id: 'bd2', type: 'badge',  content: 'MAIN CHARACTER',    dark: true  },
  { id: 'bd3', type: 'stamp',  content: 'ICONIC' },
  { id: 'bd4', type: 'stamp',  content: 'LIT' },
  { id: 'bd5', type: 'emoji',  content: '👑' },
  { id: 'bd6', type: 'emoji',  content: '💎' },
  { id: 'bd7', type: 'emoji',  content: '🔥' },
  { id: 'bd8', type: 'text',   content: 'יום הולדת שמח! 🎉' },
  { id: 'bd9', type: 'text',   content: 'מלך / מלכה! 💅' },
  { id: 'bd10',type: 'text',   content: 'WOW! ✨' },
];

const GENERAL = [
  { id: 'g1',  type: 'badge',  content: 'WOW! 📸',  dark: false },
  { id: 'g2',  type: 'badge',  content: 'BESTIES',   dark: true  },
  { id: 'g3',  type: 'stamp',  content: 'VIBE' },
  { id: 'g4',  type: 'stamp',  content: 'LEGEND' },
  { id: 'g5',  type: 'emoji',  content: '💋' },
  { id: 'g6',  type: 'emoji',  content: '✨' },
  { id: 'g7',  type: 'emoji',  content: '📸' },
  { id: 'g8',  type: 'text',   content: 'שחקן! 🔥' },
  { id: 'g9',  type: 'text',   content: 'מגנט! 📸' },
];

export function getStickerPack(eventName = '') {
  if (eventName.includes('חתונה') || eventName.includes('wedding') || eventName.includes('Wedding'))
    return WEDDING;
  if (
    eventName.includes('בר מצווה') ||
    eventName.includes('בת מצווה') ||
    eventName.includes('ברית') ||
    eventName.includes('Bar Mitzvah')
  )
    return BAR_MITZVAH;
  if (eventName.includes('יום הולדת') || eventName.includes('birthday') || eventName.includes('Birthday'))
    return BIRTHDAY;
  return GENERAL;
}
