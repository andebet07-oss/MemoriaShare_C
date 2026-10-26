import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, CheckCheck, Search, X, Keyboard } from 'lucide-react';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { printAndAdvance, setJobStatus } from '@/lib/printStation';
import ProJobCard from './ProJobCard';
import CropEditor from './CropEditor';
import { Button } from '@/components/ui/button';
import { TONE, PRINT_STATUS } from '@/components/system/statusStyles';

/**
 * MagnetProStation — the smart operator print station (replaces PrintQueue).
 * Adds face-centered crop and keyboard fast-print on top of the realtime queue.
 * Copies are operator-set only (DB default 1): there is deliberately no
 * automatic copy multiplication — face detection is still simulated.
 * Thin orchestrator: queue state lives in usePrintQueue, printing in
 * magnetPrint, crop in useFaceCrop/CropEditor.
 */
export default function MagnetProStation({ event }) {
  const {
    isLoading, query, setQuery, visible, pending, printing, settled, stat,
    newIds, fetchJobs, updateJob, markAllReady, jobs,
  } = usePrintQueue(event.id);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [cropEditorJobId, setCropEditorJobId] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  // ── Keyboard fast-print ─────────────────────────────────────────────────────
  // Failures leave the status unchanged; printStation toasts the operator.
  const advance = useCallback(async (job) => {
    if (!job) return;
    const updated = job.status === 'pending'
      ? await printAndAdvance({ job, event, copies: job.copies ?? 1 })
      : job.status === 'printing' ? await setJobStatus(job, 'ready') : null;
    if (updated) updateJob(updated);
  }, [event, updateJob]);

  const reject = useCallback(async (job) => {
    if (!job) return;
    const updated = await setJobStatus(job, 'rejected');
    if (updated) updateJob(updated);
  }, [updateJob]);

  // Latest nav data in a ref so the keydown listener stays mounted once.
  const kbRef = useRef({});
  const navList = [...pending, ...printing];
  kbRef.current = { navList, selectedJobId, cropEditorOpen: cropEditorJobId != null };

  useEffect(() => {
    const onKey = (e) => {
      const { navList, selectedJobId, cropEditorOpen } = kbRef.current;
      if (cropEditorOpen) { if (e.key === 'Escape') setCropEditorJobId(null); return; }
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!navList.length) return;
      const idx = navList.findIndex(j => j.id === selectedJobId);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault(); setSelectedJobId(navList[idx < 0 ? 0 : (idx + 1) % navList.length].id);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault(); setSelectedJobId(navList[idx <= 0 ? navList.length - 1 : idx - 1].id);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); advance(navList[idx < 0 ? 0 : idx]);
      } else if (e.key === 'r' || e.key === 'R') {
        if (idx >= 0) reject(navList[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, reject]);

  const handleMarkAllReady = async () => {
    setConfirmBulk(false); setIsBulkMarking(true);
    await markAllReady(printing);
    setIsBulkMarking(false);
  };

  if (isLoading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-muted-foreground animate-spin" /></div>
  );

  const cropJob = cropEditorJobId != null ? jobs.find(j => j.id === cropEditorJobId) : null;

  const renderGrid = (items) => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(job => (
        <ProJobCard
          key={job.id}
          job={job}
          event={event}
          isNew={newIds.has(job.id)}
          isSelected={job.id === selectedJobId}
          onUpdate={updateJob}
          onEditCrop={(j) => setCropEditorJobId(j.id)}
        />
      ))}
    </div>
  );

  const StatPill = ({ status, count }) => (
    <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-card border border-border">
      <span className={`w-2.5 h-2.5 rounded-full ${TONE[PRINT_STATUS[status].tone].dot}`} />
      <span className="text-xl font-semibold tabular-nums text-foreground">{count}</span>
      <span className="text-sm text-muted-foreground">{{ pending: 'ממתינים', printing: 'בהדפסה', ready: 'מוכן', rejected: 'נדחו' }[status]}</span>
    </div>
  );

  const SectionTitle = ({ status, children }) => (
    <div className="flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full ${status ? TONE[PRINT_STATUS[status].tone].dot : 'bg-muted-foreground'}`} />
      <h3 className="text-xl font-semibold text-foreground">{children}</h3>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Stats header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill status="pending"  count={stat.pending} />
            <StatPill status="printing" count={stat.printing} />
            <StatPill status="ready"    count={stat.ready} />
            {stat.rejected > 0 && <StatPill status="rejected" count={stat.rejected} />}
          </div>
          <Button variant="secondary" size="icon" onClick={fetchJobs} aria-label="רענן">
            <RefreshCw />
          </Button>
        </div>

        {/* Keyboard legend */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Keyboard className="w-4 h-4 shrink-0" />
          <span>חיצים = ניווט · רווח/Enter = הדפס והתקדם · R = דחה · Esc = סגור עריכה</span>
        </div>

        {/* Search */}
        {jobs.length > 0 && (
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="חיפוש לפי שם אורח..." dir="rtl"
              className="w-full h-12 pr-11 pl-11 rounded-xl text-base text-foreground placeholder:text-muted-foreground bg-secondary border border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="נקה" className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-xl font-semibold text-foreground/70">ממתין לבקשות הדפסה...</p>
          <p className="text-base mt-1">האורחים עוד לא שלחו צילומים</p>
        </div>
      )}
      {jobs.length > 0 && visible.length === 0 && (
        <p className="text-center py-16 text-muted-foreground text-base">אין אורח תואם לחיפוש</p>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle status="pending">ממתינים להדפסה (<bdi className="tabular-nums">{pending.length}</bdi>)</SectionTitle>
          {renderGrid(pending)}
        </section>
      )}

      {/* Printing + bulk mark ready */}
      {printing.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SectionTitle status="printing">בתהליך הדפסה (<bdi className="tabular-nums">{printing.length}</bdi>)</SectionTitle>
            {confirmBulk ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">לסמן <bdi className="tabular-nums">{printing.length}</bdi> כמוכן?</span>
                <Button size="sm" onClick={handleMarkAllReady} disabled={isBulkMarking}>
                  {isBulkMarking ? <Loader2 className="animate-spin" /> : <CheckCheck />} אישור
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmBulk(false)}>ביטול</Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setConfirmBulk(true)}>
                <CheckCheck /> סמן הכל כמוכן
              </Button>
            )}
          </div>
          {renderGrid(printing)}
        </section>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle>הושלמו / נדחו (<bdi className="tabular-nums">{settled.length}</bdi>)</SectionTitle>
          {renderGrid(settled)}
        </section>
      )}

      {cropJob && (
        <CropEditor job={cropJob} event={event} onUpdate={updateJob} onClose={() => setCropEditorJobId(null)} />
      )}
    </div>
  );
}
