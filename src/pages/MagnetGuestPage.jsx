import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import memoriaService from '@/components/memoriaService';
import MagnetCamera from '@/components/magnet/MagnetCamera';
import PrintStatusModal from '@/components/magnet/PrintStatusModal';
import { reportError } from '@/lib/sentry';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useInlineOfflineNotice } from '@/components/OfflineBanner';
import GuestShell from '@/components/magnet/guest/GuestShell';
import GuestTitle, { FlowLine } from '@/components/magnet/guest/GuestTitle';
import GuestSheet from '@/components/magnet/guest/GuestSheet';
import GuestNotice from '@/components/magnet/guest/GuestNotice';
import { GuestClosed } from '@/components/magnet/guest/GuestMessage';
import { SheetSkeleton } from '@/components/magnet/guest/GuestSkeleton';

export default function MagnetGuestPage({ event }) {
  const { user, isLoadingAuth } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [printJobs, setPrintJobs] = useState([]);
  const [hasLoadedJobs, setHasLoadedJobs] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const online = useOnlineStatus();
  const isOpen = event.is_active !== false;

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
    try {
      const jobs = await memoriaService.printJobs.getByUser(event.id, user.id);
      setPrintJobs(jobs);
      setLoadError(false);
    } catch (err) {
      reportError('MagnetGuestPage.fetchPrintJobs', err, { eventId: event.id });
      setLoadError(true);
    } finally {
      setHasLoadedJobs(true);
    }
  };

  // Called by MagnetCamera after each successful print job creation
  const handlePrintJobCreated = () => {
    fetchPrintJobs();
  };

  const usedPrints = printJobs.filter(j => j.status !== 'rejected').length;
  const remainingPrints = Math.max(0, (event.print_quota_per_device ?? 5) - usedPrints);
  const readyCount = printJobs.filter(j => j.status === 'ready').length;

  // A short haptic when a magnet turns ready while the guest is on the page
  // (not for magnets that were already ready when it loaded).
  const lastReady = useRef(null);
  useEffect(() => {
    if (!hasLoadedJobs) return;
    if (lastReady.current !== null && readyCount > lastReady.current) {
      try { navigator.vibrate?.(40); } catch { /* unsupported: no haptic */ }
    }
    lastReady.current = readyCount;
  }, [readyCount, hasLoadedJobs]);

  const isLoading = isLoadingAuth || isSigningIn || (!!user && !hasLoadedJobs);
  const signInFailed = !isLoading && !user;
  // The landing explains offline inline; hide the global banner meanwhile.
  useInlineOfflineNotice(isOpen && !showCamera);

  if (!isOpen) return <GuestClosed event={event} />;

  let sheet;
  if (isLoading) sheet = <SheetSkeleton />;
  else if (signInFailed) {
    sheet = <GuestNotice kind={online ? 'error' : 'offline'} onRetry={() => window.location.reload()} />;
  } else {
    sheet = (
      <GuestSheet
        jobs={printJobs}
        quota={event.print_quota_per_device ?? 5}
        remaining={remainingPrints}
        online={online}
        loadError={loadError}
        onRetry={fetchPrintJobs}
        onCapture={() => setShowCamera(true)}
        onStatus={() => setShowStatus(true)}
      />
    );
  }

  // First visit: how it works. Shown while loading too, so the most common
  // first impression never jumps.
  const firstVisit = printJobs.length === 0 && !loadError && !signInFailed;

  return (
    <>
      <GuestShell cover={event.cover_image} title={<GuestTitle event={event}>{firstVisit && <FlowLine />}</GuestTitle>}>
        {sheet}
      </GuestShell>

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
    </>
  );
}
