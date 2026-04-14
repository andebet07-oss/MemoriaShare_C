import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Plus, Phone, CalendarDays, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import memoriaService from '@/components/memoriaService';

const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed'];
const STATUS_HE = { new: 'חדש', contacted: 'יצרנו קשר', converted: 'הומר', closed: 'סגור' };
const STATUS_COLORS = {
  new:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed:    'bg-white/5 text-white/40 border-white/10',
};

// details field format: "event_name · location · guest_count"
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

export default function LeadsPanel() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

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
    navigate('/CreateMagnetEvent', {
      state: {
        fromLead: {
          leadId:    lead.id,
          eventName: eventName || lead.details || '',
          eventDate: lead.event_date || '',
          contactName: lead.full_name || '',
        },
      },
    });
  };

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">לידים ({leads.length})</h2>
        <button onClick={fetchLeads} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {leads.length === 0 ? (
        <p className="text-white/30 text-center py-12">אין לידים עדיין.</p>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => {
            const { eventName, location, guestCount } = parseDetails(lead.details);
            const formattedDate = lead.event_date
              ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
                  .format(new Date(lead.event_date + 'T00:00:00'))
              : null;

            return (
              <div key={lead.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">

                {/* Card body */}
                <div className="p-4 flex flex-col gap-3">

                  {/* Top row: event name + status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-base leading-tight truncate">
                        {eventName || '—'}
                      </p>
                      {location && (
                        <p className="text-white/40 text-xs mt-0.5 truncate">{location}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_HE[lead.status]}
                    </span>
                  </div>

                  {/* Meta row: contact, date, guests */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-white/55 text-sm">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span dir="ltr">{formatPhone(lead.phone)}</span>
                      <span className="text-white/30">·</span>
                      <span>{lead.full_name}</span>
                    </span>
                    {formattedDate && (
                      <span className="flex items-center gap-1.5 text-white/55 text-sm">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        {formattedDate}
                      </span>
                    )}
                    {guestCount && (
                      <span className="flex items-center gap-1.5 text-white/55 text-sm">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {guestCount} אורחים
                      </span>
                    )}
                  </div>

                </div>

                {/* Action bar */}
                <div className="border-t border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3">

                  {/* Status selector */}
                  <div className="flex items-center gap-2">
                    {updatingId === lead.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                    ) : (
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className="bg-white/[0.06] border border-white/10 text-white/60 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-white/30 transition-colors"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_HE[s]}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Create event CTA */}
                  {lead.status !== 'closed' && (
                    <button
                      onClick={() => handleCreateEvent(lead)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      צור אירוע
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
