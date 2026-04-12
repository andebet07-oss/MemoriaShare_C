import { useState } from 'react';
import { Printer, CheckCircle2, X, Clock, Loader2 } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { applyOverlayFrame } from '@/functions/applyOverlayFrame';

const STATUS_CONFIG = {
  pending:  { label: 'ממתין',   color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  printing: { label: 'בהדפסה',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  ready:    { label: 'מוכן',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  rejected: { label: 'נדחה',    color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30' },
};

export default function PrintJobCard({ job, overlayFrameUrl, onUpdate }) {
  const [isActing, setIsActing] = useState(false);
  const [popupError, setPopupError] = useState(false);

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const photoUrl = job.photos?.file_urls?.original ?? job.photos?.file_url;
  const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
  const guestName = job.photos?.guest_name;

  const act = async (newStatus, printFirst = false) => {
    setIsActing(true);
    setPopupError(false);
    try {
      if (printFirst) {
        try {
          await applyOverlayFrame(photoUrl, overlayFrameUrl);
        } catch (e) {
          if (e.message === 'POPUP_BLOCKED') { setPopupError(true); setIsActing(false); return; }
        }
      }
      const updated = await memoriaService.printJobs.updateStatus(job.id, newStatus);
      onUpdate(updated);
    } catch {
      // non-fatal — UI state unchanged
    } finally {
      setIsActing(false);
    }
  };

  const isSettled = job.status === 'ready' || job.status === 'rejected';

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col ${isSettled ? 'opacity-60' : ''}`} dir="rtl">
      {/* Photo */}
      <div className="relative aspect-square bg-white/5">
        {thumbUrl
          ? <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">אין תמונה</div>
        }
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2 flex-1">
        <p className="text-white/60 text-xs truncate">
          {guestName || `אורח`}
        </p>
        <p className="text-white/30 text-[10px]">
          {new Date(job.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {popupError && <p className="text-orange-400 text-[10px] mt-1">אפשרו חלונות קופצים להדפסה</p>}
      </div>

      {/* Actions */}
      {!isSettled && (
        <div className="px-3 pb-3 flex gap-2">
          {job.status === 'pending' && (
            <button
              onClick={() => act('printing', true)}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
              הדפס
            </button>
          )}
          {job.status === 'printing' && (
            <button
              onClick={() => act('ready')}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              מוכן
            </button>
          )}
          <button
            onClick={() => act('rejected')}
            disabled={isActing}
            className="w-8 h-8 flex items-center justify-center bg-white/8 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/40 hover:text-red-400 rounded-xl transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
