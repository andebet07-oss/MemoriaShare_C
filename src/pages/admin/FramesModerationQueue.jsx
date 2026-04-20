import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { FRAME_PACKS } from '@/components/magnet/framePacks';
import { CATEGORY_LABELS, STYLE_LABELS } from '@/lib/framesMeta';
import { evaluateRubric, PUBLISH_THRESHOLD } from '@/lib/framesRubric';
import { useFramesMeta, useInvalidateFramesMeta } from '@/hooks/useFramesMeta';
import RubricEditor from '@/components/admin/frames/RubricEditor';
import memoriaService from '@/components/memoriaService';
import { useToast } from '@/components/ui/use-toast';

// Flatten all frames with category
const ALL_ENRICHED = Object.entries(FRAME_PACKS).flatMap(([cat, frames]) =>
  frames.map(f => ({ ...f, category: cat }))
);

const STATUS_LABEL = {
  draft:      { label: 'טיוטה',   color: 'text-muted-foreground/50',    icon: Clock },
  in_review:  { label: 'בסקירה',  color: 'text-amber-400',               icon: AlertTriangle },
  approved:   { label: 'מאושר',   color: 'text-emerald-400',             icon: CheckCircle2 },
  archived:   { label: 'ארכיון',  color: 'text-muted-foreground/30',     icon: XCircle },
};

export default function FramesModerationQueue() {
  const { meta, isLoading } = useFramesMeta();
  const invalidate = useInvalidateFramesMeta();
  const { toast } = useToast();

  const [expanded,  setExpanded]  = useState(null);   // frame_id with open rubric
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('pending'); // 'pending' | 'all'

  // Frames pending review = draft or in_review; or all
  const queue = useMemo(() => {
    return ALL_ENRICHED.filter(f => {
      const m = meta[f.id];
      if (filter === 'pending') return m?.status === 'draft' || m?.status === 'in_review';
      return true;
    });
  }, [meta, filter]);

  const handleSaveRubric = async (frameId, scores, total, canApprove) => {
    setSaving(true);
    try {
      await memoriaService.frameMeta.update(frameId, {
        rubric_scores: scores,
        quality_score: total,
        // Promote in_review → approved if rubric passes; leave draft as-is
        ...(canApprove && meta[frameId]?.status === 'in_review'
          ? { status: 'approved' }
          : {}),
      });
      await invalidate();
      toast({
        description: canApprove
          ? `מסגרת אושרה (${total}/35)`
          : `ניקוד נשמר (${total}/35) — לא עבר סף אישור`,
        duration: 3000,
      });
      setExpanded(null);
    } catch {
      toast({ description: 'שגיאה בשמירה', variant: 'destructive', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (frameId, newStatus) => {
    const m = meta[frameId];
    // Block approval if rubric hard-fail
    if (newStatus === 'approved') {
      const { canApprove } = evaluateRubric(m?.rubric_scores ?? {});
      if (!canApprove) {
        toast({
          description: 'לא ניתן לאשר — הרובריקה לא עברה. מלא ניקוד תחילה.',
          variant: 'destructive',
          duration: 4000,
        });
        return;
      }
    }
    setSaving(true);
    try {
      await memoriaService.frameMeta.update(frameId, { status: newStatus });
      await invalidate();
      toast({ description: `סטטוס עודכן → ${STATUS_LABEL[newStatus]?.label}`, duration: 2500 });
    } catch {
      toast({ description: 'שגיאה בעדכון סטטוס', variant: 'destructive', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full p-6 md:p-8" dir="rtl">

      {/* Header */}
      <div className="mb-7">
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5">Admin · 02</p>
        <h1 className="font-playfair text-3xl text-foreground leading-tight">תור מודרציה</h1>
        <p className="text-sm text-muted-foreground mt-1">
          סקירת מסגרות לפי רובריקת 7 קריטריונים · סף אישור {PUBLISH_THRESHOLD}/35 ללא כישלון חובה
        </p>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending', label: 'ממתינות לסקירה' },
          { key: 'all',     label: 'כל המסגרות' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              filter === key
                ? 'bg-violet-600 text-white'
                : 'bg-cool-800/60 text-muted-foreground hover:text-foreground border border-border',
            ].join(' ')}
          >
            {label}
            {key === 'pending' && (
              <span className="mr-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black">
                {ALL_ENRICHED.filter(f => meta[f.id]?.status === 'draft' || meta[f.id]?.status === 'in_review').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground/40">טוען...</p>
      )}

      {!isLoading && queue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-3" />
          <p className="text-sm text-muted-foreground">אין מסגרות הממתינות לסקירה</p>
        </div>
      )}

      <div className="space-y-2 pb-12">
        {queue.map(f => {
          const m       = meta[f.id] ?? {};
          const rubric  = evaluateRubric(m.rubric_scores ?? {});
          const hasScores = Object.keys(m.rubric_scores ?? {}).length > 0;
          const StatusIcon = STATUS_LABEL[m.status]?.icon ?? Clock;
          const isOpen  = expanded === f.id;

          return (
            <div
              key={f.id}
              className={`rounded-xl border transition-all ${
                isOpen ? 'border-violet-500/40 bg-cool-900/60' : 'border-border bg-card'
              }`}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : f.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-right focus-visible:outline-none rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground font-heebo">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {CATEGORY_LABELS[f.category] ?? f.category} · {STYLE_LABELS[m.style] ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Rubric score badge */}
                  {hasScores && (
                    <span className={`text-xs font-bold tabular-nums ${rubric.canApprove ? 'text-emerald-400' : 'text-red-400/70'}`}>
                      {rubric.total}/35
                    </span>
                  )}

                  {/* Status badge */}
                  <span className={`flex items-center gap-1 text-[10px] font-bold ${STATUS_LABEL[m.status]?.color ?? 'text-muted-foreground/40'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_LABEL[m.status]?.label ?? m.status}
                  </span>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
                </div>
              </button>

              {/* Expanded: rubric + status actions */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">

                  {/* Quick status buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABEL).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        type="button"
                        disabled={saving || m.status === key}
                        onClick={() => handleStatusChange(f.id, key)}
                        className={[
                          'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border',
                          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500',
                          'disabled:opacity-30 disabled:cursor-not-allowed',
                          m.status === key
                            ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                            : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-violet-500/30',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Rubric editor */}
                  <RubricEditor
                    initialScores={m.rubric_scores ?? {}}
                    saving={saving}
                    onSave={(scores, total, canApprove) => handleSaveRubric(f.id, scores, total, canApprove)}
                    onCancel={() => setExpanded(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
