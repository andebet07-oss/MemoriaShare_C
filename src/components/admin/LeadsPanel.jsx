import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed'];
const STATUS_HE = { new: 'חדש', contacted: 'יצרנו קשר', converted: 'הומר', closed: 'סגור' };
const STATUS_COLORS = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-white/5 text-white/40 border-white/10',
};

export default function LeadsPanel() {
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
          {leads.map(lead => (
            <div key={lead.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{lead.full_name}</p>
                <p className="text-white/50 text-sm" dir="ltr">{lead.phone}</p>
                {lead.event_date && (
                  <p className="text-white/35 text-xs mt-0.5">
                    {new Date(lead.event_date).toLocaleDateString('he-IL')}
                  </p>
                )}
                {lead.details && (
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{lead.details}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[lead.status]}`}>
                  {STATUS_HE[lead.status]}
                </span>
                {updatingId === lead.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                ) : (
                  <select
                    value={lead.status}
                    onChange={e => handleStatusChange(lead.id, e.target.value)}
                    className="bg-white/8 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-white/30"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_HE[s]}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
