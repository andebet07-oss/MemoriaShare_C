import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

// ─── cn() ─────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple class names', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('omits falsy values (false, null, undefined, 0, empty string)', () => {
    expect(cn('foo', false, null, undefined, 0, '', 'bar')).toBe('foo bar');
  });

  it('resolves conflicting Tailwind utility classes (last wins)', () => {
    // tailwind-merge deduplicates: the later padding utility wins
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('resolves conflicting text-color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional object syntax (clsx feature)', () => {
    expect(cn({ 'text-sm': true, 'text-lg': false })).toBe('text-sm');
  });

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles nested arrays', () => {
    expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns an empty string when all values are falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('merges conflicting background-color utilities correctly', () => {
    expect(cn('bg-red-400', 'bg-blue-400')).toBe('bg-blue-400');
  });

  it('preserves non-conflicting Tailwind utilities together', () => {
    const result = cn('flex', 'items-center', 'justify-between');
    expect(result).toBe('flex items-center justify-between');
  });
});
