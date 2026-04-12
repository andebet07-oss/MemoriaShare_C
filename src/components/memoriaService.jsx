import { supabase } from '@/lib/supabase';

// Reads the current JWT from the Supabase localStorage session.
// Used by methods that must bypass supabase-js _fetchWithAuth to avoid
// auth mutex contention when signInAnonymously() is still in flight.
function _getJwt() {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  try {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const session = JSON.parse(localStorage.getItem(storageKey));
      if (session?.access_token) return session.access_token;
    }
  } catch { /* non-fatal */ }
  return supabaseAnonKey;
}

/**
 * Memoria Service Layer
 * Centralizes all Supabase calls with consistent error logging
 * and data normalization.
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

    listByUser: async (userId, sort = '-created_date') => {
      try {
        const ascending = !sort.startsWith('-');
        const column = sort.replace(/^-/, '');
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('created_by', userId)                               // UUID — was email
          .order(column, { ascending });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [events.listByUser]: Failed to list events for user', userId, error);
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

    create: async (rawData) => {
      try {
        // Strip UI-only fields that don't exist as table columns, and map
        // privacy_mode → auto_publish_guest_photos (immediate = true, manual = false).
        const {
          privacy_mode,
          event_type,   // pass through only valid DB values
          description,  // form-only
          price,        // form-only (pricing display)
          qr_code,      // form-only
          photo_filter, // form-only
          ...rest
        } = rawData;

        const eventData = {
          ...rest,
          // Allow 'share'/'magnet'; ignore legacy UI values like 'wedding'
          ...(event_type === 'share' || event_type === 'magnet' ? { event_type } : {}),
          auto_publish_guest_photos:
            rest.auto_publish_guest_photos ??
            (privacy_mode === 'immediate' ? true : false),
        };

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
      // WHY native fetch: supabase.from().insert() calls _fetchWithAuth which
      // checks session expiry and may call refreshSession() — re-entering the
      // auth mutex that signInAnonymously() holds at mount time (same hang as storage).
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const jwt = _getJwt();

      const response = await fetch(`${supabaseUrl}/rest/v1/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(photoData),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('MemoriaService [photos.create]: Failed to create photo record', response.status, errText);
        throw new Error(`DB insert failed (${response.status}): ${errText}`);
      }

      const rows = await response.json();
      return Array.isArray(rows) ? rows[0] : rows;
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

  leads: {
    create: async (leadData) => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert(leadData)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [leads.create]: Failed to create lead', error);
        throw error;
      }
    },

    list: async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [leads.list]: Failed to list leads', error);
        throw error;
      }
    },

    update: async (id, updates) => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [leads.update]: Failed to update lead', id, error);
        throw error;
      }
    },
  },

  printJobs: {
    create: async ({ event_id, photo_id, guest_user_id }) => {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .insert({ event_id, photo_id, guest_user_id })
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [printJobs.create]: Failed to create print job', error);
        throw error;
      }
    },

    getByUser: async (eventId, userId) => {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .select('*, photos(file_url, file_urls, guest_name)')
          .eq('event_id', eventId)
          .eq('guest_user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('MemoriaService [printJobs.getByUser]: Failed to fetch print jobs', error);
        throw error;
      }
    },

    updateStatus: async (id, status) => {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('MemoriaService [printJobs.updateStatus]: Failed to update status', id, error);
        throw error;
      }
    },

    getByEvent: async (eventId) => {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .select('*, photos(file_url, file_urls, guest_name)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('MemoriaService [printJobs.getByEvent]: Failed to fetch event print jobs', error);
        throw error;
      }
    },
  },

  storage: {
    /**
     * Upload a file to the Supabase 'photos' storage bucket.
     * Returns an object with the public URL of the uploaded file.
     * Path: {eventId}/{timestamp}_{filename}
     *
     * WHY native fetch instead of supabase.storage.upload():
     * In @supabase/supabase-js v2.x, storage.upload() calls _fetchWithAuth which
     * checks whether the session token needs refreshing before every request.
     * If the anonymous session is near expiry, refreshSession() is invoked — this
     * re-enters the same auth mutex that signInAnonymously() holds at mount time,
     * causing a silent indefinite hang. Using native fetch with the JWT read
     * directly from localStorage bypasses this entirely.
     */
    upload: async (file, eventId = 'general') => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const ext = (file.name || 'photo').split('.').pop() || 'jpg';
      const path = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const jwt = _getJwt();

      const uploadUrl = `${supabaseUrl}/storage/v1/object/photos/${path}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apikey': supabaseAnonKey,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'false',
        },
        body: file,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Storage upload failed (${response.status}): ${errText}`);
      }

      // Public URL is deterministic for public buckets — no extra network call needed
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${path}`;

      return { file_url: publicUrl, path };
    },

    /**
     * Upload an overlay frame PNG for a Magnet event.
     * Path: overlays/{eventId}/frame.png (upsert — replaces if re-uploaded)
     */
    uploadOverlay: async (file, eventId) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const path = `overlays/${eventId}/frame.png`;
      const jwt = _getJwt();

      const response = await fetch(`${supabaseUrl}/storage/v1/object/photos/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apikey': supabaseAnonKey,
          'Content-Type': file.type || 'image/png',
          'x-upsert': 'true',
        },
        body: file,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Overlay upload failed (${response.status}): ${errText}`);
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${path}`;
      return { file_url: publicUrl, path };
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
