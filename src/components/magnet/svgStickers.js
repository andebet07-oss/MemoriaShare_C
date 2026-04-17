// svgStickers.js — Y2K / Pinterest-aesthetic sticker icons.
// Each value is an <svg> string rendered at 64x64 viewBox.
// Stickers use a white outer stroke (paint-order="stroke") to mimic a die-cut look.

export const SVG_STICKERS = {
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 58C10 42 4 28 4 18a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 10-6 24-28 40z" fill="#ec4899" stroke="#fff" stroke-width="3" paint-order="stroke"/><ellipse cx="20" cy="18" rx="5" ry="3.5" fill="rgba(255,255,255,0.55)"/></svg>`,

  heartRed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 58C10 42 4 28 4 18a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 10-6 24-28 40z" fill="#dc2626" stroke="#fff" stroke-width="3" paint-order="stroke"/></svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4l8 20h22l-18 14 7 22-19-14-19 14 7-22L2 24h22z" fill="#111" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/></svg>`,

  starGold: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4l8 20h22l-18 14 7 22-19-14-19 14 7-22L2 24h22z" fill="#facc15" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/></svg>`,

  disco: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#d4d4d8" stroke="#fff" stroke-width="3" paint-order="stroke"/><path d="M6 32h52M32 6v52M14 14l36 36M50 14L14 50" stroke="#71717a" stroke-width="1.2"/><path d="M22 10C28 22 28 42 22 54M42 10C36 22 36 42 42 54" stroke="#71717a" stroke-width="1.2" fill="none"/><ellipse cx="22" cy="22" rx="5" ry="4" fill="#fafafa" opacity="0.85"/></svg>`,

  evilEye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2563eb" stroke="#fff" stroke-width="3" paint-order="stroke"/><circle cx="32" cy="32" r="19" fill="#fff"/><circle cx="32" cy="32" r="12" fill="#1e3a8a"/><circle cx="32" cy="32" r="5" fill="#000"/><circle cx="30" cy="30" r="1.5" fill="#fff"/></svg>`,

  lips: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M4 30c0-8 8-11 14-9 5 2 8 7 14 7s9-5 14-7c6-2 14 1 14 9-2 7-10 15-20 15-4 0-6-2-8-4-2 2-4 4-8 4C14 45 6 37 4 30z" fill="#dc2626" stroke="#fff" stroke-width="3" paint-order="stroke"/><path d="M10 30c4-2 8-1 12 1 4-2 8-2 12 0 4-2 8-3 12-1" stroke="#7f1d1d" stroke-width="1.3" fill="none"/><ellipse cx="22" cy="24" rx="3" ry="1.5" fill="rgba(255,255,255,0.6)"/></svg>`,

  camera: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="16" width="56" height="38" rx="5" fill="#fafafa" stroke="#fff" stroke-width="3" paint-order="stroke"/><rect x="20" y="10" width="24" height="8" fill="#a1a1aa"/><circle cx="32" cy="36" r="13" fill="#18181b"/><circle cx="32" cy="36" r="9" fill="#3f3f46"/><circle cx="29" cy="33" r="2.5" fill="#f4f4f5"/><rect x="48" y="20" width="8" height="5" rx="1" fill="#ec4899"/></svg>`,

  eiffel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 3L29 12 L24 28 L14 54 L14 60 L50 60 L50 54 L40 28 L35 12 Z M16 58 H48 M20 42 H44 M24 28 H40" fill="#52525b" stroke="#fff" stroke-width="2.5" paint-order="stroke" stroke-linejoin="round"/></svg>`,

  butterfly: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 14 C20 4 6 12 6 24 C6 34 18 38 32 32 C46 38 58 34 58 24 C58 12 44 4 32 14 Z" fill="#c084fc" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><path d="M32 34 C22 30 10 34 10 44 C10 52 20 56 32 46 C44 56 54 52 54 44 C54 34 42 30 32 34 Z" fill="#f472b6" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><rect x="30" y="12" width="4" height="42" rx="2" fill="#18181b"/><circle cx="32" cy="12" r="3" fill="#18181b"/><path d="M30 10 L26 4 M34 10 L38 4" stroke="#18181b" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  cherry: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M22 14 C22 6 32 2 40 8 C44 12 42 18 38 22" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 14 C46 10 52 14 50 20 C48 24 44 24 42 22" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 8 L42 4" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="46" r="14" fill="#dc2626" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><circle cx="46" cy="48" r="13" fill="#dc2626" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><ellipse cx="18" cy="42" rx="3" ry="2" fill="rgba(255,255,255,0.55)"/><ellipse cx="42" cy="43" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.55)"/></svg>`,

  flower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#f9a8d4" stroke="#fff" stroke-width="2.5" paint-order="stroke"><circle cx="32" cy="14" r="11"/><circle cx="14" cy="26" r="11"/><circle cx="20" cy="48" r="11"/><circle cx="44" cy="48" r="11"/><circle cx="50" cy="26" r="11"/></g><circle cx="32" cy="32" r="9" fill="#fbbf24" stroke="#fff" stroke-width="2.5" paint-order="stroke"/></svg>`,

  crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M4 22 L18 36 L26 14 L32 32 L38 14 L46 36 L60 22 L55 54 H9 Z" fill="#facc15" stroke="#fff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"/><circle cx="18" cy="34" r="3" fill="#dc2626"/><circle cx="32" cy="30" r="3" fill="#3b82f6"/><circle cx="46" cy="34" r="3" fill="#dc2626"/><path d="M12 48 H52" stroke="#a16207" stroke-width="1.2"/></svg>`,

  bow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 32 L10 18 C6 22 6 32 10 36 L30 34 Z" fill="#ec4899" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><path d="M32 32 L54 18 C58 22 58 32 54 36 L34 34 Z" fill="#ec4899" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><path d="M32 32 L10 46 C6 42 6 32 10 28 L30 30 Z" fill="#db2777" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><path d="M32 32 L54 46 C58 42 58 32 54 28 L34 30 Z" fill="#db2777" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><rect x="26" y="24" width="12" height="16" rx="2.5" fill="#be185d" stroke="#fff" stroke-width="2.5" paint-order="stroke"/></svg>`,

  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 2 L36 28 L62 32 L36 36 L32 62 L28 36 L2 32 L28 28 Z" fill="#fbbf24" stroke="#fff" stroke-width="2.5" paint-order="stroke" stroke-linejoin="round"/></svg>`,

  sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#f59e0b" stroke-width="5" stroke-linecap="round" fill="none"><path d="M32 2 V10 M32 54 V62 M2 32 H10 M54 32 H62 M10 10 L16 16 M48 48 L54 54 M54 10 L48 16 M10 54 L16 48"/></g><circle cx="32" cy="32" r="18" fill="#fbbf24" stroke="#fff" stroke-width="3" paint-order="stroke"/><circle cx="25" cy="28" r="2.5" fill="#111"/><circle cx="39" cy="28" r="2.5" fill="#111"/><path d="M24 36 Q32 43 40 36" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,

  moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M50 10 A26 26 0 1 0 50 54 A20 20 0 1 1 50 10 Z" fill="#fef08a" stroke="#fff" stroke-width="3" paint-order="stroke"/><circle cx="26" cy="22" r="2" fill="#ca8a04"/><circle cx="20" cy="34" r="2.5" fill="#ca8a04"/><circle cx="28" cy="44" r="1.5" fill="#ca8a04"/></svg>`,

  coffee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M12 18 H52 L48 58 H16 Z" fill="#fff7ed" stroke="#fff" stroke-width="3" paint-order="stroke"/><path d="M12 18 H52" stroke="#78350f" stroke-width="1.2"/><rect x="14" y="22" width="36" height="8" fill="#78350f" opacity="0.18"/><path d="M32 34 C28 38 28 44 32 48 C36 44 36 38 32 34Z" fill="#ec4899" stroke="#fff" stroke-width="1.8" paint-order="stroke"/><path d="M24 8 Q28 14 24 18 M32 6 Q36 12 32 16 M40 8 Q44 14 40 18" stroke="#a8a29e" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,

  strawberry: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 60 C12 54 6 36 14 22 C20 12 28 10 32 16 C36 10 44 12 50 22 C58 36 52 54 32 60 Z" fill="#ef4444" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><path d="M16 18 L20 10 L28 14 L32 6 L36 14 L44 10 L48 18 Z" fill="#16a34a" stroke="#fff" stroke-width="2" paint-order="stroke" stroke-linejoin="round"/><g fill="#fde047"><circle cx="24" cy="34" r="1.5"/><circle cx="34" cy="32" r="1.5"/><circle cx="42" cy="38" r="1.5"/><circle cx="28" cy="44" r="1.5"/><circle cx="38" cy="48" r="1.5"/><circle cx="22" cy="46" r="1.5"/></g></svg>`,

  cassette: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="16" width="56" height="32" rx="4" fill="#ec4899" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><rect x="10" y="20" width="44" height="10" rx="1" fill="#fff"/><path d="M14 25 H50" stroke="#be185d" stroke-width="0.8"/><circle cx="20" cy="40" r="5" fill="#fff"/><circle cx="20" cy="40" r="2" fill="#ec4899"/><circle cx="44" cy="40" r="5" fill="#fff"/><circle cx="44" cy="40" r="2" fill="#ec4899"/><path d="M25 40 H39" stroke="#fff" stroke-width="1"/></svg>`,

  rose: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="26" r="16" fill="#be185d" stroke="#fff" stroke-width="2.5" paint-order="stroke"/><circle cx="32" cy="26" r="11" fill="#db2777"/><circle cx="32" cy="26" r="6" fill="#f9a8d4"/><path d="M18 42 L14 58 M46 42 L50 58 M32 42 L32 60" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/><path d="M14 50 Q8 50 8 56 Q14 56 14 50 Z M50 50 Q56 50 56 56 Q50 56 50 50 Z" fill="#16a34a" stroke="#fff" stroke-width="1.8" paint-order="stroke"/></svg>`,

  hebrewChai: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2563eb" stroke="#fff" stroke-width="3" paint-order="stroke"/><text x="32" y="46" text-anchor="middle" font-family="'David Libre','Frank Ruhl Libre',serif" font-size="38" font-weight="700" fill="#fff">חי</text></svg>`,

  starOfDavid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#2563eb" stroke="#fff" stroke-width="2.5" paint-order="stroke" stroke-linejoin="round"><path d="M32 4 L54 42 L10 42 Z"/><path d="M32 60 L10 22 L54 22 Z"/></g></svg>`,

  discoPink: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#f9a8d4" stroke="#fff" stroke-width="3" paint-order="stroke"/><path d="M6 32h52M32 6v52M14 14l36 36M50 14L14 50" stroke="#ec4899" stroke-width="1.2"/><path d="M22 10C28 22 28 42 22 54M42 10C36 22 36 42 42 54" stroke="#ec4899" stroke-width="1.2" fill="none"/><ellipse cx="22" cy="22" rx="5" ry="4" fill="#fff" opacity="0.9"/></svg>`,
};

export const STICKER_KEYS = Object.keys(SVG_STICKERS);
