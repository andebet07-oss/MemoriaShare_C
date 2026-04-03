import { supabase } from '@/lib/supabase';

/**
 * getMyPhotos({ event_id, device_uuid })
 * Fetches all photos uploaded by the current user (or device) for an event,
 * bypassing the is_approved filter (same as the original Base44 backend function).
 * Returns { data: { photos: Photo[] } }
 */
export async function getMyPhotos({ event_id, device_uuid }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('photos')
      .select('*')
      .eq('event_id', event_id)
      .order('created_date', { ascending: false });

    if (user?.email) {
      query = query.eq('created_by', user.email);
    } else if (device_uuid) {
      query = query.eq('device_uuid', device_uuid);
    } else {
      return { data: { photos: [] } };
    }

    const { data: photos, error } = await query;
    if (error) throw error;

    return { data: { photos: photos || [] } };
  } catch (error) {
    console.error('getMyPhotos error:', error);
    return { data: { photos: [] } };
  }
}
