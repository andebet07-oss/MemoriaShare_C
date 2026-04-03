import { supabase } from '@/lib/supabase';

/**
 * requestPhotoDeletion({ photo_id })
 * Sets deletion_status to 'requested' and is_hidden to true on the given photo.
 * Returns { data: Photo }
 */
export async function requestPhotoDeletion({ photo_id }) {
  try {
    const { data, error } = await supabase
      .from('photos')
      .update({ deletion_status: 'requested', is_hidden: true })
      .eq('id', photo_id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('requestPhotoDeletion error:', error);
    throw error;
  }
}
