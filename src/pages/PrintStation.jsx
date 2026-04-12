import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldOff, Magnet, Wifi } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import memoriaService from '@/components/memoriaService';
import PrintQueue from '@/components/magnet/PrintQueue';

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
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <ShieldOff className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white font-bold text-xl">אין הרשאת גישה</p>
        <p className="text-white/40 text-sm mt-1">Print Station מיועד למנהלים בלבד.</p>
      </div>
    </div>
  );

  if (!event) return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <p className="text-white/40">האירוע לא נמצא.</p>
    </div>
  );

  // SEC-03: Print Station is exclusively for Magnet events.
  // Prevent accidental access to Share events via direct URL.
  if (event.event_type !== 'magnet') return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-sm px-6">
        <ShieldOff className="w-12 h-12 text-yellow-500/60 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-1">אירוע לא תואם</p>
        <p className="text-white/40 text-sm">
          Print Station מיועד לאירועי מגנט בלבד. אירוע זה הוא מסוג "{event.event_type}".
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">

      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/8 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Magnet className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">{event.name}</h1>
              <p className="text-white/40 text-xs">Print Station · תחנת הפעלה</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Live</span>
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PrintQueue event={event} />
      </div>
    </div>
  );
}
