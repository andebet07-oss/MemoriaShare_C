import { describe, it, expect } from 'vitest';
import { fitTitle, splitTitle, titleFont, TITLE_MIN } from '@/hooks/useEventTitle';
import { FONTS } from '@/lib/polaroid/fonts';
import { guestStatus, countJobs, formatGuestDate } from '@/components/magnet/guest/guestStyles';

// A fixed-pitch stand-in for canvas measuring: 0.5px of width per character per 1px of size.
const widthAt1px = (text) => text.length * 0.5;

describe('fitTitle', () => {
  it('keeps short names on one line at the base size', () => {
    expect(fitTitle('נועה & איתי', 350, 48, widthAt1px)).toEqual({ lines: ['נועה & איתי'], size: 48 });
  });

  it('shrinks a longer name on one line, down to the minimum', () => {
    const name = 'אלכסנדרה & יהונתן'; // 17 chars → fits 350px at 41px
    expect(fitTitle(name, 350, 48, widthAt1px)).toEqual({ lines: [name], size: 41 });
  });

  it('wraps onto two lines, "&" with the second name, when one line would go under the minimum', () => {
    const name = 'אלכסנדרה-מרגריטה & יהונתן-אליעזר';
    const { lines, size } = fitTitle(name, 335, 44, widthAt1px);
    expect(lines).toEqual(['אלכסנדרה-מרגריטה', '& יהונתן-אליעזר']);
    expect(size).toBeGreaterThanOrEqual(TITLE_MIN);
  });

  it('never goes below the minimum, even when two lines are still too wide', () => {
    expect(fitTitle('a'.repeat(40) + ' & ' + 'b'.repeat(40), 300, 48, widthAt1px).size).toBe(TITLE_MIN);
  });
});

describe('splitTitle', () => {
  it('splits on "&" first, else at the most even space', () => {
    expect(splitTitle('Sarah & Daniel')).toEqual(['Sarah', '& Daniel']);
    expect(splitTitle('החתונה של משפחת כהן')).toEqual(['החתונה של', 'משפחת כהן']);
    expect(splitTitle('Supercalifragilistic')).toBeNull();
  });
});

describe('titleFont', () => {
  it("uses the template's names font, its Hebrew font for Hebrew names", () => {
    expect(titleFont('A', 'נועה & איתי')).toBe(FONTS.bellefair);
    expect(titleFont('C', 'נועה & איתי')).toBe(FONTS.karantina);
    expect(titleFont('G', 'נועה & איתי')).toBe(FONTS.gveretLevin);
    expect(titleFont('G', 'Sarah & Daniel')).toBe(FONTS.greatVibes);
  });

  it('falls back to the default template for an unknown id', () => {
    expect(titleFont('nope', 'נועה & איתי')).toBe(FONTS.bellefair);
  });
});

describe('guest status helpers', () => {
  it('reads pending and printing as one printing state', () => {
    expect(guestStatus('pending')).toBe('printing');
    expect(guestStatus('printing')).toBe('printing');
    expect(countJobs([{ status: 'pending' }, { status: 'printing' }, { status: 'ready' }, { status: 'rejected' }]))
      .toEqual({ printing: 2, ready: 1, rejected: 1 });
  });

  it('formats the event date in Hebrew, and nothing for a missing date', () => {
    expect(formatGuestDate('2026-12-15')).toBe('15 בדצמבר 2026');
    expect(formatGuestDate(null)).toBe('');
    expect(formatGuestDate('not a date')).toBe('');
  });
});
