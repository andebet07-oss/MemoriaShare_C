import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, CheckCheck, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import PrintJobCard from './PrintJobCard';

export default function PrintQueue({ event }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [query, setQuery] = useState('');
  const [newIds, setNewIds] = useState(() => new Set());
  const [, setTick] = useState(0); // 30s ticker so relative ages stay fresh
  const channelRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ── New-job chime ──────────────────────────────────────────────────────────
  const playChime = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtxRef.current || (audioCtxRef.current = new Ctx());
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        const t = now + i * 0.12;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.32);
      });
    } catch { /* audio unavailable — silent */ }
  };

  // Browsers block audio until a user gesture — resume the context on first tap.
  useEffect(() => {
    const resume = () => { audioCtxRef.current?.resume?.(); };
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, []);

  // Keep relative "X min ago" labels fresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await memoriaService.printJobs.getByEvent(event.id);
      setJobs(data);
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  const flagNew = (id) => {
    setNewIds(prev => new Set(prev).add(id));
    setTimeout(() => setNewIds(prev => {
      const n = new Set(prev); n.delete(id); return n;
    }), 7000);
  };

  useEffect(() => {
    fetchJobs();

    // Realtime: listen for INSERT and UPDATE on this event's print_jobs
    channelRef.current = supabase
      .channel(`print-jobs-${event.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs', filter: `event_id=eq.${event.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Optimistically add the new job immediately so the card appears
            // without waiting for the network round-trip. The `photos` join data
            // is absent from the realtime payload, so the thumbnail will be blank
            // briefly — the background fetchJobs() hydrates it a moment later.
            setJobs(prev => {
              if (prev.some(j => j.id === payload.new.id)) return prev;
              return [...prev, { ...payload.new, photos: null }];
            });
            playChime();      // alert the operator
            flagNew(payload.new.id);
            fetchJobs();      // background refresh to hydrate joined photo data
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const handleUpdate = (updatedJob) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j));
  };

  const handleMarkAllReady = async () => {
    setConfirmBulk(false);
    setIsBulkMarking(true);
    try {
      await Promise.all(printing.map(job => memoriaService.printJobs.updateStatus(job.id, 'ready')));
      fetchJobs();
    } catch {
      // non-fatal
    } finally {
      setIsBulkMarking(false);
    }
  };

  // Search filter (by guest name) — applied to the sectioned lists only.
  const q = query.trim().toLowerCase();
  const matches = (j) => !q || (j.photos?.guest_name || '').toLowerCase().includes(q);
  const visible = jobs.filter(matches);

  const pending  = visible.filter(j => j.status === 'pending');
  const printing = visible.filter(j => j.status === 'printing');
  const settled  = visible.filter(j => j.status === 'ready' || j.status === 'rejected');

  // Stats reflect the full queue, regardless of the search filter.
  const stat = {
    pending:  jobs.filter(j => j.status === 'pending').length,
    printing: jobs.filter(j => j.status === 'printing').length,
    ready:    jobs.filter(j => j.status === 'ready').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
    </div>
  );

  const renderGrid = (items) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map(job => (
        <PrintJobCard
          key={job.id}
          job={job}
          overlayFrameUrl={event.overlay_frame_url}
          onUpdate={handleUpdate}
          isNew={newIds.has(job.id)}
        />
      ))}
    </div>
  );

  const renderSection = (title, items, color) => items.length === 0 ? null : (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-white/70 text-sm font-semibold">{title} ({items.length})</h3>
      </div>
      {renderGrid(items)}
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

      {/* Search */}
      {jobs.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם אורח..."
            dir="rtl"
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

      {renderSection('ממתינים להדפסה', pending, 'bg-yellow-400')}

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
                <button
                  onClick={handleMarkAllReady}
                  disabled={isBulkMarking}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isBulkMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  אישור
                </button>
                <button onClick={() => setConfirmBulk(false)} className="px-3 py-1.5 text-white/50 hover:text-white text-xs font-semibold rounded-xl transition-colors">
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBulk(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                סמן הכל כמוכן
              </button>
            )}
          </div>
          {renderGrid(printing)}
        </div>
      )}

      {renderSection('הושלמו / נדחו', settled, 'bg-white/30')}
    </div>
  );
}
