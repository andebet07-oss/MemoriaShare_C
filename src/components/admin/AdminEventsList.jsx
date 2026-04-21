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
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
            <bdi>{isMagnet ? '03' : '02'}</bdi> · {isMagnet ? 'מגנט' : 'שיתוף'}
          </p>
          <h2 className="font-playfair text-2xl text-foreground">
            {isMagnet ? 'אירועי מגנט' : 'אירועי שיתוף'}
          </h2>
          {!isLoading && (
            <p className="text-muted-foreground text-xs mt-0.5">{events.length} אירועים</p>
          )}
        </div>
        {isMagnet && (
          <button
            onClick={() => navigate('/admin/events/magnet/create')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
          >
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm py-4 text-center">שגיאה בטעינת האירועים.</p>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">אין אירועים עדיין</p>
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
            className="rounded-2xl overflow-hidden bg-card border border-border hover:border-foreground/15 transition-colors"
          >
            {/* Cover image — share events only */}
            {!isMagnet && ev.cover_image && (
              <div className="relative w-full h-36 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${ev.cover_image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cool-950/70 via-transparent to-transparent" />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-playfair text-foreground text-lg leading-tight truncate">{ev.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ev.date)}
                    </span>
                    {isMagnet && ev.print_quota_per_device && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Users className="w-3 h-3" />
                        {ev.print_quota_per_device} הדפסות/אורח
                      </span>
                    )}
                  </div>
                </div>
                {ev.unique_code && (
                  <span className="shrink-0 font-mono text-[10px] px-2 py-1 rounded-lg text-muted-foreground bg-secondary border border-border">
                    #{ev.unique_code}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(isMagnet ? `/admin/events/magnet/${ev.id}` : `/host/events/${ev.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors bg-secondary border border-border hover:border-foreground/15"
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
