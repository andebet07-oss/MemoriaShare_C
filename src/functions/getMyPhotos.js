import { supabase } from '@/lib/supabase';

/**
 * getMyPhotos({ event_id, user_id })
 * Fetches all photos uploaded by the current user for an event.
 * Uses auth.uid() (UUID) — works for both Google OAuth users and anonymous guests.
 * RLS `photos_select_own` policy ensures users only see their own rows.
 * Returns { data: { photos: Photo[] } }
 *
 * WHY user_id param: supabase.auth.getUser() makes a network call that can hang
 * due to Supabase v2 auth mutex contention at mount time. Callers should resolve
 * the user ID from React state (currentUser?.id) and pass it directly.
 * getSession() is used as a fallback — it reads from localStorage, not the network.
 */
export async function getMyPhotos({ event_id, user_id }) {
  try {
    let userId = user_id ?? null;

    if (!userId) {
      // Fallback: read session from localStorage (no network, no mutex contention)
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }

    if (!userId) {
      return { data: { photos: [] } };
    }

    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event_id)
      .eq('created_by', userId)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return { data: { photos: photos || [] } };
  } catch (error) {
    console.error('getMyPhotos error:', error);
    return { data: { photos: [] } };
  }
}
