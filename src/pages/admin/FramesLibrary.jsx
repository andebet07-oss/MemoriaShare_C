import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import FramePngPreview from '@/components/admin/frames/FramePngPreview';
import { STYLE_LABELS, CATEGORY_LABELS } from '@/lib/framesMeta';

function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    draft:    'bg-cool-700/40 text-cool-400 border border-cool-600/30',
    archived: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const labels = { approved: 'פעיל', draft: 'טיוטה', archived: 'ארכיון' };
  return (
    <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}

function FrameCard({ frame }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      <div className="bg-cool-900/60 flex items-center justify-center p-3" style={{ minHeight: 200 }}>
        <FramePngPreview
          frame={{ image_url: frame.image_url, hole_bbox: frame.hole_bbox }}
          className="rounded-lg max-h-52 w-auto"
        />
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-muted-foreground truncate">{frame.frame_id}</span>
          <StatusBadge status={frame.status} />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground/60">
          {frame.category && <span>{CATEGORY_LABELS[frame.category] ?? frame.category}</span>}
          {frame.style    && <span>· {STYLE_LABELS[frame.style] ?? frame.style}</span>}
          {frame.aspect   && <span>· {frame.aspect}</span>}
        </div>
      </div>
    </div>
  );
}

export default function FramesLibrary() {
  const { data: frames = [], isLoading, error } = useQuery({
    queryKey: ['frames-library'],
    queryFn: memoriaService.frameMeta.listPngFrames,
    staleTime: 30_000,
  });

  const activeCount = frames.filter(f => f.status === 'approved').length;

  return (
    <div className="min-h-full p-6 md:p-8" dir="rtl">
      <div className="mb-7">
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5">Admin · 01</p>
        <h1 className="font-playfair text-3xl text-foreground leading-tight">ספריית מסגרות</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? 'טוען...' : activeCount > 0 ? `${activeCount} מסגרות פעילות` : 'אין מסגרות פעילות'}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          שגיאה בטעינת המסגרות
        </div>
      )}

      {!isLoading && !error && frames.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cool-800/60 border border-border flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">ספריית המסגרות ריקה</p>
          <p className="text-xs text-muted-foreground/40">מסגרות חדשות יתווספו כאן</p>
        </div>
      )}

      {!isLoading && frames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {frames.map(frame => <FrameCard key={frame.frame_id} frame={frame} />)}
        </div>
      )}
    </div>
  );
}
