import { useState, useEffect } from 'react';
import { Camera, List, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import MagnetCamera from '@/components/magnet/MagnetCamera';
import PrintStatusModal from '@/components/magnet/PrintStatusModal';

export default function MagnetGuestPage({ event }) {
  const { user, isLoadingAuth } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [printJobs, setPrintJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // Ensure anonymous sign-in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setIsSigningIn(true);
      supabase.auth.signInAnonymously().finally(() => setIsSigningIn(false));
    }
  }, [isLoadingAuth, user]);

  // Fetch print jobs once user is known
  useEffect(() => {
    if (!user?.id || !event?.id) return;
    fetchPrintJobs();
  }, [user?.id, event?.id]);

  // Realtime: update guest's job statuses without requiring a page refresh.
  // Filter by event_id server-side (single-column Supabase filter limit),
  // then guard on guest_user_id client-side so we only mutate our own rows.
  useEffect(() => {
    if (!user?.id || !event?.id) return;

    const channel = supabase
      .channel(`guest-prints-${event.id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'print_jobs',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          if (payload.new.guest_user_id !== user.id) return;
          setPrintJobs(prev =>
            prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j)
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, event?.id]);

  const fetchPrintJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const jobs = await memoriaService.printJobs.getByUser(event.id, user.id);
      setPrintJobs(jobs);
    } catch {
      // non-fatal
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Called by MagnetCamera after each successful print job creation
  const handlePrintJobCreated = () => {
    fetchPrintJobs();
  };

  if (isLoadingAuth || isSigningIn) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
    </div>
  );

  const usedPrints = printJobs.filter(j => j.status !== 'rejected').length;
  const remainingPrints = Math.max(0, (event.print_quota_per_device ?? 5) - usedPrints);
  const pendingCount = printJobs.filter(j => j.status === 'pending').length;
  const readyCount = printJobs.filter(j => j.status === 'ready').length;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-heebo" dir="rtl">

      {/* Background */}
      <div className="fixed inset-0">
        {event.cover_image
          ? <img src={event.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
          : <div className="w-full h-full bg-gradient-to-br from-violet-950 to-black" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 px-6 pb-10 max-w-md mx-auto w-full">

        {/* Event header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">{event.name}</h1>
          <p className={`text-sm font-semibold ${remainingPrints === 0 ? 'text-red-400' : 'text-white/70'}`}>
            {remainingPrints === 0 ? 'מכסת ההדפסות הסתיימה' : `נותרו לך ${remainingPrints} הדפסות`}
          </p>
        </div>

        {/* Status chips */}
        {printJobs.length > 0 && (
          <div className="flex gap-2 justify-center mb-6">
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
                {pendingCount} ממתינים
              </span>
            )}
            {readyCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {readyCount} מוכנים לאיסוף!
              </span>
            )}
          </div>
        )}

        {/* Camera CTA */}
        <button
          onClick={() => setShowCamera(true)}
          disabled={remainingPrints === 0}
          className="w-full py-5 bg-white disabled:bg-white/20 text-black disabled:text-white/30 font-black text-lg rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-3"
        >
          <Camera className="w-5 h-5" />
          {remainingPrints === 0 ? 'מכסה הסתיימה' : 'צלמו ושלחו להדפסה'}
        </button>

        {/* Status button */}
        {printJobs.length > 0 && (
          <button
            onClick={() => setShowStatus(true)}
            className="w-full py-3.5 bg-white/6 border border-white/12 backdrop-blur-xl text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <List className="w-4 h-4" />
            סטטוס ההדפסות שלי ({printJobs.length})
          </button>
        )}

        <p className="text-white/20 text-[10px] text-center mt-4 tracking-widest uppercase">Powered by MemoriaMagnet</p>
      </div>

      {showCamera && (
        <MagnetCamera
          event={event}
          userId={user.id}
          remainingPrints={remainingPrints}
          onClose={() => setShowCamera(false)}
          onPrintJobCreated={handlePrintJobCreated}
        />
      )}

      {showStatus && (
        <PrintStatusModal
          printJobs={printJobs}
          onClose={() => setShowStatus(false)}
        />
      )}
    </div>
  );
}
