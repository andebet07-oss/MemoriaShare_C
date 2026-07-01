import { useState } from 'react';
import { Printer, CheckCircle2, X, Loader2, Minus, Plus, Users, Crop, Refrigerator } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { printJob } from '@/lib/magnetPrint';

const STATUS_CONFIG = {
  pending:  { label: 'ממתין',   color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30' },
  printing: { label: 'בהדפסה',  color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30' },
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

const clampCopies = (n) => Math.max(1, Math.min(20, Math.round(n) || 1));

/**
 * ProJobCard — a print job in MagnetProStation. Adds copies stepper, face-count
 * chip, "backup copy for the hosts' fridge" toggle, and crop editing on top of
 * the classic print/ready/reject/reprint actions. Backup is an EPHEMERAL +1
 * applied only at print time (never persisted → never double-counts on re-render).
 */
export default function ProJobCard({ job, event, isNew = false, isSelected = false, onUpdate, onEditCrop }) {
  const [isActing, setIsActing] = useState(false);
  const [isReprinting, setIsReprinting] = useState(false);
  const [popupError, setPopupError] = useState(false);
  const [backup, setBackup] = useState(false);

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
  const guestName = job.photos?.guest_name;
  const copies = job.copies ?? 1;
  const effectiveCopies = clampCopies(copies + (backup ? 1 : 0));
  const canCrop = !!job.raw_photo_url;
  const isSettled = job.status === 'ready' || job.status === 'rejected';

  const persist = async (patch) => {
    try {
      const updated = await memoriaService.printJobs.update(job.id, patch);
      onUpdate?.(updated);
    } catch { /* non-fatal — realtime will reconcile */ }
  };

  const changeCopies = (delta) => persist({ copies: clampCopies(copies + delta) });

  // Print (optionally advancing status). Prints effectiveCopies physical magnets.
  const doPrint = async ({ advanceTo } = {}) => {
    const setBusy = advanceTo ? setIsActing : setIsReprinting;
    setBusy(true);
    setPopupError(false);
    try {
      await printJob({ job, event, copies: effectiveCopies });
    } catch (e) {
      if (e.message === 'POPUP_BLOCKED') { setPopupError(true); setBusy(false); return; }
    }
    try {
      if (advanceTo) {
        const updated = await memoriaService.printJobs.updateStatus(job.id, advanceTo);
        onUpdate?.(updated);
      }
    } catch { /* non-fatal */ } finally {
      setBusy(false);
    }
  };

  const advance = async (status) => {
    setIsActing(true);
    try {
      const updated = await memoriaService.printJobs.updateStatus(job.id, status);
      onUpdate?.(updated);
    } catch { /* non-fatal */ } finally {
      setIsActing(false);
    }
  };

  return (
    <div
      className={`bg-white/5 border rounded-2xl overflow-hidden flex flex-col transition-all ${isSettled ? 'opacity-60' : ''} ${
        isSelected ? 'border-violet-400 ring-2 ring-violet-400/50'
        : isNew ? 'border-yellow-400/70 ring-2 ring-yellow-400/40' : 'border-white/10'
      }`}
      style={isNew && !isSelected ? { boxShadow: '0 0 22px rgba(250,204,21,0.25)' } : undefined}
      dir="rtl"
    >
      {/* Photo */}
      <div className="relative aspect-square bg-white/5">
        {thumbUrl
          ? <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">אין תמונה</div>
        }
        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-400 text-[10px] font-black text-black animate-pulse">
            חדש
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </div>
        {/* Face-count chip */}
        {job.face_count != null && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold text-white/90">
            <Users className="w-3 h-3" /> {job.face_count}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2 flex-1">
        <p className="text-white/85 text-sm font-semibold truncate">{guestName || 'אורח'}</p>
        <p className="text-white/35 text-[10px] mt-0.5">
          {timeAgo(job.created_at)} · {new Date(job.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {popupError && <p className="text-orange-400 text-[10px] mt-1">אפשרו חלונות קופצים להדפסה</p>}
      </div>

      {/* Copies stepper + backup toggle (editable while not settled) */}
      {!isSettled && (
        <div className="px-3 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/45 text-[11px]">עותקים</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => changeCopies(-1)} disabled={copies <= 1} aria-label="פחות עותקים"
                className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center disabled:opacity-30">
                <Minus className="w-3 h-3 text-white/70" />
              </button>
              <span className="min-w-[1.5rem] text-center text-white font-bold tabular-nums text-sm">{copies}</span>
              <button onClick={() => changeCopies(1)} disabled={copies >= 20} aria-label="עוד עותקים"
                className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center disabled:opacity-30">
                <Plus className="w-3 h-3 text-white/70" />
              </button>
            </div>
          </div>
          <button onClick={() => setBackup(b => !b)}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-xl border transition-colors ${
              backup ? 'bg-violet-500/25 border-violet-400/40 text-violet-200' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}>
            <Refrigerator className="w-3 h-3" />
            עותק גיבוי למקרר {backup ? `(+1 → ${effectiveCopies})` : ''}
          </button>
        </div>
      )}

      {/* Crop editor entry */}
      {!isSettled && (
        <div className="px-3 pb-2">
          <button onClick={() => canCrop && onEditCrop?.(job)} disabled={!canCrop}
            title={canCrop ? 'ערוך חיתוך' : 'אין תמונת מקור לחיתוך'}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/45 hover:text-white/75 text-[11px] rounded-xl transition-colors disabled:opacity-30">
            <Crop className="w-3 h-3" />
            {job.crop_config ? 'ערוך חיתוך ✓' : 'חיתוך חכם'}
          </button>
        </div>
      )}

      {/* Re-print for ready jobs — no status change, printer-jam recovery */}
      {job.status === 'ready' && (
        <div className="px-3 pb-3">
          <button onClick={() => doPrint()} disabled={isReprinting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/35 hover:text-white/60 text-xs rounded-xl transition-colors disabled:opacity-50">
            {isReprinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
            הדפס שוב
          </button>
        </div>
      )}

      {/* Actions */}
      {!isSettled && (
        <div className="px-3 pb-3 flex gap-2">
          {job.status === 'pending' && (
            <button onClick={() => doPrint({ advanceTo: 'printing' })} disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
              {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
              הדפס {effectiveCopies > 1 ? `×${effectiveCopies}` : ''}
            </button>
          )}
          {job.status === 'printing' && (
            <>
              <button onClick={() => advance('ready')} disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                מוכן
              </button>
              <button onClick={() => doPrint()} disabled={isReprinting} title="הדפס שוב"
                className="w-8 h-8 flex items-center justify-center bg-white/8 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-white/40 hover:text-blue-400 rounded-xl transition-colors shrink-0 disabled:opacity-50">
                {isReprinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
              </button>
            </>
          )}
          <button onClick={() => advance('rejected')} disabled={isActing}
            className="w-8 h-8 flex items-center justify-center bg-white/8 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/40 hover:text-red-400 rounded-xl transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
