import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { FRAME_PACKS } from '@/components/magnet/framePacks';
import { CATEGORY_LABELS, STYLE_LABELS } from '@/lib/framesMeta';
import { evaluateRubric, PUBLISH_THRESHOLD } from '@/lib/framesRubric';
import { useFramesMeta, useInvalidateFramesMeta } from '@/hooks/useFramesMeta';
import RubricEditor from '@/components/admin/frames/RubricEditor';
import memoriaService from '@/components/memoriaService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import { TONE } from '@/components/system/statusStyles';

// Flatten all frames with category
const ALL_ENRICHED = Object.entries(FRAME_PACKS).flatMap(([cat, frames]) =>
  frames.map(f => ({ ...f, category: cat }))
);

const STATUS_LABEL = {
  draft:      { label: 'טיוטה',   tone: 'muted',    icon: Clock },
  in_review:  { label: 'בסקירה',  tone: 'pending',  icon: AlertTriangle },
  approved:   { label: 'מאושר',   tone: 'ready',    icon: CheckCircle2 },
  archived:   { label: 'ארכיון',  tone: 'rejected', icon: XCircle },
};

export default function FramesModerationQueue() {
  const navigate = useNavigate();
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
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ms-3 mb-4" onClick={() => navigate('/admin/frames')}>
          <ArrowRight />
          לספרייה
        </Button>
        <PageHeader
          className="!mb-0"
          label="כלים · מודרציה"
          title="תור מודרציה"
          subtitle={`סקירת מסגרות לפי רובריקת 7 קריטריונים · סף אישור ${PUBLISH_THRESHOLD}/35 ללא כישלון חובה`}
        />
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
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
              filter === key ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            {key === 'pending' && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-status-pending/20 text-status-pending text-xs font-semibold tabular-nums flex items-center justify-center">
                {ALL_ENRICHED.filter(f => meta[f.id]?.status === 'draft' || meta[f.id]?.status === 'in_review').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">טוען...</p>
      )}

      {!isLoading && queue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-10 h-10 text-status-ready/60 mb-3" />
          <p className="text-sm text-muted-foreground">אין מסגרות הממתינות לסקירה</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {queue.map(f => {
          const m       = meta[f.id] ?? {};
          const rubric  = evaluateRubric(m.rubric_scores ?? {});
          const hasScores = Object.keys(m.rubric_scores ?? {}).length > 0;
          const StatusIcon = STATUS_LABEL[m.status]?.icon ?? Clock;
          const isOpen  = expanded === f.id;

          return (
            <div
              key={f.id}
              className={`rounded-2xl border bg-card transition-colors ${isOpen ? 'border-brand/40' : 'border-border'}`}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : f.id)}
                className="w-full flex items-center gap-3 px-4 md:px-5 py-4 text-right focus-visible:outline-none rounded-2xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[f.category] ?? f.category} · {STYLE_LABELS[m.style] ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Rubric score badge */}
                  {hasScores && (
                    <span className={`text-sm font-semibold tabular-nums ${rubric.canApprove ? 'text-status-ready' : 'text-status-rejected'}`}>
                      {rubric.total}/35
                    </span>
                  )}

                  {/* Status badge */}
                  <span className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-semibold ${TONE[STATUS_LABEL[m.status]?.tone ?? 'muted'].pill}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_LABEL[m.status]?.label ?? m.status}
                  </span>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded: rubric + status actions */}
              {isOpen && (
                <div className="px-4 md:px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4">

                  {/* Quick status buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABEL).map(([key, { label, tone }]) => (
                      <button
                        key={key}
                        type="button"
                        disabled={saving || m.status === key}
                        onClick={() => handleStatusChange(f.id, key)}
                        className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed ${
                          m.status === key ? TONE[tone].pill : 'bg-secondary border-border text-muted-foreground hover:text-foreground disabled:opacity-40'
                        }`}
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
