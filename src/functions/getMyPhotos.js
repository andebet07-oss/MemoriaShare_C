import { supabase } from '@/lib/supabase';

/**
 * getMyPhotos({ event_id })
 * Fetches all photos uploaded by the current user for an event.
 * Uses auth.uid() (UUID) — works for both Google OAuth users and anonymous guests.
 * RLS `photos_select_own` policy ensures users only see their own rows.
 * Returns { data: { photos: Photo[] } }
 */
export async function getMyPhotos({ event_id }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return { data: { photos: [] } };
    }

    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event_id)
      .eq('created_by', user.id)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return { data: { photos: photos || [] } };
  } catch (error) {
    console.error('getMyPhotos error:', error);
    return { data: { photos: [] } };
  }
}
