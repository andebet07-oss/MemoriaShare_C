import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, Copy, Check, ArrowRight, Users, Calendar, Hash, Lock } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-white/40 text-sm flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
      <span className={`text-white/80 text-sm font-semibold ${mono ? 'font-mono tracking-wider' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function MagnetEventDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['magnet-event', eventId],
    queryFn: () => memoriaService.events.get(eventId),
    enabled: !!eventId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['magnet-photos', eventId],
    queryFn: () => memoriaService.photos.getByEvent(eventId),
    enabled: !!eventId,
  });

  const guestLink = event
    ? `${import.meta.env.VITE_SITE_URL || window.location.origin}/magnet/${event.unique_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(guestLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (d) => d
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
    : null;

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="text-center py-16">
      <p className="text-white/30 text-sm">לא נמצא אירוע.</p>
      <button onClick={() => navigate('/admin/events/magnet')} className="mt-4 text-violet-400 text-sm hover:underline">
        חזרה לרשימה
      </button>
    </div>
  );

  if (event.event_type !== 'magnet') return <Navigate to="/admin/events/magnet" replace />;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20" dir="rtl">

      {/* Back */}
      <button
        onClick={() => navigate('/admin/events/magnet')}
        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        אירועי מגנט
      </button>

      {/* Event name + date */}
      <div className="mb-6">
        <h1 className="text-white font-extrabold text-2xl leading-tight">{event.name}</h1>
        {formatDate(event.date) && (
          <p className="text-white/40 text-sm mt-1">{formatDate(event.date)}</p>
        )}
      </div>

      {/* Print Station CTA */}
      <button
        onClick={() => navigate(`/admin/events/magnet/${eventId}/print`)}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-base mb-6 transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
      >
        <Printer className="w-5 h-5 text-white" />
        <span className="text-white">פתח עמדת הדפסה</span>
      </button>

      {/* Event details */}
      <div className="rounded-2xl px-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <InfoRow icon={Calendar} label="תאריך"        value={formatDate(event.date)} />
        <InfoRow icon={Hash}     label="קוד אירוע"    value={event.unique_code} mono />
        <InfoRow icon={Lock}     label="PIN"          value={event.pin_code}    mono />
        <InfoRow icon={Users}    label="הדפסות לאורח" value={event.print_quota_per_device ? `${event.print_quota_per_device} הדפסות` : null} />
      </div>

      {/* Guest link */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">קישור לאורחים</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-white/60 text-xs font-mono truncate bg-white/5 rounded-lg px-3 py-2 border border-white/10">
            {guestLink}
          </p>
          <button
            onClick={handleCopy}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: copied ? 'rgba(163,230,53,0.15)' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {copied
              ? <Check className="w-4 h-4 text-lime-400" />
              : <Copy className="w-4 h-4 text-white/50" />
            }
          </button>
        </div>
      </div>

      {/* Photo feed */}
      {photos.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
            תמונות שנשלחו ({photos.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 18).map(ph => (
              <div key={ph.id} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                <img src={ph.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-white/20 text-sm">אין תמונות עדיין</p>
        </div>
      )}
    </div>
  );
}
