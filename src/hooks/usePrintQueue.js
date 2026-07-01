import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import { reportError } from '@/lib/sentry';

/**
 * usePrintQueue(eventId)
 *
 * Owns the operator print-queue state machine (lifted out of PrintQueue.jsx):
 * fetch, realtime INSERT/UPDATE, new-job chime, "new" highlight flag, a 30s
 * ticker to keep relative ages fresh, search-by-guest filter, sectioned lists,
 * stat counts, bulk mark-ready and single-job merge.
 *
 * Realtime UPDATE spreads payload.new, so the Pro Station columns
 * (copies / face_count / crop_config / status) propagate automatically thanks
 * to REPLICA IDENTITY FULL on print_jobs.
 */
export function usePrintQueue(eventId) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newIds, setNewIds] = useState(() => new Set());
  const [, setTick] = useState(0); // 30s ticker so relative ages stay fresh
  const channelRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ── New-job chime ──────────────────────────────────────────────────────────
  const playChime = useCallback(() => {
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
  }, []);

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

  const fetchJobs = useCallback(async () => {
    try {
      const data = await memoriaService.printJobs.getByEvent(eventId);
      setJobs(data);
    } catch (err) {
      reportError('usePrintQueue.fetchJobs', err, { eventId });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const flagNew = useCallback((id) => {
    setNewIds(prev => new Set(prev).add(id));
    setTimeout(() => setNewIds(prev => {
      const n = new Set(prev); n.delete(id); return n;
    }), 7000);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchJobs();

    // Realtime: INSERT (new request) + UPDATE (status/copies/crop change)
    channelRef.current = supabase
      .channel(`print-jobs-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Optimistically add so the card appears immediately; the photos join
            // is absent from the realtime payload, so fetchJobs() hydrates it next.
            setJobs(prev => {
              if (prev.some(j => j.id === payload.new.id)) return prev;
              return [...prev, { ...payload.new, photos: null }];
            });
            playChime();
            flagNew(payload.new.id);
            fetchJobs();
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [eventId]); // fetchJobs/playChime/flagNew are stable for a given eventId

  // Merge a single updated job (e.g. after an operator action) into local state.
  const updateJob = useCallback((updated) => {
    if (!updated?.id) return;
    setJobs(prev => prev.map(j => j.id === updated.id ? { ...j, ...updated } : j));
  }, []);

  const markAllReady = useCallback(async (printingJobs) => {
    try {
      await Promise.all(printingJobs.map(job => memoriaService.printJobs.updateStatus(job.id, 'ready')));
      fetchJobs();
    } catch (err) {
      reportError('usePrintQueue.markAllReady', err, { eventId });
    }
  }, [eventId, fetchJobs]);

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

  return {
    jobs, isLoading, query, setQuery,
    visible, pending, printing, settled, stat,
    newIds, fetchJobs, updateJob, markAllReady,
  };
}
