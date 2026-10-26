import { useState, useEffect } from 'react';
import { Camera, List, Loader2, Sparkles, Magnet, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import MagnetCamera from '@/components/magnet/MagnetCamera';
import PrintStatusModal from '@/components/magnet/PrintStatusModal';
import { reportError } from '@/lib/sentry';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/system/StatusBadge';

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
    } catch (err) {
      reportError('MagnetGuestPage.fetchPrintJobs', err, { eventId: event.id });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Called by MagnetCamera after each successful print job creation
  const handlePrintJobCreated = () => {
    fetchPrintJobs();
  };

  if (isLoadingAuth || isSigningIn) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand/50 animate-spin" />
    </div>
  );

  const usedPrints = printJobs.filter(j => j.status !== 'rejected').length;
  const remainingPrints = Math.max(0, (event.print_quota_per_device ?? 5) - usedPrints);
  const pendingCount = printJobs.filter(j => j.status === 'pending').length;
  const readyCount = printJobs.filter(j => j.status === 'ready').length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">

      {/* Background: the event cover under a bottom scrim, or the indigo glow */}
      <div className="fixed inset-0">
        {event.cover_image
          ? <img src={event.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
          : <div className="w-full h-full bg-glow" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 px-4 max-w-md mx-auto w-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}>

        {/* First-time 3-step guide — sets expectations before the first capture */}
        {printJobs.length === 0 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { Icon: Camera,   label: 'מצלמים' },
              { Icon: Sparkles, label: 'מעצבים' },
              { Icon: Magnet,   label: 'אוספים מגנט' },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-foreground/10 border border-foreground/15 backdrop-blur-md">
                    <s.Icon className="w-5 h-5 text-foreground/90" />
                  </div>
                  <span className="text-xs font-medium text-foreground/70">{s.label}</span>
                </div>
                {i < arr.length - 1 && <span className="text-foreground/30 text-sm mb-5">‹</span>}
              </div>
            ))}
          </div>
        )}

        {/* Event header */}
        <div className="text-center mb-6">
          <p className="text-sm text-foreground/60 mb-1">ברוכים הבאים לאירוע של</p>
          <h1 className="text-3xl font-semibold text-foreground mb-3 leading-tight">{event.name}</h1>
          {remainingPrints === 0
            ? <StatusBadge status="rejected">מכסת ההדפסות הסתיימה</StatusBadge>
            : <span className="inline-flex items-center h-7 px-3 rounded-full border border-foreground/15 bg-foreground/10 backdrop-blur text-xs font-semibold text-foreground/85">
                <span>נותרו לך <bdi className="tabular-nums">{remainingPrints}</bdi> הדפסות</span>
              </span>}
        </div>

        {/* Ready-for-pickup banner — the payoff moment */}
        {readyCount > 0 && (
          <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 bg-status-ready/15 border border-status-ready/30 backdrop-blur">
            <div className="w-10 h-10 rounded-full bg-status-ready/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-status-ready" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground leading-tight">
                {readyCount === 1 ? 'המגנט שלך מוכן לאיסוף!' : `${readyCount} מגנטים מוכנים לאיסוף!`}
              </p>
              <p className="text-sm text-foreground/70 mt-0.5">גשו לעמדת המגנטים לאיסוף</p>
            </div>
          </div>
        )}

        {/* Pending chip */}
        {pendingCount > 0 && (
          <div className="flex justify-center mb-5">
            <StatusBadge status="pending">{pendingCount} בתהליך הדפסה...</StatusBadge>
          </div>
        )}

        {/* Camera CTA */}
        <Button variant="onImage" size="lg" className="w-full mb-3" onClick={() => setShowCamera(true)} disabled={remainingPrints === 0}>
          <Camera className="!size-5" />
          {remainingPrints === 0 ? 'מכסה הסתיימה' : 'צלמו ושלחו להדפסה'}
        </Button>

        {/* Status button */}
        {printJobs.length > 0 && (
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowStatus(true)}>
            <List />
            <span>סטטוס ההדפסות שלי (<bdi className="tabular-nums">{printJobs.length}</bdi>)</span>
          </Button>
        )}

        <p className="text-xs text-foreground/30 text-center mt-4">מופעל על ידי Memoria</p>
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
