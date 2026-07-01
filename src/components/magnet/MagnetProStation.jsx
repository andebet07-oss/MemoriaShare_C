import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, CheckCheck, Search, X, Keyboard } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { detectFaces, loadImageEl } from '@/hooks/useFaceCrop';
import { printJob, getCompositedUrl } from '@/lib/magnetPrint';
import ProJobCard from './ProJobCard';
import CropEditor from './CropEditor';

/**
 * MagnetProStation — the smart operator print station (replaces PrintQueue).
 * Adds AI face-detection → auto-copies, face-centered crop, and keyboard
 * fast-print, on top of the realtime queue. Thin orchestrator: queue state lives
 * in usePrintQueue, printing in magnetPrint, crop in useFaceCrop/CropEditor.
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
  const analyzingRef = useRef(new Set());

  // ── Auto-multiplication: analyze faces once per job (face_count == null) ─────
  useEffect(() => {
    jobs.forEach((job) => {
      // Only analyze active jobs — skip settled (ready/rejected) and already-done.
      if (job.status === 'ready' || job.status === 'rejected') return;
      if (job.face_count != null || analyzingRef.current.has(job.id)) return;
      const url = job.raw_photo_url ?? getCompositedUrl(job);
      if (!url) return; // photos join not hydrated yet — retry on next tick
      analyzingRef.current.add(job.id);
      (async () => {
        try {
          const img = await loadImageEl(url);
          const { count } = await detectFaces(img);
          const updated = await memoriaService.printJobs.update(job.id, { face_count: count, copies: Math.max(1, count) });
          updateJob(updated);
        } catch {
          analyzingRef.current.delete(job.id); // allow retry
        }
      })();
    });
  }, [jobs, updateJob]);

  // ── Keyboard fast-print ─────────────────────────────────────────────────────
  const advance = useCallback(async (job) => {
    if (!job) return;
    try {
      if (job.status === 'pending') {
        try { await printJob({ job, event, copies: job.copies ?? 1 }); }
        catch (e) { if (e.message === 'POPUP_BLOCKED') return; }
        updateJob(await memoriaService.printJobs.updateStatus(job.id, 'printing'));
      } else if (job.status === 'printing') {
        updateJob(await memoriaService.printJobs.updateStatus(job.id, 'ready'));
      }
    } catch { /* non-fatal */ }
  }, [event, updateJob]);

  const reject = useCallback(async (job) => {
    if (!job) return;
    try { updateJob(await memoriaService.printJobs.updateStatus(job.id, 'rejected')); }
    catch { /* non-fatal */ }
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
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
  );

  const cropJob = cropEditorJobId != null ? jobs.find(j => j.id === cropEditorJobId) : null;

  const renderGrid = (items) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

  const StatPill = ({ label, count, dot }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-white text-sm font-bold tabular-nums">{count}</span>
      <span className="text-white/40 text-xs">{label}</span>
    </div>
  );

  return (
    <div>
      {/* Stats header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill label="ממתינים" count={stat.pending}  dot="bg-yellow-400" />
          <StatPill label="בהדפסה"  count={stat.printing} dot="bg-blue-400" />
          <StatPill label="מוכן"    count={stat.ready}    dot="bg-emerald-400" />
          {stat.rejected > 0 && <StatPill label="נדחו" count={stat.rejected} dot="bg-white/30" />}
        </div>
        <button onClick={fetchJobs} aria-label="רענן" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0">
          <RefreshCw className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* Keyboard legend */}
      <div className="flex items-center gap-2 mb-4 text-white/35 text-[11px]">
        <Keyboard className="w-3.5 h-3.5" />
        <span>חיצים = ניווט · רווח/Enter = הדפס והתקדם · R = דחה · Esc = סגור עריכה</span>
      </div>

      {/* Search */}
      {jobs.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם אורח..." dir="rtl"
            className="w-full h-10 pr-9 pl-9 rounded-xl text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:border-white/25 focus:outline-none transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="נקה" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10">
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          )}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-24 text-white/25">
          <p className="text-lg">ממתין לבקשות הדפסה...</p>
          <p className="text-sm mt-1">האורחים עוד לא שלחו צילומים</p>
        </div>
      )}
      {jobs.length > 0 && visible.length === 0 && (
        <p className="text-center py-16 text-white/25 text-sm">אין אורח תואם לחיפוש</p>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <h3 className="text-white/70 text-sm font-semibold">ממתינים להדפסה ({pending.length})</h3>
          </div>
          {renderGrid(pending)}
        </div>
      )}

      {/* Printing + bulk mark ready */}
      {printing.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-white/70 text-sm font-semibold">בתהליך הדפסה ({printing.length})</h3>
            </div>
            {confirmBulk ? (
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs">לסמן {printing.length} כמוכן?</span>
                <button onClick={handleMarkAllReady} disabled={isBulkMarking}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                  {isBulkMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />} אישור
                </button>
                <button onClick={() => setConfirmBulk(false)} className="px-3 py-1.5 text-white/50 hover:text-white text-xs font-semibold rounded-xl transition-colors">ביטול</button>
              </div>
            ) : (
              <button onClick={() => setConfirmBulk(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-colors">
                <CheckCheck className="w-3 h-3" /> סמן הכל כמוכן
              </button>
            )}
          </div>
          {renderGrid(printing)}
        </div>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            <h3 className="text-white/70 text-sm font-semibold">הושלמו / נדחו ({settled.length})</h3>
          </div>
          {renderGrid(settled)}
        </div>
      )}

      {cropJob && (
        <CropEditor job={cropJob} event={event} onUpdate={updateJob} onClose={() => setCropEditorJobId(null)} />
      )}
    </div>
  );
}
