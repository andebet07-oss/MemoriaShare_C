import { X, Clock, Printer, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'ממתין',    icon: Clock,          color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  printing: { label: 'בהדפסה',   icon: Printer,        color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  ready:    { label: 'מוכן',     icon: CheckCircle2,   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  rejected: { label: 'נדחה',     icon: X,              color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30' },
};

export default function PrintStatusModal({ printJobs, onClose }) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end bg-black/70 backdrop-blur-sm" onClick={onClose} dir="rtl">
      <div
        className="bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[75vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/8">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">הבקשות שלי</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Job List */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {printJobs.length === 0 ? (
            <p className="text-white/30 text-center py-10">אין בקשות הדפסה עדיין.</p>
          ) : (
            printJobs.map((job, i) => {
              const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
              return (
                <div key={job.id} className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl p-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/8 shrink-0">
                    {thumbUrl
                      ? <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">#{i + 1}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs mb-1">צילום {i + 1}</p>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 pb-8 pt-3" style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)` }}>
          <p className="text-white/25 text-xs text-center">הסטטוס מתעדכן בזמן אמת</p>
        </div>
      </div>
    </div>
  );
}
