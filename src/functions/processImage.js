import { supabase } from '@/lib/supabase';

/**
 * processImage({ file_base64, file_name })
 * Calls the Supabase Edge Function 'processImage' to generate
 * thumbnail/medium/original resized versions of the image.
 *
 * Returns { data: { thumbnail_url, medium_url, original_url } }
 * or null if the Edge Function is not deployed — the caller falls back
 * to a direct storage upload.
 */
export async function processImage({ file_base64, file_name }) {
  try {
    const { data, error } = await supabase.functions.invoke('processImage', {
      body: { file_base64, file_name },
    });

    if (error) {
      console.warn('processImage Edge Function not available, falling back to direct upload:', error.message);
      return null;
    }

    return { data };
  } catch (error) {
    console.warn('processImage failed, falling back to direct upload:', error.message);
    return null;
  }
}
