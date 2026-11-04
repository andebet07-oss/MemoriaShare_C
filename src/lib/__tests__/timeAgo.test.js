// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { timeAgo } from '../timeAgo';

const NOW = new Date('2026-11-04T20:00:00Z').getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('timeAgo', () => {
  it('is empty without a time', () => {
    expect(timeAgo(null, NOW)).toBe('');
  });

  it('says now under a minute', () => {
    expect(timeAgo(ago(30_000), NOW)).toBe('עכשיו');
  });

  it('counts minutes, then hours', () => {
    expect(timeAgo(ago(5 * MIN), NOW)).toBe('לפני 5 דק׳');
    expect(timeAgo(ago(3 * HOUR), NOW)).toBe('לפני 3 שע׳');
  });

  it('switches to days after 24 hours instead of growing the hour count', () => {
    expect(timeAgo(ago(30 * HOUR), NOW)).toBe('אתמול');
    expect(timeAgo(ago(3 * DAY), NOW)).toBe('לפני 3 ימים');
  });

  it('shows the date for anything a week old or more', () => {
    const iso = ago(154 * DAY);
    expect(timeAgo(iso, NOW)).toBe(new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(iso)));
    expect(timeAgo(iso, NOW)).not.toMatch(/שע׳/);
  });
});
