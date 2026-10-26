import { useState } from 'react';
import { Printer, CheckCircle2, X, Loader2, Minus, Plus, Users, Crop, Refrigerator } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { printAndAdvance, setJobStatus, stationError } from '@/lib/printStation';
import { HAS_REAL_FACE_ENGINE } from '@/hooks/useFaceCrop';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/system/StatusBadge';

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
 * chip (hidden until a real face engine exists), "backup copy for the hosts'
 * fridge" toggle, and crop editing on top of the classic print/ready/reject/reprint actions. Backup is an EPHEMERAL +1
 * applied only at print time (never persisted → never double-counts on re-render).
 */
export default function ProJobCard({ job, event, isNew = false, isSelected = false, onUpdate, onEditCrop }) {
  const [isActing, setIsActing] = useState(false);
  const [isReprinting, setIsReprinting] = useState(false);
  const [backup, setBackup] = useState(false);

  const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
  const guestName = job.photos?.guest_name;
  const copies = job.copies ?? 1;
  const effectiveCopies = clampCopies(copies + (backup ? 1 : 0));
  const canCrop = !!job.raw_photo_url;
  const isSettled = job.status === 'ready' || job.status === 'rejected';

  const changeCopies = async (delta) => {
    try {
      onUpdate?.(await memoriaService.printJobs.update(job.id, { copies: clampCopies(copies + delta) }));
    } catch (err) {
      stationError('copiesFailed', err, { jobId: job.id });
    }
  };

  // Print effectiveCopies magnets; `advance` moves pending → printing. Failures
  // leave the status unchanged (printStation toasts the operator).
  const doPrint = async ({ advance = false } = {}) => {
    const setBusy = advance ? setIsActing : setIsReprinting;
    setBusy(true);
    try {
      const updated = await printAndAdvance({ job, event, copies: effectiveCopies, advance });
      if (updated) onUpdate?.(updated);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    setIsActing(true);
    try {
      const updated = await setJobStatus(job, status);
      if (updated) onUpdate?.(updated);
    } finally {
      setIsActing(false);
    }
  };

  // Print Station is read at a distance on a tablet: one size step up (CLAUDE.md §0.6).
  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden flex flex-col transition-colors ${isSettled ? 'opacity-60' : ''} ${
        isSelected ? 'border-brand ring-2 ring-brand/40'
        : isNew ? 'border-status-pending/70 ring-2 ring-status-pending/40' : 'border-border'
      }`}
      dir="rtl"
    >
      {/* The finished magnet, whole (portrait or landscape) */}
      <div className="relative aspect-square bg-secondary">
        {thumbUrl
          ? <img src={thumbUrl} className="w-full h-full object-contain p-3 drop-shadow-lg" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">אין תמונה</div>
        }
        {isNew && (
          <div className="absolute top-2 left-2 h-8 px-3 flex items-center rounded-full bg-status-pending text-background text-sm font-bold animate-pulse">
            חדש
          </div>
        )}
        <StatusBadge status={job.status} className="absolute top-2 right-2 h-8 text-sm backdrop-blur" />
        {/* Face-count chip */}
        {HAS_REAL_FACE_ENGINE && job.face_count != null && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 h-8 px-3 rounded-full bg-background/70 border border-border text-sm font-semibold text-foreground">
            <Users className="w-4 h-4" /> <span className="tabular-nums">{job.face_count}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-2 flex-1">
        <p className="text-lg font-semibold text-foreground truncate">{guestName || 'אורח'}</p>
        <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
          {timeAgo(job.created_at)} · {new Date(job.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Copies stepper + backup toggle (editable while not settled) */}
      {!isSettled && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">עותקים</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon-sm" onClick={() => changeCopies(-1)} disabled={copies <= 1} aria-label="פחות עותקים">
                <Minus />
              </Button>
              <span className="min-w-[1.75rem] text-center text-lg font-semibold tabular-nums text-foreground">{copies}</span>
              <Button variant="secondary" size="icon-sm" onClick={() => changeCopies(1)} disabled={copies >= 20} aria-label="עוד עותקים">
                <Plus />
              </Button>
            </div>
          </div>
          <button onClick={() => setBackup(b => !b)}
            className={`w-full h-10 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl border transition-colors ${
              backup ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}>
            <Refrigerator className="w-4 h-4" />
            עותק גיבוי למקרר {backup ? `(+1 → ${effectiveCopies})` : ''}
          </button>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => canCrop && onEditCrop?.(job)} disabled={!canCrop}
            title={canCrop ? 'ערוך חיתוך' : 'אין תמונת מקור לחיתוך'}>
            <Crop />
            {job.crop_config ? 'ערוך חיתוך ✓' : 'חיתוך חכם'}
          </Button>
        </div>
      )}

      {/* Re-print for ready jobs — no status change, printer-jam recovery */}
      {job.status === 'ready' && (
        <div className="px-4 pb-4">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => doPrint()} disabled={isReprinting}>
            {isReprinting ? <Loader2 className="animate-spin" /> : <Printer />}
            הדפס שוב
          </Button>
        </div>
      )}

      {/* Actions */}
      {!isSettled && (
        <div className="px-4 pb-4 flex gap-2">
          {job.status === 'pending' && (
            <Button className="flex-1 text-base" onClick={() => doPrint({ advance: true })} disabled={isActing}>
              {isActing ? <Loader2 className="animate-spin" /> : <Printer />}
              הדפס {effectiveCopies > 1 ? `×${effectiveCopies}` : ''}
            </Button>
          )}
          {job.status === 'printing' && (
            <>
              <Button className="flex-1 text-base" onClick={() => changeStatus('ready')} disabled={isActing}>
                {isActing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                מוכן
              </Button>
              <Button variant="secondary" size="icon" onClick={() => doPrint()} disabled={isReprinting} title="הדפס שוב" aria-label="הדפס שוב">
                {isReprinting ? <Loader2 className="animate-spin" /> : <Printer />}
              </Button>
            </>
          )}
          <Button variant="destructive" size="icon" onClick={() => changeStatus('rejected')} disabled={isActing} aria-label="דחה">
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
