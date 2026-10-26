import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer, ExternalLink, Users, Calendar } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import AdminFilterBar from './AdminFilterBar';
import { RowsSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import Card from '@/components/system/Card';

export default function AdminEventsList({ type }) {
  const navigate = useNavigate();
  const isMagnet = type === 'magnet';
  const [query, setQuery] = useState('');

  const { data: allEvents = [], isLoading, error } = useQuery({
    queryKey: ['admin-all-events'],
    queryFn: () => memoriaService.events.list('-created_date'),
    staleTime: 30_000,
  });

  const typeEvents = allEvents.filter(e => e.event_type === type);
  const q = query.trim().toLowerCase();
  const events = q
    ? typeEvents.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.unique_code || '').toLowerCase().includes(q))
    : typeEvents;

  const formatDate = (d) => d
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
    : '—';

  const createButton = isMagnet && (
    <Button onClick={() => navigate('/admin/events/magnet/create')}>
      <Plus />
      אירוע חדש
    </Button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        label={<><bdi>{isMagnet ? '03' : '02'}</bdi> · {isMagnet ? 'מגנט' : 'שיתוף'}</>}
        title={isMagnet ? 'אירועי מגנט' : 'אירועי שיתוף'}
        subtitle={!isLoading ? <><bdi className="tabular-nums">{typeEvents.length}</bdi> אירועים</> : null}
        action={createButton}
      />

      {/* Search */}
      {!isLoading && !error && typeEvents.length > 0 && (
        <AdminFilterBar
          search={query}
          onSearch={setQuery}
          placeholder="חיפוש לפי שם אירוע או קוד..."
        />
      )}

      {isLoading && <RowsSkeleton rows={4} />}

      {error && (
        <p className="text-destructive text-sm py-4 text-center">שגיאה בטעינת האירועים.</p>
      )}

      {/* No events at all */}
      {!isLoading && !error && typeEvents.length === 0 && (
        <div className="flex flex-col items-center text-center py-16 gap-4">
          <p className="text-muted-foreground text-sm">אין אירועים עדיין</p>
          {isMagnet && (
            <Button onClick={() => navigate('/admin/events/magnet/create')}>
              + צור אירוע מגנט ראשון
            </Button>
          )}
        </div>
      )}

      {/* Has events but none match the search */}
      {!isLoading && !error && typeEvents.length > 0 && events.length === 0 && (
        <p className="text-muted-foreground text-sm py-12 text-center">אין אירועים תואמים</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {events.map(ev => (
          <Card key={ev.id} className="!p-0 overflow-hidden hover:border-foreground/20 transition-colors">
            {/* Cover image — share events only */}
            {!isMagnet && ev.cover_image && (
              <div className="relative w-full h-36 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${ev.cover_image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              </div>
            )}

            <div className="p-4 md:p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">{ev.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(ev.date)}
                    </span>
                    {isMagnet && ev.print_quota_per_device && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span><bdi className="tabular-nums">{ev.print_quota_per_device}</bdi> הדפסות/אורח</span>
                      </span>
                    )}
                  </div>
                </div>
                {ev.unique_code && (
                  <span dir="ltr" className="shrink-0 h-7 px-2.5 rounded-full border border-border bg-secondary text-xs font-semibold tabular-nums text-muted-foreground flex items-center">
                    #{ev.unique_code}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(isMagnet ? `/admin/events/magnet/${ev.id}` : `/host/events/${ev.id}`)}>
                  <ExternalLink />
                  ניהול
                </Button>
                {isMagnet && (
                  <Button size="sm" onClick={() => navigate(`/admin/events/magnet/${ev.id}/print`)}>
                    <Printer />
                    עמדת הדפסה
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
