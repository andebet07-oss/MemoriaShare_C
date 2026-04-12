import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import PrintJobCard from './PrintJobCard';

export default function PrintQueue({ event }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
            // Re-fetch to get the joined photos data
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
  }, [event.id]);

  const handleUpdate = (updatedJob) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j));
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
      {renderSection('בתהליך הדפסה', printing, 'bg-blue-400')}
      {renderSection('הושלמו / נדחו', settled, 'bg-white/30')}
    </div>
  );
}
