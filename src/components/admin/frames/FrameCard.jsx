import { useRef, useEffect } from 'react';
import { drawOnCanvas } from '@/lib/frameRenderer';
import { STYLE_LABELS, STYLE_ACCENT, CATEGORY_LABELS, FRAMES_META } from '@/lib/framesMeta';
import { LABEL_H_RATIO } from '@/components/magnet/framePacks';

const W = 220;
const H = Math.round(W * (1 + LABEL_H_RATIO));
const SAMPLE = { name: 'מור & יונתן', date: '2026-06-14' };

/**
 * meta prop: DB-sourced row from useFramesMeta() — falls back to local FRAMES_META if absent.
 */
export default function FrameCard({ frame, meta: metaProp, category, isSelected, onClick }) {
  const cvs = useRef(null);
  const meta    = metaProp ?? FRAMES_META[frame.id] ?? {};
  const accent  = STYLE_ACCENT[meta.style] ?? STYLE_ACCENT.minimal_luxury;
  const archived = meta.status === 'archived';

  useEffect(() => {
    document.fonts.ready.then(() => drawOnCanvas(cvs.current, frame, SAMPLE));
  }, [frame]);

  return (
    <button
      type="button"
      onClick={() => onClick(frame)}
      aria-label={`מסגרת ${frame.name} — ${STYLE_LABELS[meta.style] ?? ''}`}
      aria-pressed={isSelected}
      className={[
        'group relative flex flex-col rounded-xl overflow-hidden text-right transition-all duration-200',
        'active:scale-[0.97] focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cool-950',
        isSelected
          ? 'border border-violet-500/70 shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_8px_32px_rgba(0,0,0,0.7)] bg-cool-900'
          : 'border border-border bg-card hover:border-violet-500/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-card-dark',
        archived ? 'opacity-40' : '',
      ].join(' ')}
    >
      {/* Canvas preview — aspect-ratio wrapper */}
      <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <canvas
          ref={cvs}
          width={W}
          height={H}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        {archived && (
          <div className="absolute inset-0 flex items-center justify-center bg-cool-950/50">
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/40 px-2 py-0.5 border border-white/10 rounded">
              ארכיון
            </span>
          </div>
        )}

        {frame.isNew && !archived && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-violet-500 text-white text-[8px] font-black tracking-widest uppercase">
            חדש
          </div>
        )}

        {isSelected && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 shadow-lg flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/5 transition-colors pointer-events-none" />
      </div>

      {/* Metadata strip */}
      <div className="px-3 pt-2.5 pb-3 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[8px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-full ${accent.pill}`}>
            {STYLE_LABELS[meta.style] ?? '—'}
          </span>
          <span className="text-[9px] text-muted-foreground/50 tabular-nums">{meta.quality ?? '—'}/35</span>
        </div>
        <p className="text-[13px] font-semibold text-foreground font-heebo leading-tight truncate">{frame.name}</p>
        <p className="text-[10px] text-muted-foreground/70">{CATEGORY_LABELS[category] ?? category}</p>
      </div>
    </button>
  );
}
