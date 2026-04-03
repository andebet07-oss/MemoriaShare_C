import { base44 } from '@/api/base44Client';

/**
 * Memoria Service Layer
 * Centralizes all Base44 SDK calls into a single module with
 * consistent error logging and data normalization.
 */
const memoriaService = {

  auth: {
    me: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        console.error('MemoriaService [auth.me]: Failed to get current user', error);
        return null;
      }
    },
    redirectToLogin: (returnUrl) => {
      base44.auth.redirectToLogin(returnUrl);
    },
    logout: (returnUrl) => {
      base44.auth.logout(returnUrl);
    },
  },

  events: {
    list: async (sort = '-created_date') => {
      try {
        return await base44.entities.Event.list(sort);
      } catch (error) {
        console.error('MemoriaService [events.list]: Failed to list events', error);
        throw error;
      }
    },

    listByUser: async (email, sort = '-created_date') => {
      try {
        return await base44.entities.Event.filter({ created_by: email }, sort);
      } catch (error) {
        console.error('MemoriaService [events.listByUser]: Failed to list events for user', email, error);
        throw error;
      }
    },

    get: async (id) => {
      try {
        const results = await base44.entities.Event.filter({ id });
        return results.length > 0 ? results[0] : null;
      } catch (error) {
        console.error('MemoriaService [events.get]: Failed to get event by id', id, error);
        throw error;
      }
    },

    getByCode: async (code) => {
      try {
        const results = await base44.entities.Event.filter({ unique_code: code });
        return results.length > 0 ? results[0] : null;
      } catch (error) {
        console.error('MemoriaService [events.getByCode]: Failed to fetch event by code', code, error);
        throw error;
      }
    },

    create: async (data) => {
      try {
        return await base44.entities.Event.create(data);
      } catch (error) {
        console.error('MemoriaService [events.create]: Failed to create event', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        return await base44.entities.Event.update(id, data);
      } catch (error) {
        console.error('MemoriaService [events.update]: Failed to update event', id, error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        return await base44.entities.Event.delete(id);
      } catch (error) {
        console.error('MemoriaService [events.delete]: Failed to delete event', id, error);
        throw error;
      }
    },
  },

  photos: {
    getByEvent: async (eventId, extraFilter = {}, sort = '-created_date', limitOrOptions = null) => {
      try {
        const filter = { event_id: eventId, ...extraFilter };
        if (limitOrOptions !== null) {
          return await base44.entities.Photo.filter(filter, sort, limitOrOptions);
        }
        return await base44.entities.Photo.filter(filter, sort);
      } catch (error) {
        console.error('MemoriaService [photos.getByEvent]: Failed to fetch photos for event', eventId, error);
        throw error;
      }
    },

    create: async (data) => {
      try {
        return await base44.entities.Photo.create(data);
      } catch (error) {
        console.error('MemoriaService [photos.create]: Failed to create photo record', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        return await base44.entities.Photo.delete(id);
      } catch (error) {
        console.error('MemoriaService [photos.delete]: Failed to delete photo', id, error);
        throw error;
      }
    },

    approve: async (id) => {
      try {
        return await base44.entities.Photo.update(id, { is_approved: true });
      } catch (error) {
        console.error('MemoriaService [photos.approve]: Failed to approve photo', id, error);
        throw error;
      }
    },
  },

  storage: {
    upload: async (file) => {
      try {
        return await base44.integrations.Core.UploadFile({ file });
      } catch (error) {
        console.error('MemoriaService [storage.upload]: Failed to upload file', error);
        throw error;
      }
    },

    getSignedUrl: async (uri) => {
      try {
        return await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      } catch (error) {
        console.error('MemoriaService [storage.getSignedUrl]: Failed to get signed URL for', uri, error);
        throw error;
      }
    },
  },

};

export default memoriaService;