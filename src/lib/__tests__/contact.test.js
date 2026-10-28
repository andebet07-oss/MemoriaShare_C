import { describe, it, expect } from 'vitest';
import { WHATSAPP_NUMBER, whatsappUrl } from '../contact';

describe('whatsappUrl', () => {
  it('builds a wa.me link with the encoded greeting', () => {
    const url = new URL(whatsappUrl());
    expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(url.searchParams.get('text')).toMatch(/[א-ת]/);
  });

  it('keeps only digits', () => {
    expect(whatsappUrl('+972-55-720 9335', 'hi')).toBe('https://wa.me/972557209335?text=hi');
  });

  it('returns null when no number is set', () => {
    expect(whatsappUrl('')).toBeNull();
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl('  ')).toBeNull();
  });
});
