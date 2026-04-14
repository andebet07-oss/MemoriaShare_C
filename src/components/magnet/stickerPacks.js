// Sticker packs for MagnetReview — auto-selected by event name.
// type 'emoji' renders a single emoji character.
// type 'text'  renders bold Hebrew/Latin text with outline stroke.

const WEDDING = [
  { id: 'w1',  type: 'emoji', content: '💍' },
  { id: 'w2',  type: 'emoji', content: '🥂' },
  { id: 'w3',  type: 'emoji', content: '💐' },
  { id: 'w4',  type: 'emoji', content: '❤️' },
  { id: 'w5',  type: 'emoji', content: '💕' },
  { id: 'w6',  type: 'emoji', content: '✨' },
  { id: 'w7',  type: 'emoji', content: '🎊' },
  { id: 'w8',  type: 'emoji', content: '💒' },
  { id: 'w9',  type: 'emoji', content: '🔥' },
  { id: 'w10', type: 'emoji', content: '💋' },
  { id: 'w11', type: 'text',  content: 'מזל טוב!' },
  { id: 'w12', type: 'text',  content: 'WOW!' },
  { id: 'w13', type: 'text',  content: 'אהבה ❤️' },
  { id: 'w14', type: 'text',  content: 'יאללה שמחים!' },
  { id: 'w15', type: 'emoji', content: '🌸' },
  { id: 'w16', type: 'emoji', content: '🎶' },
];

const BAR_MITZVAH = [
  { id: 'b1',  type: 'emoji', content: '✡️' },
  { id: 'b2',  type: 'emoji', content: '🎉' },
  { id: 'b3',  type: 'emoji', content: '🎈' },
  { id: 'b4',  type: 'emoji', content: '🥳' },
  { id: 'b5',  type: 'emoji', content: '🎁' },
  { id: 'b6',  type: 'emoji', content: '📖' },
  { id: 'b7',  type: 'emoji', content: '✨' },
  { id: 'b8',  type: 'emoji', content: '🔥' },
  { id: 'b9',  type: 'text',  content: 'מזל טוב!' },
  { id: 'b10', type: 'text',  content: 'WOW!' },
  { id: 'b11', type: 'text',  content: 'כוכב! ✨' },
  { id: 'b12', type: 'emoji', content: '💫' },
];

const BIRTHDAY = [
  { id: 'bd1',  type: 'emoji', content: '🎂' },
  { id: 'bd2',  type: 'emoji', content: '🎈' },
  { id: 'bd3',  type: 'emoji', content: '🎉' },
  { id: 'bd4',  type: 'emoji', content: '🥳' },
  { id: 'bd5',  type: 'emoji', content: '🎁' },
  { id: 'bd6',  type: 'emoji', content: '✨' },
  { id: 'bd7',  type: 'emoji', content: '🔥' },
  { id: 'bd8',  type: 'emoji', content: '💫' },
  { id: 'bd9',  type: 'text',  content: 'יום הולדת שמח!' },
  { id: 'bd10', type: 'text',  content: 'WOW! 🎉' },
];

const GENERAL = [
  { id: 'g1',  type: 'emoji', content: '🎉' },
  { id: 'g2',  type: 'emoji', content: '✨' },
  { id: 'g3',  type: 'emoji', content: '🥂' },
  { id: 'g4',  type: 'emoji', content: '❤️' },
  { id: 'g5',  type: 'emoji', content: '📸' },
  { id: 'g6',  type: 'emoji', content: '🔥' },
  { id: 'g7',  type: 'emoji', content: '💫' },
  { id: 'g8',  type: 'emoji', content: '🥳' },
  { id: 'g9',  type: 'text',  content: 'WOW! 🎊' },
  { id: 'g10', type: 'text',  content: 'מזל טוב!' },
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
