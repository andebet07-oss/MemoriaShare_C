import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Plus, Phone, CalendarDays, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import memoriaService from '@/components/memoriaService';

const STATUS_ORDER = ['new', 'contacted', 'converted', 'closed'];
const STATUS_HE    = { new: 'חדש', contacted: 'יצרנו קשר', converted: 'הומר', closed: 'סגור' };
const STATUS_STYLE = {
  new:       { dot: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', text: '#93c5fd' },
  contacted: { dot: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', text: '#c4b5fd' },
  converted: { dot: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#6ee7b7' },
  closed:    { dot: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
};

function parseDetails(details = '') {
  const parts = details.split(' · ');
  return {
    eventName:  parts[0]?.trim() || '',
    location:   parts[1]?.trim() || '',
    guestCount: parts[2]?.trim() || '',
  };
}

function formatPhone(phone = '') {
  if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

function StatusDot({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.closed;
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {STATUS_HE[status]}
    </span>
  );
}

function StatusPills({ current, onChange, disabled }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUS_ORDER.map(s => {
        const active = current === s;
        const st = STATUS_STYLE[s];
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95"
            style={{
              background: active ? st.bg : 'rgba(255,255,255,0.04)',
              border: active ? `1px solid ${st.border}` : '1px solid rgba(255,255,255,0.07)',
              color: active ? st.text : 'rgba(255,255,255,0.3)',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {STATUS_HE[s]}
          </button>
        );
      })}
    </div>
  );
}

export default function LeadsPanel() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
    const { eventName } = parseDetails(lead.details);
    navigate('/admin/events/magnet/create', {
      state: {
        fromLead: {
          leadId:      lead.id,
          eventName:   eventName || lead.details || '',
          eventDate:   lead.event_date || '',
          contactName: lead.full_name || '',
        },
      },
    });
  };

  // Count by status
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div dir="rtl">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">לידים</h2>
          <p className="text-white/30 text-xs mt-0.5">{leads.length} סה״כ</p>
        </div>
        <button
          onClick={fetchLeads}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05] hover:bg-white/10 border border-white/[0.08] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_ORDER.map(s => counts[s] > 0 && (
          <span key={s} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: STATUS_STYLE[s].bg, border: `1px solid ${STATUS_STYLE[s].border}`, color: STATUS_STYLE[s].text }}>
            {counts[s]} {STATUS_HE[s]}
          </span>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {leads.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Users className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-white/25 text-sm">אין לידים עדיין</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leads.map(lead => {
            const { eventName, location, guestCount } = parseDetails(lead.details);
            const formattedDate = lead.event_date
              ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' })
                  .format(new Date(lead.event_date + 'T00:00:00'))
              : null;
            const isExpanded = expandedId === lead.id;

            return (
              <div
                key={lead.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: isExpanded ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Main card row — click to expand */}
                <button
                  type="button"
                  className="w-full text-right p-4 flex items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  {/* Status dot */}
                  <span className="mt-1 shrink-0 w-2 h-2 rounded-full"
                    style={{ background: STATUS_STYLE[lead.status]?.dot || '#6b7280' }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-[15px] leading-snug truncate">
                        {eventName || '—'}
                      </span>
                      <StatusDot status={lead.status} />
                    </div>

                    {/* Secondary info line */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-white/50 text-xs">{lead.full_name}</span>
                      {formattedDate && (
                        <span className="flex items-center gap-1 text-white/35 text-xs">
                          <CalendarDays className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      )}
                      {location && (
                        <span className="flex items-center gap-1 text-white/35 text-xs">
                          <MapPin className="w-3 h-3" />
                          {location}
                        </span>
                      )}
                      {guestCount && (
                        <span className="flex items-center gap-1 text-white/35 text-xs">
                          <Users className="w-3 h-3" />
                          {guestCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 flex flex-col gap-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {/* Phone */}
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-violet-400 text-sm font-semibold hover:text-violet-300 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{formatPhone(lead.phone)}</span>
                    </a>

                    {/* Status pills */}
                    {updatingId === lead.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                    ) : (
                      <StatusPills
                        current={lead.status}
                        onChange={s => handleStatusChange(lead.id, s)}
                        disabled={updatingId === lead.id}
                      />
                    )}

                    {/* Create event CTA */}
                    {lead.status !== 'closed' && (
                      <button
                        onClick={() => handleCreateEvent(lead)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        צור אירוע מגנטים
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
