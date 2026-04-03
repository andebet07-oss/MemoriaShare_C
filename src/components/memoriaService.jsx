import { supabase } from '@/lib/supabase';

/**
 * Memoria Service Layer
 * Centralizes all Supabase calls with consistent error logging
 * and data normalization. Mirrors the original Base44-backed API surface.
 */
const memoriaService = {

  auth: {
    me: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        console.error('MemoriaService [auth.me]: Failed to get current user', error);
        return null;
      }
    },

    redirectToLogin: (returnUrl) => {
      const redirectTo = returnUrl || window.location.href;
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    },

    logout: async (returnUrl) => {
      try {
        await supabase.auth.signOut();
        if (returnUrl) window.location.href = returnUrl;
      } catch (error) {
        console.error('MemoriaService [auth.logout]: Failed to sign out', error);
      }
    },
  },

  events: {
    list: async (sort = '-created_date') => {
      try {
        const ascending = !sort.startsWith('-');
        const column = sort.replace(/^-/, '');
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order(column, { ascending });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.list]: Failed to list events', error);
        throw error;
      }
    },

    listByUser: async (email, sort = '-created_date') => {
      try {
        const ascending = !sort.startsWith('-');
        const column = sort.replace(/^-/, '');
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('created_by', email)
          .order(column, { ascending });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.listByUser]: Failed to list events for user', email, error);
        throw error;
      }
    },

    get: async (id) => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.get]: Failed to get event by id', id, error);
        throw error;
      }
    },

    getByCode: async (code) => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('unique_code', code)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.getByCode]: Failed to fetch event by code', code, error);
        throw error;
      }
    },

    create: async (eventData) => {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.create]: Failed to create event', error);
        throw error;
      }
    },

    update: async (id, eventData) => {
      try {
        const { data, error } = await supabase
          .from('events')
          .update({ ...eventData, updated_date: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.update]: Failed to update event', id, error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('MemoriaService [events.delete]: Failed to delete event', id, error);
        throw error;
      }
    },
  },

  photos: {
    getByEvent: async (eventId, extraFilter = {}, sort = '-created_date', limitOrOptions = null) => {
      try {
        const ascending = !sort.startsWith('-');
        // Support comma-separated stable sort (e.g. '-created_date,id')
        const columns = sort.replace(/^-/, '').split(',');

        let query = supabase
          .from('photos')
          .select('*')
          .eq('event_id', eventId);

        // Apply extra filters
        Object.entries(extraFilter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        // Apply sort
        columns.forEach((col, i) => {
          query = query.order(col.trim(), { ascending: i === 0 ? ascending : true });
        });

        // Apply pagination
        if (limitOrOptions !== null) {
          const { limit, offset } = typeof limitOrOptions === 'object'
            ? limitOrOptions
            : { limit: limitOrOptions, offset: 0 };
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [photos.getByEvent]: Failed to fetch photos for event', eventId, error);
        throw error;
      }
    },

    create: async (photoData) => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .insert(photoData)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [photos.create]: Failed to create photo record', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('MemoriaService [photos.delete]: Failed to delete photo', id, error);
        throw error;
      }
    },

    approve: async (id) => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .update({ is_approved: true, updated_date: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [photos.approve]: Failed to approve photo', id, error);
        throw error;
      }
    },

    update: async (id, photoData) => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .update({ ...photoData, updated_date: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [photos.update]: Failed to update photo', id, error);
        throw error;
      }
    },
  },

  storage: {
    /**
     * Upload a file to the Supabase 'photos' storage bucket.
     * Returns an object with the public URL of the uploaded file.
     * Path: {eventId}/{timestamp}_{filename}
     */
    upload: async (file, eventId = 'general') => {
      try {
        const ext = file.name.split('.').pop();
        const path = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(path, file, { upsert: false });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(data.path);

        return { file_url: publicUrl, path: data.path };
      } catch (error) {
        console.error('MemoriaService [storage.upload]: Failed to upload file', error);
        throw error;
      }
    },

    /**
     * Get a time-limited signed URL for a private storage path.
     * expiresIn is in seconds (default 1 hour).
     */
    getSignedUrl: async (path, expiresIn = 3600) => {
      try {
        const { data, error } = await supabase.storage
          .from('photos')
          .createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data.signedUrl;
      } catch (error) {
        console.error('MemoriaService [storage.getSignedUrl]: Failed to get signed URL for', path, error);
        throw error;
      }
    },
  },

};

export default memoriaService;
