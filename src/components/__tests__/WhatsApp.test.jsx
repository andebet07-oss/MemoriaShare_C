import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUrl } = vi.hoisted(() => ({ mockUrl: vi.fn() }));
vi.mock('@/lib/contact', () => ({ whatsappUrl: mockUrl }));

import { WhatsAppButton, WhatsAppFab } from '@/components/home/WhatsApp';

const LABEL = 'דברו איתנו בוואטסאפ';

describe('WhatsApp buttons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('link to wa.me in a new tab when a number is set', () => {
    mockUrl.mockReturnValue('https://wa.me/972557209335?text=hi');
    render(<><WhatsAppButton /><WhatsAppFab hidden={false} /></>);
    const links = screen.getAllByRole('link', { name: LABEL });
    expect(links).toHaveLength(2);
    links.forEach((a) => {
      expect(a.getAttribute('href')).toBe('https://wa.me/972557209335?text=hi');
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    });
  });

  it('render nothing when the number is empty', () => {
    mockUrl.mockReturnValue(null);
    const { container } = render(<><WhatsAppButton /><WhatsAppFab hidden={false} /></>);
    expect(container.innerHTML).toBe('');
  });

  it('take the hidden floating button out of reach', () => {
    mockUrl.mockReturnValue('https://wa.me/972557209335?text=hi');
    render(<WhatsAppFab hidden />);
    expect(screen.queryByRole('link', { name: LABEL })).toBeNull();
    const fab = document.querySelector('a[href^="https://wa.me"]');
    expect(fab.hasAttribute('inert')).toBe(true);
  });
});
