// The studio's template library on Memoria's Supabase (table studio_templates, bucket studio-files).
import { supabase } from '@/lib/supabase';
import { createCloudRepo } from './storage/cloudRepo';
import { createSupabaseGateway } from './storage/supabaseGateway';

let repo = null;

/** One repo for the whole app: it holds no per-page state. */
export function useStudioRepo() {
  repo ??= createCloudRepo(createSupabaseGateway(supabase));
  return repo;
}

/** Studio pages use the symbols font first, so hearts and rings in names show as they print. */
export const STUDIO_FONT = "font-['Magnet_Symbols',Heebo,sans-serif]";
