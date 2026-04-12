import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import PrintJobCard from './PrintJobCard';

export default function PrintQueue({ event }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const channelRef = useRef(null);

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
              // Deduplicate: ignore if already present (e.g., from a prior fetch)
              if (prev.some(j => j.id === payload.new.id)) return prev;
              return [...prev, { ...payload.new, photos: null }];
            });
            fetchJobs(); // background refresh to hydrate joined photo data
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [event.id]);

  const handleUpdate = (updatedJob) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j));
  };

  const handleMarkAllReady = async () => {
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

  const pending = jobs.filter(j => j.status === 'pending');
  const printing = jobs.filter(j => j.status === 'printing');
  const settled = jobs.filter(j => j.status === 'ready' || j.status === 'rejected');

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
    </div>
  );

  const renderSection = (title, items, color) => items.length === 0 ? null : (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-white/70 text-sm font-semibold">{title} ({items.length})</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map(job => (
          <PrintJobCard
            key={job.id}
            job={job}
            overlayFrameUrl={event.overlay_frame_url}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/40 text-sm">{jobs.length} בקשות סה״כ</p>
        </div>
        <button onClick={fetchJobs} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-24 text-white/25">
          <p className="text-lg">ממתין לבקשות הדפסה...</p>
          <p className="text-sm mt-1">האורחים עוד לא שלחו צילומים</p>
        </div>
      )}

      {renderSection('ממתינים להדפסה', pending, 'bg-yellow-400')}

      {printing.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-white/70 text-sm font-semibold">בתהליך הדפסה ({printing.length})</h3>
            </div>
            <button
              onClick={handleMarkAllReady}
              disabled={isBulkMarking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isBulkMarking
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CheckCheck className="w-3 h-3" />}
              סמן הכל כמוכן
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {printing.map(job => (
              <PrintJobCard
                key={job.id}
                job={job}
                overlayFrameUrl={event.overlay_frame_url}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {renderSection('הושלמו / נדחו', settled, 'bg-white/30')}
    </div>
  );
}
