import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { RUBRIC_CRITERIA, evaluateRubric } from '@/lib/framesRubric';

const SCORE_LABELS = ['0 — חסר', '1 — חלש', '2 — סביר', '3 — טוב', '4 — מצוין', '5 — מושלם'];

/**
 * RubricEditor — inline 7-criterion scorer.
 * Props:
 *   initialScores: { [criterionKey]: 0-5 }
 *   onSave(scores, total, canApprove): called when admin confirms
 *   onCancel()
 *   saving: boolean
 */
export default function RubricEditor({ initialScores = {}, onSave, onCancel, saving }) {
  const [scores, setScores] = useState(() => {
    const s = {};
    RUBRIC_CRITERIA.forEach(c => { s[c.key] = initialScores[c.key] ?? 0; });
    return s;
  });

  const set = useCallback((key, val) => setScores(prev => ({ ...prev, [key]: val })), []);

  const { total, hardFailCriteria, canApprove, reason } = evaluateRubric(scores);

  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/60">רובריקת איכות (7 × 5 = 35)</p>

      {RUBRIC_CRITERIA.map(c => {
        const score = scores[c.key];
        const isHardFailTriggered = c.hardFail && score === 0;
        return (
          <div key={c.key} className={`space-y-1.5 rounded-lg px-3 py-2.5 border transition-colors ${
            isHardFailTriggered ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-cool-900/30'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {c.hardFail && (
                  <span className="shrink-0 text-[8px] font-black tracking-widest uppercase text-amber-400/70 border border-amber-500/30 rounded px-1 py-0.5">
                    חובה
                  </span>
                )}
                <span className="text-xs font-semibold text-foreground/90 truncate">{c.label}</span>
              </div>
              <span className={`text-xs font-bold tabular-nums shrink-0 ${
                isHardFailTriggered ? 'text-red-400' : score >= 4 ? 'text-emerald-400' : score >= 2 ? 'text-foreground/70' : 'text-amber-400'
              }`}>
                {score}/5
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/50">{c.description}</p>

            {/* Score buttons 0-5 */}
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  title={SCORE_LABELS[v]}
                  onClick={() => set(c.key, v)}
                  className={[
                    'flex-1 h-7 rounded text-[11px] font-bold transition-all focus-visible:outline-none',
                    'focus-visible:ring-1 focus-visible:ring-violet-500',
                    v === score
                      ? isHardFailTriggered
                        ? 'bg-red-500 text-white'
                        : v >= 4 ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'
                      : 'bg-cool-800/60 text-muted-foreground/50 hover:bg-cool-700',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary bar */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
        canApprove
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className="flex items-center gap-2">
          {canApprove
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          }
          <div>
            <p className={`text-xs font-bold ${canApprove ? 'text-emerald-400' : 'text-red-400'}`}>
              {canApprove ? 'עובר — מוכן לאישור' : 'נכשל — לא ניתן לאישור'}
            </p>
            {!canApprove && reason && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{reason}</p>
            )}
          </div>
        </div>
        <span className={`text-2xl font-black tabular-nums ${canApprove ? 'text-emerald-400' : 'text-red-400/70'}`}>
          {total}<span className="text-sm font-normal text-muted-foreground/40">/35</span>
        </span>
      </div>

      {hardFailCriteria.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-400/80">
            קריטריוני כישלון חובה שנכשלו: {hardFailCriteria.join(', ')}. חובה לציין ≥1 בכל קריטריון חובה לפני אישור.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(scores, total, canApprove)}
          disabled={saving}
          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
        >
          {saving ? 'שומר...' : 'שמור ניקוד'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 bg-cool-800 hover:bg-cool-700 text-muted-foreground text-xs font-bold rounded-lg transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
