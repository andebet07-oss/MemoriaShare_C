import { useRef, useEffect, useState, useCallback } from 'react';
import { X, ShieldCheck, Link2, Save } from 'lucide-react';
import { drawOnCanvas, drawSafeZone } from '@/lib/frameRenderer';
import { FRAMES_META, STYLE_LABELS, STYLE_ACCENT, CATEGORY_LABELS } from '@/lib/framesMeta';
import { LABEL_H_RATIO } from '@/components/magnet/framePacks';
import memoriaService from '@/components/memoriaService';
import { useInvalidateFramesMeta } from '@/hooks/useFramesMeta';
import { evaluateRubric } from '@/lib/framesRubric';
import { useToast } from '@/components/ui/use-toast';
import FramePngPreview from '@/components/admin/frames/FramePngPreview';

const PW = 300;
const PH = Math.round(PW * (1 + LABEL_H_RATIO));

const STATUS_OPTIONS = [
  { value: 'approved',   label: '✓ מאושר'     },
  { value: 'archived',   label: 'ארכיון'       },
  { value: 'in_review',  label: 'בסקירה'       },
  { value: 'draft',      label: 'טיוטה'        },
];

/**
 * meta prop: DB-sourced row from useFramesMeta() — falls back to local FRAMES_META if absent.
 */
export default function FrameDetailPanel({ frame, meta: metaProp, category, onClose }) {
  const cvs    = useRef(null);
  const { toast } = useToast();
  const invalidate = useInvalidateFramesMeta();

  // Prefer DB meta; fall back to local seed
  const baseMeta = metaProp ?? FRAMES_META[frame.id] ?? {};
  const accent   = STYLE_ACCENT[baseMeta.style] ?? STYLE_ACCENT.minimal_luxury;

  const [eventData,    setEventData]    = useState({ name: 'מור & יונתן', date: '2026-06-14', tagline: '' });
  const [safeZone,     setSafeZone]     = useState(false);
  const [assigning,    setAssigning]    = useState(false);
  const [events,       setEvents]       = useState(null);
  const [assignTarget, setAssignTarget] = useState('');
  const [saving,       setSaving]       = useState(false);

  // Editable meta fields — seeded from DB/local on open
  const [editStatus,  setEditStatus]  = useState(baseMeta.status  ?? 'approved');
  const [editQuality, setEditQuality] = useState(baseMeta.quality ?? 0);
  const [editNotes,   setEditNotes]   = useState(baseMeta.notes   ?? '');
  const [metaDirty,   setMetaDirty]   = useState(false);

  const redraw = useCallback(() => {
    if (frame.isPng) return; // PNG frames use FramePngPreview — no canvas needed
    document.fonts.ready.then(() => {
      drawOnCanvas(cvs.current, frame, eventData);
      if (safeZone) drawSafeZone(cvs.current, baseMeta.outputWidthMm ?? 100);
    });
  }, [frame, eventData, safeZone, baseMeta.outputWidthMm]);

  useEffect(() => { redraw(); }, [redraw]);

  const loadEvents = useCallback(async () => {
    if (events !== null) return;
    try {
      const all = await memoriaService.events.list();
      setEvents(all.filter(e => e.event_type === 'magnet'));
    } catch {
      setEvents([]);
    }
  }, [events]);

  const handleAssign = async () => {
    if (!assignTarget) return;
    setSaving(true);
    try {
      await memoriaService.events.update(assignTarget, { overlay_frame_url: frame.id });
      toast({ description: `המסגרת "${frame.name}" הוגדרה לאירוע`, duration: 3000 });
      setAssigning(false);
      setAssignTarget('');
    } catch {
      toast({ description: 'שגיאה — נסה שוב', variant: 'destructive', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    // Hard-fail gate: block approval if rubric has not passed (procedural frames only)
    if (editStatus === 'approved' && !frame.isPng) {
      const { canApprove } = evaluateRubric(baseMeta.rubric_scores ?? {});
      if (!canApprove) {
        toast({
          description: 'לא ניתן לאשר — הרובריקה לא עברה. השתמש בתור המודרציה לניקוד תחילה.',
          variant: 'destructive',
          duration: 4500,
        });
        return;
      }
    }
    setSaving(true);
    try {
      await memoriaService.frameMeta.update(frame.id, {
        status:        editStatus,
        quality_score: editQuality,
        notes:         editNotes,
      });
      await invalidate();
      setMetaDirty(false);
      toast({ description: 'מטא-דאטה עודכנה', duration: 2500 });
    } catch {
      toast({ description: 'שגיאה בשמירה — נסה שוב', variant: 'destructive', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const field = (label, value, key, type = 'text') => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => setEventData(d => ({ ...d, [key]: e.target.value }))}
        className="w-full bg-cool-950 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500 text-right"
        dir="rtl"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0 gap-3">
        <button
          onClick={onClose}
          aria-label="סגור פאנל"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="text-center min-w-0 flex-1">
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-violet-400">מסגרת · תצוגה</p>
          <p className="font-playfair text-[17px] text-foreground truncate leading-tight mt-0.5">{frame.name}</p>
        </div>

        <button
          onClick={() => { setAssigning(true); loadEvents(); }}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Link2 className="w-3 h-3" />
          הגדר לאירוע
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Preview: FramePngPreview for PNG frames, canvas for procedural */}
        <div className="flex justify-center items-center py-6 px-4 bg-cool-950/60">
          <div style={{ position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', borderRadius: 4 }}>
            {frame.isPng ? (
              <FramePngPreview
                frame={{ image_url: frame.image_url, hole_bbox: frame.hole_bbox }}
                style={{ width: PW, height: PH, display: 'block', borderRadius: 4 }}
              />
            ) : (
              <canvas
                ref={cvs}
                width={PW}
                height={PH}
                style={{ display: 'block', borderRadius: 4 }}
              />
            )}
          </div>
        </div>

        <div className="px-5 pb-6 space-y-6">

          {/* Safe-zone toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">אזורי בטיחות להדפסה</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={safeZone}
              onClick={() => setSafeZone(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${safeZone ? 'bg-violet-600' : 'bg-cool-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${safeZone ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {safeZone && (
            <p className="text-[10px] text-muted-foreground/50 -mt-4 leading-relaxed">
              <span className="text-red-400">—</span> bleed 3mm &nbsp;·&nbsp;
              <span className="text-yellow-400">—</span> type-safe 5mm
              &nbsp;·&nbsp;{baseMeta.outputWidthMm ?? 100}mm wide
            </p>
          )}

          {/* Preview controls */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/60">תצוגת אירוע</p>
            {field('שם האירוע', eventData.name, 'name')}
            {field('תאריך', eventData.date, 'date', 'date')}
            {field('תגית (אופציונלי)', eventData.tagline, 'tagline')}
          </div>

          {/* Editable frame metadata */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/60 pb-1">מידע על המסגרת</p>

            <Row label="קטגוריה" value={CATEGORY_LABELS[category] ?? category} />
            <Row label="סגנון"   value={STYLE_LABELS[baseMeta.style] ?? '—'} accent={accent.pill} />
            <Row label="רוחב פלט" value={`${baseMeta.outputWidthMm ?? 100}mm`} />

            {/* Editable: status */}
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground/60">סטטוס</span>
              <select
                value={editStatus}
                onChange={e => { setEditStatus(e.target.value); setMetaDirty(true); }}
                className="bg-cool-900 border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                dir="rtl"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Editable: quality score */}
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground/60">ניקוד איכות</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={35}
                  value={editQuality}
                  onChange={e => { setEditQuality(Number(e.target.value)); setMetaDirty(true); }}
                  className="w-14 bg-cool-900 border border-border rounded-lg px-2 py-1 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <span className="text-muted-foreground/40">/35</span>
              </div>
            </div>

            {/* Editable: notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60 block">הערות</label>
              <textarea
                value={editNotes}
                onChange={e => { setEditNotes(e.target.value); setMetaDirty(true); }}
                rows={2}
                placeholder="הערות פנימיות..."
                className="w-full bg-cool-950 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none text-right"
                dir="rtl"
              />
            </div>

            {metaDirty && (
              <button
                onClick={handleSaveMeta}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            )}
          </div>

          {/* Assign to event */}
          {assigning && (
            <div className="space-y-3 pt-4 border-t border-border/60">
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/60">הגדר לאירוע מגנט</p>

              {events === null
                ? <p className="text-xs text-muted-foreground/50">טוען אירועים...</p>
                : events.length === 0
                  ? <p className="text-xs text-muted-foreground/50">לא נמצאו אירועי מגנט</p>
                  : (
                    <>
                      <select
                        value={assignTarget}
                        onChange={e => setAssignTarget(e.target.value)}
                        className="w-full bg-cool-950 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                        dir="rtl"
                      >
                        <option value="">בחר אירוע...</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name}{ev.date ? ` · ${ev.date}` : ''}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAssign}
                          disabled={!assignTarget || saving}
                          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          {saving ? 'מגדיר...' : 'הגדר מסגרת'}
                        </button>
                        <button
                          onClick={() => { setAssigning(false); setAssignTarget(''); }}
                          className="px-4 py-2.5 bg-cool-800 hover:bg-cool-700 text-muted-foreground text-xs font-bold rounded-lg transition-colors"
                        >
                          ביטול
                        </button>
                      </div>
                    </>
                  )
              }
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-muted-foreground/60">{label}</span>
      {accent
        ? <span className={`text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-full ${accent}`}>{value}</span>
        : <span className="text-foreground/80 font-medium">{value}</span>
      }
    </div>
  );
}
