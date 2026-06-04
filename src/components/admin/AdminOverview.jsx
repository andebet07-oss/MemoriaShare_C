import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Image, Magnet, MessageSquare, Hash, Plus, Phone, CalendarDays, MapPin, Users, Printer, ExternalLink } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

const STATUS_HE = { new: 'חדש', contacted: 'יצרנו קשר', converted: 'הומר', closed: 'סגור' };
const STATUS_COLORS = {
  new:       'text-indigo-300',
  contacted: 'text-violet-300',
  converted: 'text-emerald-300',
  closed:    'text-muted-foreground',
};

const ICON_STYLES = {
  blue:   { wrap: 'rgba(124,134,225,0.15)', icon: '#a9b1ec'  },
  violet: { wrap: 'rgba(124,58,237,0.18)',  icon: '#a78bfa'  },
  indigo: { wrap: 'rgba(124,134,225,0.15)', icon: '#a9b1ec'  },
  lime:   { wrap: 'rgba(132,204,22,0.12)',  icon: '#a3e635'  },
};

function KpiCard({ icon: Icon, label, value, sub, color = 'violet', onClick }) {
  const { wrap, icon } = ICON_STYLES[color];
  return (
    <button
      onClick={onClick}
      className="text-right flex flex-col p-4 rounded-2xl transition-all active:scale-[0.97] bg-card border border-border hover:border-foreground/15"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 shrink-0" style={{ background: wrap }}>
        <Icon style={{ width: 16, height: 16, color: icon }} />
      </div>
      <span className="font-playfair text-3xl text-foreground/90 leading-none mb-1">{value ?? '—'}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
      {sub && <span className="text-muted-foreground/60 text-[10px] mt-0.5">{sub}</span>}
    </button>
  );
}

function parseLeadDetails(details = '') {
  const parts = details.split(' · ');
  const coverPart = parts.find(p => p.startsWith('cover:'));
  return {
    eventName:     parts[0]?.trim() || '',
    location:      parts[1]?.trim() || '',
    guestCount:    parts[2]?.trim() || '',
    coverImageUrl: coverPart ? coverPart.replace('cover:', '') : '',
  };
}

function NewLeadCard({ lead, onCreateEvent }) {
  const { eventName, location, guestCount } = parseLeadDetails(lead.details);
  const formattedDate = lead.event_date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date(lead.event_date + 'T00:00:00'))
    : null;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-playfair text-foreground text-lg leading-snug truncate">
            {eventName || lead.full_name}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            <span className="text-muted-foreground text-xs">{lead.full_name}</span>
            {formattedDate && (
              <span className="flex items-center gap-1 text-muted-foreground/70 text-xs">
                <CalendarDays className="w-3 h-3" />{formattedDate}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1 text-muted-foreground/70 text-xs">
                <MapPin className="w-3 h-3" />{location}
              </span>
            )}
            {guestCount && (
              <span className="flex items-center gap-1 text-muted-foreground/70 text-xs">
                <Users className="w-3 h-3" />{guestCount}
              </span>
            )}
          </div>
        </div>
        <a
          href={`tel:${lead.phone}`}
          onClick={e => e.stopPropagation()}
          className="shrink-0 flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span dir="ltr">{lead.phone}</span>
        </a>
      </div>
      <button
        onClick={() => onCreateEvent(lead)}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
      >
        <Plus className="w-4 h-4" />
        צור אירוע מגנטים
      </button>
    </div>
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

  const shareCount  = events.filter(e => e.event_type === 'share').length;
  const magnetCount = events.filter(e => e.event_type === 'magnet').length;
  const newLeads       = leads.filter(l => l.status === 'new');
  const contactedLeads = leads.filter(l => l.status === 'contacted');
  const recent      = events.slice(0, 8);

  // Upcoming magnet events (today onward) — fast path to the print station
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter(e => e.event_type === 'magnet' && e.date && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const isLoading = eventsLoading || leadsLoading;

  const handleCreateEvent = (lead) => {
    const { eventName, coverImageUrl } = parseLeadDetails(lead.details);
    navigate('/admin/events/magnet/create', {
      state: {
        fromLead: {
          leadId:        lead.id,
          eventName:     eventName || lead.details || '',
          eventDate:     lead.event_date || '',
          contactName:   lead.full_name || '',
          coverImageUrl: coverImageUrl || '',
        },
      },
    });
  };

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );

  if (eventsError || leadsError) return (
    <div className="flex justify-center py-16">
      <p className="text-red-400 text-sm">שגיאה בטעינת הנתונים.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20">

      {/* Section label */}
      <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-4"><bdi>01</bdi> · סקירה</p>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard icon={Image}         label="אירועי שיתוף"  value={shareCount}    color="blue"   onClick={() => navigate('/admin/events/share')} />
        <KpiCard icon={Magnet}        label="אירועי מגנט"   value={magnetCount}   color="violet" onClick={() => navigate('/admin/events/magnet')} />
        <KpiCard icon={MessageSquare} label="לידים חדשים"   value={newLeads.length} color="indigo" sub={`${leads.length} סה״כ`} onClick={() => navigate('/admin/leads')} />
        <KpiCard icon={Hash}          label="סה״כ אירועים"  value={events.length} color="lime"   onClick={() => navigate('/admin/events/magnet')} />
      </div>

      {/* Upcoming magnet events — one tap to the print station */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">אירועים קרובים</p>
          <div className="space-y-2">
            {upcoming.map(ev => (
              <div key={ev.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                <div className="min-w-0">
                  <p className="font-playfair text-foreground text-lg truncate">{ev.name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ev.date + 'T00:00:00'))}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/admin/events/magnet/${ev.id}`)}
                    aria-label="ניהול אירוע"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors bg-secondary border border-border"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/events/magnet/${ev.id}/print`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    עמדת הדפסה
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New leads — actionable cards */}
      {newLeads.length > 0 && (
        <div className="mb-6">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
            ממתינים לטיפול · {newLeads.length}
          </p>
          <div className="space-y-2.5">
            {newLeads.map(lead => (
              <NewLeadCard key={lead.id} lead={lead} onCreateEvent={handleCreateEvent} />
            ))}
          </div>
        </div>
      )}

      {/* Leads in follow-up — stay visible so none fall through the cracks */}
      {contactedLeads.length > 0 && (
        <div className="mb-6">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
            במעקב · {contactedLeads.length}
          </p>
          <div className="space-y-2.5">
            {contactedLeads.map(lead => (
              <NewLeadCard key={lead.id} lead={lead} onCreateEvent={handleCreateEvent} />
            ))}
          </div>
        </div>
      )}

      {/* Status summary — always shown for a constant at-a-glance picture */}
      {leads.length > 0 && (
        <div className="mb-6 rounded-2xl p-4 bg-card border border-border">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">לידים לפי סטטוס</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {['new', 'contacted', 'converted', 'closed'].map(st => {
              const count = leads.filter(l => l.status === st).length;
              if (!count) return null;
              return (
                <div key={st} className="flex items-center gap-1.5">
                  <span className={`font-playfair text-2xl ${STATUS_COLORS[st]}`}>{count}</span>
                  <span className="text-muted-foreground text-xs">{STATUS_HE[st]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent events */}
      <p className="text-violet-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">אירועים אחרונים</p>
      <div className="space-y-2">
        {recent.map(ev => (
          <button
            key={ev.id}
            onClick={() => navigate(ev.event_type === 'magnet' ? `/admin/events/magnet/${ev.id}` : `/host/events/${ev.id}`)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-right transition-all active:scale-[0.98] bg-card border border-border hover:border-foreground/15"
          >
            <div className="min-w-0">
              <p className="font-playfair text-foreground text-lg truncate">{ev.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {ev.date ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ev.date + 'T00:00:00')) : '—'}
              </p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full tracking-wider ${
              ev.event_type === 'magnet'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
            }`}>
              {ev.event_type === 'magnet' ? 'מגנט' : 'שיתוף'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
