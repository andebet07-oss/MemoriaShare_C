import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Printer, ExternalLink, Users, Calendar } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

export default function AdminEventsList({ type }) {
  const navigate = useNavigate();
  const isMagnet = type === 'magnet';

  const { data: allEvents = [], isLoading, error } = useQuery({
    queryKey: ['admin-all-events'],
    queryFn: () => memoriaService.events.list('-created_date'),
    staleTime: 30_000,
  });

  const events = allEvents.filter(e => e.event_type === type);

  const formatDate = (d) => d
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
    : '—';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-extrabold text-xl">
            {isMagnet ? 'אירועי מגנט' : 'אירועי שיתוף'}
          </h2>
          {!isLoading && (
            <p className="text-white/35 text-xs mt-0.5">{events.length} אירועים</p>
          )}
        </div>
        {isMagnet && (
          <button
            onClick={() => navigate('/admin/events/magnet/create')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
          >
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm py-4 text-center">שגיאה בטעינת האירועים.</p>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/25 text-sm">אין אירועים עדיין</p>
          {isMagnet && (
            <button
              onClick={() => navigate('/admin/events/magnet/create')}
              className="mt-4 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
            >
              + צור אירוע מגנט ראשון
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {events.map(ev => (
          <div
            key={ev.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Cover (share events only) */}
            {!isMagnet && ev.cover_image && (
              <div
                className="w-full h-28 bg-cover bg-center"
                style={{ backgroundImage: `url(${ev.cover_image})` }}
              />
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-base leading-tight truncate">{ev.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ev.date)}
                    </span>
                    {isMagnet && ev.print_quota_per_device && (
                      <span className="flex items-center gap-1 text-white/40 text-xs">
                        <Users className="w-3 h-3" />
                        {ev.print_quota_per_device} הדפסות/אורח
                      </span>
                    )}
                  </div>
                </div>
                {/* Unique code badge */}
                {ev.unique_code && (
                  <span className="shrink-0 font-mono text-[10px] px-2 py-1 rounded-lg text-white/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    #{ev.unique_code}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(isMagnet ? `/admin/events/magnet/${ev.id}` : `/host/events/${ev.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ניהול
                </button>
                {isMagnet && (
                  <button
                    onClick={() => navigate(`/admin/events/magnet/${ev.id}/print`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    עמדת הדפסה
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
