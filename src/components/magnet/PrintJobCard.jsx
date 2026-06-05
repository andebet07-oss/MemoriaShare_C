import { useState } from 'react';
import { Printer, CheckCircle2, X, Loader2 } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { applyOverlayFrame } from '@/functions/applyOverlayFrame';

const STATUS_CONFIG = {
  pending:  { label: 'ממתין',   color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  printing: { label: 'בהדפסה',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  ready:    { label: 'מוכן',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  rejected: { label: 'נדחה',    color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30' },
};

/** Relative age of a job — "עכשיו" / "לפני X דק׳" / "לפני X שע׳". */
function timeAgo(iso) {
  if (!iso) return '';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'עכשיו';
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  return `לפני ${hr} שע׳`;
}

export default function PrintJobCard({ job, overlayFrameUrl, onUpdate, isNew = false }) {
  const [isActing, setIsActing] = useState(false);
  const [isReprinting, setIsReprinting] = useState(false);
  const [popupError, setPopupError] = useState(false);

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const photoUrl = job.photos?.file_urls?.original ?? job.photos?.file_url;
  const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
  const guestName = job.photos?.guest_name;

  const handleReprint = async () => {
    setIsReprinting(true);
    setPopupError(false);
    try {
      await applyOverlayFrame(photoUrl, overlayFrameUrl);
    } catch (e) {
      if (e.message === 'POPUP_BLOCKED') setPopupError(true);
    } finally {
      setIsReprinting(false);
    }
  };

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
    <div
      className={`bg-white/5 border rounded-2xl overflow-hidden flex flex-col transition-all ${isSettled ? 'opacity-60' : ''} ${isNew ? 'border-yellow-400/70 ring-2 ring-yellow-400/40' : 'border-white/10'}`}
      style={isNew ? { boxShadow: '0 0 22px rgba(250,204,21,0.25)' } : undefined}
      dir="rtl"
    >
      {/* Photo */}
      <div className="relative aspect-square bg-white/5">
        {thumbUrl
          ? <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">אין תמונה</div>
        }
        {/* "new" pulse badge */}
        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-400 text-[10px] font-black text-black animate-pulse">
            חדש
          </div>
        )}
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </div>
      </div>

      {/* Info — guest name prominent + relative age */}
      <div className="px-3 py-2 flex-1">
        <p className="text-white/85 text-sm font-semibold truncate">
          {guestName || 'אורח'}
        </p>
        <p className="text-white/35 text-[10px] mt-0.5">
          {timeAgo(job.created_at)} · {new Date(job.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {popupError && <p className="text-orange-400 text-[10px] mt-1">אפשרו חלונות קופצים להדפסה</p>}
      </div>

      {/* Re-print for ready jobs — no status change, printer-jam recovery */}
      {job.status === 'ready' && (
        <div className="px-3 pb-3">
          <button
            onClick={handleReprint}
            disabled={isReprinting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/35 hover:text-white/60 text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {isReprinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
            הדפס שוב
          </button>
        </div>
      )}

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
            <>
              <button
                onClick={() => act('ready')}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                מוכן
              </button>
              {/* Re-print without status change — for printer-jam recovery */}
              <button
                onClick={handleReprint}
                disabled={isReprinting}
                title="הדפס שוב"
                className="w-8 h-8 flex items-center justify-center bg-white/8 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-white/40 hover:text-blue-400 rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                {isReprinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
              </button>
            </>
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
