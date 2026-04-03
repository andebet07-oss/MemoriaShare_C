import { describe, it, expect } from 'vitest';
import {
  getThumbnailUrl,
  getMediumUrl,
  getOriginalUrl,
  hasMultipleVersions,
} from '../photoUtils';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const newPhoto = {
  file_urls: {
    thumbnail: 'https://cdn.example.com/photos/thumb.jpg',
    medium: 'https://cdn.example.com/photos/medium.jpg',
    original: 'https://cdn.example.com/photos/original.jpg',
  },
  file_url: 'https://cdn.example.com/photos/legacy.jpg',
};

const legacyPhoto = {
  file_url: 'https://cdn.example.com/photos/legacy.jpg',
};

const partialFileUrls = {
  file_urls: {
    thumbnail: 'https://cdn.example.com/photos/thumb.jpg',
    // medium and original are missing
  },
  file_url: 'https://cdn.example.com/photos/legacy.jpg',
};

// ─── getThumbnailUrl ──────────────────────────────────────────────────────────

describe('getThumbnailUrl', () => {
  it('returns the thumbnail URL for a new photo with file_urls', () => {
    expect(getThumbnailUrl(newPhoto)).toBe('https://cdn.example.com/photos/thumb.jpg');
  });

  it('falls back to file_url for a legacy photo without file_urls', () => {
    expect(getThumbnailUrl(legacyPhoto)).toBe('https://cdn.example.com/photos/legacy.jpg');
  });

  it('falls back to file_url when file_urls exists but thumbnail is absent', () => {
    const photo = { file_urls: { medium: 'https://cdn.example.com/m.jpg' }, file_url: 'https://cdn.example.com/legacy.jpg' };
    expect(getThumbnailUrl(photo)).toBe('https://cdn.example.com/legacy.jpg');
  });

  it('returns an empty string when the photo is null', () => {
    expect(getThumbnailUrl(null)).toBe('');
  });

  it('returns an empty string when the photo is undefined', () => {
    expect(getThumbnailUrl(undefined)).toBe('');
  });

  it('returns an empty string when both file_urls and file_url are absent', () => {
    expect(getThumbnailUrl({})).toBe('');
  });
});

// ─── getMediumUrl ─────────────────────────────────────────────────────────────

describe('getMediumUrl', () => {
  it('returns the medium URL for a new photo with file_urls', () => {
    expect(getMediumUrl(newPhoto)).toBe('https://cdn.example.com/photos/medium.jpg');
  });

  it('falls back to file_url for a legacy photo', () => {
    expect(getMediumUrl(legacyPhoto)).toBe('https://cdn.example.com/photos/legacy.jpg');
  });

  it('falls back to file_url when file_urls.medium is missing', () => {
    const photo = { file_urls: { thumbnail: 'https://cdn.example.com/t.jpg' }, file_url: 'https://cdn.example.com/legacy.jpg' };
    expect(getMediumUrl(photo)).toBe('https://cdn.example.com/legacy.jpg');
  });

  it('returns an empty string when the photo is null', () => {
    expect(getMediumUrl(null)).toBe('');
  });

  it('returns an empty string when the photo is undefined', () => {
    expect(getMediumUrl(undefined)).toBe('');
  });

  it('returns an empty string when both url fields are absent', () => {
    expect(getMediumUrl({})).toBe('');
  });
});

// ─── getOriginalUrl ───────────────────────────────────────────────────────────

describe('getOriginalUrl', () => {
  it('returns the original URL for a new photo with file_urls', () => {
    expect(getOriginalUrl(newPhoto)).toBe('https://cdn.example.com/photos/original.jpg');
  });

  it('falls back to file_url for a legacy photo', () => {
    expect(getOriginalUrl(legacyPhoto)).toBe('https://cdn.example.com/photos/legacy.jpg');
  });

  it('falls back to file_url when file_urls.original is missing', () => {
    const photo = { file_urls: { thumbnail: 'https://cdn.example.com/t.jpg' }, file_url: 'https://cdn.example.com/legacy.jpg' };
    expect(getOriginalUrl(photo)).toBe('https://cdn.example.com/legacy.jpg');
  });

  it('returns an empty string when the photo is null', () => {
    expect(getOriginalUrl(null)).toBe('');
  });

  it('returns an empty string when the photo is undefined', () => {
    expect(getOriginalUrl(undefined)).toBe('');
  });

  it('returns an empty string when both url fields are absent', () => {
    expect(getOriginalUrl({})).toBe('');
  });
});

// ─── hasMultipleVersions ─────────────────────────────────────────────────────

describe('hasMultipleVersions', () => {
  it('returns true when all three file_urls are present', () => {
    expect(hasMultipleVersions(newPhoto)).toBe(true);
  });

  it('returns false for a legacy photo without file_urls', () => {
    expect(hasMultipleVersions(legacyPhoto)).toBe(false);
  });

  it('returns false when only thumbnail is present in file_urls', () => {
    expect(hasMultipleVersions(partialFileUrls)).toBe(false);
  });

  it('returns false when file_urls exists but medium is missing', () => {
    const photo = { file_urls: { thumbnail: 'https://cdn.example.com/t.jpg', original: 'https://cdn.example.com/o.jpg' } };
    expect(hasMultipleVersions(photo)).toBe(false);
  });

  it('returns false when file_urls exists but original is missing', () => {
    const photo = { file_urls: { thumbnail: 'https://cdn.example.com/t.jpg', medium: 'https://cdn.example.com/m.jpg' } };
    expect(hasMultipleVersions(photo)).toBe(false);
  });

  it('returns false when the photo is null', () => {
    expect(hasMultipleVersions(null)).toBe(false);
  });

  it('returns false when the photo is undefined', () => {
    expect(hasMultipleVersions(undefined)).toBe(false);
  });

  it('returns false for an empty photo object', () => {
    expect(hasMultipleVersions({})).toBe(false);
  });
});
