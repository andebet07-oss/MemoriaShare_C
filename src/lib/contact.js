/**
 * contact.js — how visitors reach us. The WhatsApp number lives here only:
 * set it to '' and every WhatsApp button on the site disappears.
 */
export const WHATSAPP_NUMBER = '972557209335'; // international format, no "+"

const WHATSAPP_GREETING = 'היי, הגעתי מהאתר ואשמח לשמוע על מגנטים לאירוע שלנו';

/** The wa.me link with our greeting, or null when no number is set. */
export function whatsappUrl(number = WHATSAPP_NUMBER, text = WHATSAPP_GREETING) {
  const digits = String(number ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
