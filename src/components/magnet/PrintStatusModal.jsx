import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GUEST_STATUS, guestStatus, jobThumb, formatTime, ICON } from '@/components/magnet/guest/guestStyles';

const GROUPS = [
  { status: 'ready', title: 'מוכנים לאיסוף' },
  { status: 'printing', title: 'בהדפסה' },
  { status: 'rejected', title: 'נדחו' },
];

function JobRow({ job }) {
  const key = guestStatus(job.status);
  const status = GUEST_STATUS[key];
  const src = jobThumb(job);
  return (
    <li className="flex items-center gap-3 py-2">
      <div className={cn('flex h-[53px] w-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-white', key === 'rejected' && 'opacity-40')}>
        {src && <img src={src} alt="" loading="lazy" className="size-full object-contain" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-medium leading-5">
          <span aria-hidden className={cn('size-1.5 rounded-full', status.dot)} />
          {status.label}
        </p>
        {key === 'rejected' && <p className="text-xs leading-4 text-guest-ink/70">ההדפסה חזרה למכסה</p>}
      </div>
      <time dateTime={job.created_at} className="shrink-0 text-xs leading-4 tabular-nums text-guest-ink/55">
        {formatTime(job.created_at)}
      </time>
    </li>
  );
}

/**
 * "ההדפסות שלי": the guest's magnets as a bottom sheet, grouped ready →
 * printing → rejected, newest first in each group. Closes on the X, the
 * backdrop or Escape.
 */
export default function PrintStatusModal({ printJobs, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Focus the close button once on open; Escape closes.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = GROUPS
    .map((g) => ({ ...g, jobs: printJobs.filter((j) => guestStatus(j.status) === g.status) }))
    .filter((g) => g.jobs.length > 0);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9998] flex flex-col justify-end bg-guest-bg/70 font-heebo text-guest-ink duration-200 animate-in fade-in motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-status-title"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border-t border-guest-line bg-guest-bg duration-300 ease-out animate-in slide-in-from-bottom-8 motion-reduce:animate-none"
      >
        <header className="flex items-center justify-between gap-3 py-2 pe-2 ps-5">
          <h2 id="print-status-title" className="text-[15px] font-medium leading-5">
            ההדפסות שלי <span className="text-guest-ink/55">· <bdi className="tabular-nums">{printJobs.length}</bdi></span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex size-11 items-center justify-center rounded-2xl text-guest-ink/70 active:bg-guest-ink/10"
          >
            <X {...ICON} className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {groups.length === 0 && <p className="py-10 text-center text-[13px] text-guest-ink/70">אין הדפסות עדיין</p>}
          {groups.map((g) => (
            <section key={g.status} aria-label={g.title} className="border-t border-guest-line py-3 first:border-t-0 first:pt-1">
              <h3 className="text-xs leading-4 text-guest-ink/55">{g.title}</h3>
              <ul className="mt-1">{g.jobs.map((job) => <JobRow key={job.id} job={job} />)}</ul>
            </section>
          ))}
        </div>

        <p className="border-t border-guest-line px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 text-center text-xs leading-4 text-guest-ink/55">
          הסטטוס מתעדכן בזמן אמת
        </p>
      </div>
    </div>
  );
}
