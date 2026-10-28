import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Magnet, MessageSquare, CalendarDays, Printer, ExternalLink } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiGridSkeleton, RowsSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import SectionLabel from '@/components/system/SectionLabel';
import Card from '@/components/system/Card';
import StatTile from '@/components/system/StatTile';
import { LEAD_STATUS, TONE } from '@/components/system/statusStyles';
import LeadCard, { parseLeadDetails } from '@/components/admin/overview/LeadCard';

const formatDate = (d) => new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d + 'T00:00:00'));
const PAGE = 'max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16';

function Section({ label, children }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel as="h2">{label}</SectionLabel>
      {children}
    </section>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['admin-all-events'],
    queryFn: () => memoriaService.events.list('-created_date'),
    staleTime: 30_000,
  });

  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => memoriaService.leads.list(),
    staleTime: 30_000,
  });

  // Magnet-only admin: Share events are not shown anywhere in the admin UI.
  const magnetEvents   = events.filter(e => e.event_type === 'magnet');
  const newLeads       = leads.filter(l => l.status === 'new');
  const contactedLeads = leads.filter(l => l.status === 'contacted');
  const recent         = magnetEvents.slice(0, 8);

  // Upcoming magnet events (today onward) — fast path to the print station
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = magnetEvents
    .filter(e => e.date && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const isLoading = eventsLoading || leadsLoading;

  const handleCreateEvent = (lead) => {
    const { eventName, coverImageUrl, templateId } = parseLeadDetails(lead.details);
    navigate('/admin/events/magnet/create', {
      state: {
        fromLead: {
          leadId:        lead.id,
          eventName:     eventName || lead.details || '',
          eventDate:     lead.event_date || '',
          contactName:   lead.full_name || '',
          coverImageUrl: coverImageUrl || '',
          templateId,
        },
      },
    });
  };

  if (isLoading) return (
    <div className={PAGE}>
      <Skeleton className="w-24 h-3 mb-4" />
      <KpiGridSkeleton count={2} />
      <Skeleton className="w-32 h-3 mb-3" />
      <RowsSkeleton rows={3} />
    </div>
  );

  if (eventsError || leadsError) return (
    <div className="flex justify-center py-16">
      <p className="text-destructive text-sm">שגיאה בטעינת הנתונים.</p>
    </div>
  );

  return (
    <div className={`${PAGE} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <PageHeader label="ניהול" title="סקירה" />

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatTile icon={Magnet}        label="אירועי מגנט" value={magnetEvents.length} onClick={() => navigate('/admin/events/magnet')} />
        <StatTile icon={MessageSquare} label="לידים חדשים" value={newLeads.length} sub={`${leads.length} סה״כ`} onClick={() => navigate('/admin/leads')} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Actionable: upcoming events and open leads (first on mobile) */}
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <Section label="אירועים קרובים">
              {upcoming.map(ev => (
                <Card key={ev.id} className="flex items-center justify-between gap-3 py-3 md:py-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{ev.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />{formatDate(ev.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="icon-sm" onClick={() => navigate(`/admin/events/magnet/${ev.id}`)} aria-label="ניהול אירוע">
                      <ExternalLink />
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/admin/events/magnet/${ev.id}/print`)}>
                      <Printer />
                      עמדת הדפסה
                    </Button>
                  </div>
                </Card>
              ))}
            </Section>
          )}
          {newLeads.length > 0 && (
            <Section label={`ממתינים לטיפול · ${newLeads.length}`}>
              {newLeads.map(lead => <LeadCard key={lead.id} lead={lead} onCreateEvent={handleCreateEvent} />)}
            </Section>
          )}
          {contactedLeads.length > 0 && (
            <Section label={`במעקב · ${contactedLeads.length}`}>
              {contactedLeads.map(lead => <LeadCard key={lead.id} lead={lead} onCreateEvent={handleCreateEvent} />)}
            </Section>
          )}
        </div>

        {/* Reference: lead status summary and recent events */}
        <div className="flex flex-col gap-8">
          {leads.length > 0 && (
            <Section label="לידים לפי סטטוס">
              <Card className="flex flex-wrap gap-x-6 gap-y-3">
                {Object.entries(LEAD_STATUS).map(([st, cfg]) => {
                  const count = leads.filter(l => l.status === st).length;
                  if (!count) return null;
                  return (
                    <div key={st} className="flex items-baseline gap-2">
                      <span className={`text-2xl font-semibold tabular-nums ${TONE[cfg.tone].text}`}>{count}</span>
                      <span className="text-sm text-muted-foreground">{cfg.label}</span>
                    </div>
                  );
                })}
              </Card>
            </Section>
          )}
          <Section label="אירועים אחרונים">
            {recent.map(ev => (
              <Card
                as="button"
                interactive
                key={ev.id}
                onClick={() => navigate(`/admin/events/magnet/${ev.id}`)}
                className="w-full flex items-center justify-between gap-3 py-3 md:py-4"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">{ev.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.date ? formatDate(ev.date) : '—'}</p>
                </div>
              </Card>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}
