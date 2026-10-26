import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldOff, Magnet, Wifi } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import memoriaService from '@/components/memoriaService';
import MagnetProStation from '@/components/magnet/MagnetProStation';

export default function PrintStation() {
  const { eventId } = useParams();
  const { user, isLoadingAuth } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    memoriaService.events.get(eventId)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [eventId]);

  if (isLoadingAuth || isLoading) return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="fixed inset-0 bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-semibold text-2xl">אין הרשאת גישה</p>
        <p className="text-muted-foreground text-base mt-1">תחנת ההדפסה מיועדת למנהלים בלבד.</p>
      </div>
    </div>
  );

  if (!event) return (
    <div className="fixed inset-0 bg-background flex items-center justify-center" dir="rtl">
      <p className="text-muted-foreground text-base">האירוע לא נמצא.</p>
    </div>
  );

  // SEC-03: Print Station is exclusively for Magnet events.
  // Prevent accidental access to Share events via direct URL.
  if (event.event_type !== 'magnet') return (
    <div className="fixed inset-0 bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-sm px-6">
        <ShieldOff className="w-12 h-12 text-status-pending mx-auto mb-4" />
        <p className="text-foreground font-semibold text-2xl mb-1">אירוע לא תואם</p>
        <p className="text-muted-foreground text-base">
          תחנת ההדפסה מיועדת לאירועי מגנט בלבד. אירוע זה הוא מסוג "{event.event_type}".
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">

      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
              <Magnet className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">{event.name}</h1>
              <p className="text-sm text-muted-foreground">תחנת הדפסה</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-status-ready">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-semibold">מחובר</span>
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-16">
        <MagnetProStation event={event} />
      </div>
    </div>
  );
}
