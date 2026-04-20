import { useQuery, useQueryClient } from '@tanstack/react-query';
import memoriaService from '@/components/memoriaService';
import { FRAMES_META as LOCAL_FALLBACK } from '@/lib/framesMeta';

const QUERY_KEY = ['frames-meta'];

/**
 * Returns DB-authoritative frame metadata.
 * Falls back to the local framesMeta.js seed if the DB call fails.
 *
 * meta: { [frameId]: { status, quality_score, style, palette, sort_weight, output_width_mm, notes } }
 */
export function useFramesMeta() {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: memoriaService.frameMeta.list,
    staleTime: 60_000,
    retry: 1,
  });

  const meta = buildMetaMap(data);
  return { meta, isLoading, error };
}

/**
 * Returns an invalidate function for post-update cache busting.
 */
export function useInvalidateFramesMeta() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY });
}

/** Convert DB row array → frameId-keyed map, with local fallback for missing rows. */
function buildMetaMap(rows) {
  if (!rows) return normalizeLocal(LOCAL_FALLBACK);
  const map = {};
  for (const row of rows) {
    map[row.frame_id] = {
      status:          row.status,
      quality:         row.quality_score,
      style:           row.style,
      palette:         row.palette,
      sortWeight:      row.sort_weight,
      outputWidthMm:   row.output_width_mm,
      notes:           row.notes ?? '',
    };
  }
  // Fill any frames missing from DB with local fallback
  for (const [id, local] of Object.entries(LOCAL_FALLBACK)) {
    if (!map[id]) map[id] = { ...local, sortWeight: 0, outputWidthMm: 100, notes: '' };
  }
  return map;
}

function normalizeLocal(local) {
  const map = {};
  for (const [id, v] of Object.entries(local)) {
    map[id] = { ...v, sortWeight: 0, outputWidthMm: 100, notes: '' };
  }
  return map;
}
