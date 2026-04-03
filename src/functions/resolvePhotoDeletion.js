import { supabase } from '@/lib/supabase';

/**
 * resolvePhotoDeletion({ photo_id, action })
 * action: 'approve' | 'deny'
 * - approve: sets deletion_status='approved', is_hidden=true
 * - deny:    sets deletion_status='denied', is_hidden=false
 * Returns { data: Photo }
 */
export async function resolvePhotoDeletion({ photo_id, action }) {
  try {
    const update = action === 'approve'
      ? { deletion_status: 'approved', is_hidden: true }
      : { deletion_status: 'denied', is_hidden: false };

    const { data, error } = await supabase
      .from('photos')
      .update(update)
      .eq('id', photo_id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('resolvePhotoDeletion error:', error);
    throw error;
  }
}
