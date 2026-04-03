import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock the base44 client before importing the service ─────────────────────
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn(),
      redirectToLogin: vi.fn(),
      logout: vi.fn(),
    },
    entities: {
      Event: {
        list: vi.fn(),
        filter: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Photo: {
        filter: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    integrations: {
      Core: {
        UploadFile: vi.fn(),
        CreateFileSignedUrl: vi.fn(),
      },
    },
  },
}));

import memoriaService from '../memoriaService';
import { base44 } from '@/api/base44Client';

// ─── auth ─────────────────────────────────────────────────────────────────────

describe('memoriaService.auth', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('me()', () => {
    it('returns the current user on success', async () => {
      const user = { id: 'u1', email: 'test@example.com' };
      base44.auth.me.mockResolvedValue(user);

      const result = await memoriaService.auth.me();

      expect(base44.auth.me).toHaveBeenCalledOnce();
      expect(result).toEqual(user);
    });

    it('returns null when the SDK call throws', async () => {
      base44.auth.me.mockRejectedValue(new Error('Unauthorized'));

      const result = await memoriaService.auth.me();

      expect(result).toBeNull();
    });
  });

  describe('redirectToLogin()', () => {
    it('delegates to the SDK with the provided returnUrl', () => {
      memoriaService.auth.redirectToLogin('https://app.example.com/home');

      expect(base44.auth.redirectToLogin).toHaveBeenCalledWith('https://app.example.com/home');
    });
  });

  describe('logout()', () => {
    it('delegates to the SDK with the provided returnUrl', () => {
      memoriaService.auth.logout('https://app.example.com');

      expect(base44.auth.logout).toHaveBeenCalledWith('https://app.example.com');
    });
  });
});

// ─── events ───────────────────────────────────────────────────────────────────

describe('memoriaService.events', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list()', () => {
    it('returns events sorted by created_date desc by default', async () => {
      const events = [{ id: 'e1' }, { id: 'e2' }];
      base44.entities.Event.list.mockResolvedValue(events);

      const result = await memoriaService.events.list();

      expect(base44.entities.Event.list).toHaveBeenCalledWith('-created_date');
      expect(result).toEqual(events);
    });

    it('accepts a custom sort order', async () => {
      base44.entities.Event.list.mockResolvedValue([]);

      await memoriaService.events.list('title');

      expect(base44.entities.Event.list).toHaveBeenCalledWith('title');
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.list.mockRejectedValue(new Error('Network error'));

      await expect(memoriaService.events.list()).rejects.toThrow('Network error');
    });
  });

  describe('listByUser()', () => {
    it('filters events by creator email', async () => {
      const events = [{ id: 'e1', created_by: 'owner@example.com' }];
      base44.entities.Event.filter.mockResolvedValue(events);

      const result = await memoriaService.events.listByUser('owner@example.com');

      expect(base44.entities.Event.filter).toHaveBeenCalledWith(
        { created_by: 'owner@example.com' },
        '-created_date'
      );
      expect(result).toEqual(events);
    });

    it('accepts a custom sort order', async () => {
      base44.entities.Event.filter.mockResolvedValue([]);

      await memoriaService.events.listByUser('owner@example.com', 'title');

      expect(base44.entities.Event.filter).toHaveBeenCalledWith(
        { created_by: 'owner@example.com' },
        'title'
      );
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.filter.mockRejectedValue(new Error('Forbidden'));

      await expect(memoriaService.events.listByUser('x@example.com')).rejects.toThrow('Forbidden');
    });
  });

  describe('get()', () => {
    it('returns the first matching event', async () => {
      const event = { id: 'e1', title: 'My Event' };
      base44.entities.Event.filter.mockResolvedValue([event]);

      const result = await memoriaService.events.get('e1');

      expect(base44.entities.Event.filter).toHaveBeenCalledWith({ id: 'e1' });
      expect(result).toEqual(event);
    });

    it('returns null when no events match', async () => {
      base44.entities.Event.filter.mockResolvedValue([]);

      const result = await memoriaService.events.get('nonexistent');

      expect(result).toBeNull();
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.filter.mockRejectedValue(new Error('Server error'));

      await expect(memoriaService.events.get('e1')).rejects.toThrow('Server error');
    });
  });

  describe('getByCode()', () => {
    it('returns the event matching the unique code', async () => {
      const event = { id: 'e1', unique_code: 'ABC123' };
      base44.entities.Event.filter.mockResolvedValue([event]);

      const result = await memoriaService.events.getByCode('ABC123');

      expect(base44.entities.Event.filter).toHaveBeenCalledWith({ unique_code: 'ABC123' });
      expect(result).toEqual(event);
    });

    it('returns null when no event matches the code', async () => {
      base44.entities.Event.filter.mockResolvedValue([]);

      const result = await memoriaService.events.getByCode('UNKNOWN');

      expect(result).toBeNull();
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.filter.mockRejectedValue(new Error('Timeout'));

      await expect(memoriaService.events.getByCode('ABC')).rejects.toThrow('Timeout');
    });
  });

  describe('create()', () => {
    it('creates a new event and returns it', async () => {
      const eventData = { title: 'Wedding', unique_code: 'WED001' };
      const created = { id: 'e-new', ...eventData };
      base44.entities.Event.create.mockResolvedValue(created);

      const result = await memoriaService.events.create(eventData);

      expect(base44.entities.Event.create).toHaveBeenCalledWith(eventData);
      expect(result).toEqual(created);
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.create.mockRejectedValue(new Error('Validation error'));

      await expect(memoriaService.events.create({})).rejects.toThrow('Validation error');
    });
  });

  describe('update()', () => {
    it('updates an event and returns the updated record', async () => {
      const updated = { id: 'e1', title: 'Updated Title' };
      base44.entities.Event.update.mockResolvedValue(updated);

      const result = await memoriaService.events.update('e1', { title: 'Updated Title' });

      expect(base44.entities.Event.update).toHaveBeenCalledWith('e1', { title: 'Updated Title' });
      expect(result).toEqual(updated);
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.update.mockRejectedValue(new Error('Not found'));

      await expect(memoriaService.events.update('bad-id', {})).rejects.toThrow('Not found');
    });
  });

  describe('delete()', () => {
    it('deletes an event and returns the result', async () => {
      base44.entities.Event.delete.mockResolvedValue({ success: true });

      const result = await memoriaService.events.delete('e1');

      expect(base44.entities.Event.delete).toHaveBeenCalledWith('e1');
      expect(result).toEqual({ success: true });
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Event.delete.mockRejectedValue(new Error('Forbidden'));

      await expect(memoriaService.events.delete('e1')).rejects.toThrow('Forbidden');
    });
  });
});

// ─── photos ───────────────────────────────────────────────────────────────────

describe('memoriaService.photos', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getByEvent()', () => {
    it('fetches photos for an event with default filter and sort', async () => {
      const photos = [{ id: 'p1', event_id: 'e1' }];
      base44.entities.Photo.filter.mockResolvedValue(photos);

      const result = await memoriaService.photos.getByEvent('e1');

      expect(base44.entities.Photo.filter).toHaveBeenCalledWith(
        { event_id: 'e1' },
        '-created_date'
      );
      expect(result).toEqual(photos);
    });

    it('merges extra filters with the event_id filter', async () => {
      base44.entities.Photo.filter.mockResolvedValue([]);

      await memoriaService.photos.getByEvent('e1', { is_approved: true, is_hidden: false });

      expect(base44.entities.Photo.filter).toHaveBeenCalledWith(
        { event_id: 'e1', is_approved: true, is_hidden: false },
        '-created_date'
      );
    });

    it('passes pagination options when provided', async () => {
      base44.entities.Photo.filter.mockResolvedValue([]);
      const options = { limit: 30, offset: 30 };

      await memoriaService.photos.getByEvent('e1', {}, '-created_date', options);

      expect(base44.entities.Photo.filter).toHaveBeenCalledWith(
        { event_id: 'e1' },
        '-created_date',
        options
      );
    });

    it('does not pass options when limitOrOptions is null', async () => {
      base44.entities.Photo.filter.mockResolvedValue([]);

      await memoriaService.photos.getByEvent('e1', {}, '-created_date', null);

      // Called without the 3rd argument
      expect(base44.entities.Photo.filter).toHaveBeenCalledWith(
        { event_id: 'e1' },
        '-created_date'
      );
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Photo.filter.mockRejectedValue(new Error('DB error'));

      await expect(memoriaService.photos.getByEvent('e1')).rejects.toThrow('DB error');
    });
  });

  describe('create()', () => {
    it('creates a photo record and returns it', async () => {
      const photoData = { event_id: 'e1', file_url: 'https://cdn.example.com/photo.jpg' };
      const created = { id: 'p-new', ...photoData };
      base44.entities.Photo.create.mockResolvedValue(created);

      const result = await memoriaService.photos.create(photoData);

      expect(base44.entities.Photo.create).toHaveBeenCalledWith(photoData);
      expect(result).toEqual(created);
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Photo.create.mockRejectedValue(new Error('Quota exceeded'));

      await expect(memoriaService.photos.create({})).rejects.toThrow('Quota exceeded');
    });
  });

  describe('delete()', () => {
    it('deletes a photo and returns the result', async () => {
      base44.entities.Photo.delete.mockResolvedValue({ success: true });

      const result = await memoriaService.photos.delete('p1');

      expect(base44.entities.Photo.delete).toHaveBeenCalledWith('p1');
      expect(result).toEqual({ success: true });
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Photo.delete.mockRejectedValue(new Error('Not found'));

      await expect(memoriaService.photos.delete('p-bad')).rejects.toThrow('Not found');
    });
  });

  describe('approve()', () => {
    it('sets is_approved to true on the photo', async () => {
      const approved = { id: 'p1', is_approved: true };
      base44.entities.Photo.update.mockResolvedValue(approved);

      const result = await memoriaService.photos.approve('p1');

      expect(base44.entities.Photo.update).toHaveBeenCalledWith('p1', { is_approved: true });
      expect(result).toEqual(approved);
    });

    it('re-throws errors from the SDK', async () => {
      base44.entities.Photo.update.mockRejectedValue(new Error('Forbidden'));

      await expect(memoriaService.photos.approve('p1')).rejects.toThrow('Forbidden');
    });
  });
});

// ─── storage ──────────────────────────────────────────────────────────────────

describe('memoriaService.storage', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('upload()', () => {
    it('uploads a file and returns the result', async () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const uploadResult = { file_url: 'https://cdn.example.com/photo.jpg' };
      base44.integrations.Core.UploadFile.mockResolvedValue(uploadResult);

      const result = await memoriaService.storage.upload(file);

      expect(base44.integrations.Core.UploadFile).toHaveBeenCalledWith({ file });
      expect(result).toEqual(uploadResult);
    });

    it('re-throws errors from the SDK', async () => {
      base44.integrations.Core.UploadFile.mockRejectedValue(new Error('Upload failed'));

      await expect(memoriaService.storage.upload(new File([], 'f.jpg'))).rejects.toThrow('Upload failed');
    });
  });

  describe('getSignedUrl()', () => {
    it('returns a signed URL for a given file URI', async () => {
      const uri = 'files/abc123.jpg';
      const signedUrlResult = { url: 'https://cdn.example.com/signed?token=xyz' };
      base44.integrations.Core.CreateFileSignedUrl.mockResolvedValue(signedUrlResult);

      const result = await memoriaService.storage.getSignedUrl(uri);

      expect(base44.integrations.Core.CreateFileSignedUrl).toHaveBeenCalledWith({ file_uri: uri });
      expect(result).toEqual(signedUrlResult);
    });

    it('re-throws errors from the SDK', async () => {
      base44.integrations.Core.CreateFileSignedUrl.mockRejectedValue(new Error('Expired'));

      await expect(memoriaService.storage.getSignedUrl('files/xyz.jpg')).rejects.toThrow('Expired');
    });
  });
});
