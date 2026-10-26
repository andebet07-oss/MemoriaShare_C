import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Plus, Phone, CalendarDays, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import memoriaService from '@/components/memoriaService';
import AdminFilterBar from './AdminFilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { RowsSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import Card from '@/components/system/Card';
import StatusBadge from '@/components/system/StatusBadge';
import { LEAD_STATUS, TONE } from '@/components/system/statusStyles';

const STATUS_ORDER = ['new', 'contacted', 'converted', 'closed'];
const STATUS_HE    = Object.fromEntries(STATUS_ORDER.map(s => [s, LEAD_STATUS[s].label]));

function parseDetails(details = '') {
  const parts = details.split(' · ');
  const coverPart = parts.find(p => p.startsWith('cover:'));
  return {
    eventName:     parts[0]?.trim() || '',
    location:      parts[1]?.trim() || '',
    guestCount:    parts[2]?.trim() || '',
    coverImageUrl: coverPart ? coverPart.replace('cover:', '') : '',
  };
}

function formatPhone(phone = '') {
  if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

function StatusPills({ current, onChange, disabled }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUS_ORDER.map(s => {
        const active = current === s;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors active:scale-95 disabled:opacity-50 ${
              active ? TONE[LEAD_STATUS[s].tone].pill : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {STATUS_HE[s]}
          </button>
        );
      })}
    </div>
  );
}

const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center py-16 gap-3">
    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
      <Users className="w-5 h-5 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
);

export default function LeadsPanel() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchLeads = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoriaService.leads.list();
      setLeads(data || []);
    } catch {
      setError('שגיאה בטעינת הלידים.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await memoriaService.leads.update(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {
      setError('שגיאה בעדכון הסטטוס.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateEvent = (lead) => {
    const { eventName, coverImageUrl } = parseDetails(lead.details);
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

  // Count by status
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  // Search + status filter (client-side; leads are fully loaded)
  const q = query.trim().toLowerCase();
  const visibleLeads = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (!q) return true;
    const { eventName, location } = parseDetails(l.details);
    return (
      eventName.toLowerCase().includes(q) ||
      (l.full_name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      location.toLowerCase().includes(q)
    );
  });

  // Filter chips: "all" + each status that has at least one lead
  const chips = [
    { key: 'all', label: 'הכל', count: leads.length },
    ...STATUS_ORDER.filter(s => counts[s] > 0).map(s => ({ key: s, label: STATUS_HE[s], count: counts[s] })),
  ];

  const PAGE = 'max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16';

  if (isLoading) return (
    <div className={PAGE}>
      <Skeleton className="w-20 h-3 mb-2" />
      <Skeleton className="w-24 h-7 mb-5" />
      <RowsSkeleton rows={5} />
    </div>
  );

  return (
    <div className={`${PAGE} animate-in fade-in slide-in-from-bottom-2 duration-500`} dir="rtl">
      <PageHeader
        label={<><bdi>04</bdi> · לידים</>}
        title="לידים"
        subtitle={<><bdi className="tabular-nums">{leads.length}</bdi> סה״כ</>}
        action={
          <Button variant="secondary" size="icon-sm" onClick={fetchLeads} aria-label="רענן">
            <RefreshCw />
          </Button>
        }
      />

      {/* Search + status filter */}
      {leads.length > 0 && (
        <AdminFilterBar
          search={query}
          onSearch={setQuery}
          placeholder="חיפוש לפי שם אירוע, איש קשר או טלפון..."
          chips={chips}
          active={filter}
          onChip={setFilter}
        />
      )}

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {leads.length === 0 ? (
        <EmptyState text="אין לידים עדיין" />
      ) : visibleLeads.length === 0 ? (
        <EmptyState text="אין לידים תואמים" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {visibleLeads.map(lead => {
            const { eventName, location, guestCount } = parseDetails(lead.details);
            const formattedDate = lead.event_date
              ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' })
                  .format(new Date(lead.event_date + 'T00:00:00'))
              : null;
            const isExpanded = expandedId === lead.id;
            const meta = [
              formattedDate && { Icon: CalendarDays, text: formattedDate },
              location && { Icon: MapPin, text: location },
              guestCount && { Icon: Users, text: guestCount },
            ].filter(Boolean);

            return (
              <Card key={lead.id} className={`!p-0 overflow-hidden transition-colors ${isExpanded ? 'border-brand/40' : ''}`}>
                {/* Main card row — click to expand */}
                <button
                  type="button"
                  className="w-full text-right p-4 md:p-5 pb-3 md:pb-3 flex flex-col gap-1"
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-base font-semibold text-foreground truncate">{eventName || '—'}</span>
                    <StatusBadge kind="lead" status={lead.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">{lead.full_name}</span>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    {meta.map(({ Icon, text }) => (
                      <span key={text} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" />{text}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Quick status change — always visible, no expand needed */}
                <div className="px-4 md:px-5 pb-4">
                  {updatingId === lead.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <StatusPills
                      current={lead.status}
                      onChange={s => handleStatusChange(lead.id, s)}
                      disabled={updatingId === lead.id}
                    />
                  )}
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="border-t border-border px-4 md:px-5 py-4 flex flex-col gap-3">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-brand text-sm font-semibold hover:text-brand/80 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span dir="ltr" className="tabular-nums">{formatPhone(lead.phone)}</span>
                    </a>
                    {lead.status !== 'closed' && (
                      <Button onClick={() => handleCreateEvent(lead)} className="w-full">
                        <Plus />
                        צור אירוע מגנטים
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
