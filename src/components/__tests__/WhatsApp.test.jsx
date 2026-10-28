import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUrl } = vi.hoisted(() => ({ mockUrl: vi.fn() }));
vi.mock('@/lib/contact', () => ({ whatsappUrl: mockUrl }));

import { WhatsAppButton, MobileActionBar } from '@/components/home/WhatsApp';

const LABEL = 'דברו איתנו בוואטסאפ';
const URL = 'https://wa.me/972557209335?text=hi';

describe('WhatsApp buttons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('link to wa.me in a new tab when a number is set', () => {
    mockUrl.mockReturnValue(URL);
    render(<><WhatsAppButton /><MobileActionBar hidden={false} onBook={() => {}} /></>);
    const links = screen.getAllByRole('link', { name: LABEL });
    expect(links).toHaveLength(2);
    links.forEach((a) => {
      expect(a.getAttribute('href')).toBe(URL);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    });
  });

  it('disappear when the number is empty; the bar keeps the booking button', () => {
    mockUrl.mockReturnValue(null);
    const onBook = vi.fn();
    render(<><WhatsAppButton /><MobileActionBar hidden={false} onBook={onBook} /></>);
    expect(screen.queryByRole('link', { name: LABEL })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'שריינו תאריך' }));
    expect(onBook).toHaveBeenCalledOnce();
  });

  it('take the hidden bar out of reach', () => {
    mockUrl.mockReturnValue(URL);
    render(<MobileActionBar hidden onBook={() => {}} />);
    expect(screen.queryByRole('button', { name: 'שריינו תאריך' })).toBeNull();
    expect(document.querySelector('[inert]')).not.toBeNull();
  });
});
