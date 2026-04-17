import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Image, Magnet, MessageSquare, Hash } from 'lucide-react';
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
  const newLeads    = leads.filter(l => l.status === 'new').length;
  const recent      = events.slice(0, 8);

  const isLoading = eventsLoading || leadsLoading;

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
        <KpiCard icon={MessageSquare} label="לידים חדשים"   value={newLeads}      color="indigo" sub={`${leads.length} סה״כ`} onClick={() => navigate('/admin/leads')} />
        <KpiCard icon={Hash}          label="סה״כ אירועים"  value={events.length} color="lime"   onClick={() => navigate('/admin/events/share')} />
      </div>

      {/* Leads by status */}
      {leads.length > 0 && (
        <div className="mb-6 rounded-2xl p-4 bg-card border border-border">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-3">לידים לפי סטטוס</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {['new', 'contacted', 'converted', 'closed'].map(s => {
              const count = leads.filter(l => l.status === s).length;
              if (!count) return null;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`font-playfair text-2xl ${STATUS_COLORS[s]}`}>{count}</span>
                  <span className="text-muted-foreground text-xs">{STATUS_HE[s]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent events */}
      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-3">אירועים אחרונים</p>
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
