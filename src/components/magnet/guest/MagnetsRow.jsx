import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GUEST_STATUS, guestStatus, jobThumb, ICON } from './guestStyles';

/** One magnet: the stored composite as a small polaroid + its status. */
function MagnetThumb({ job }) {
  const [landscape, setLandscape] = useState(false);
  const status = GUEST_STATUS[guestStatus(job.status)];
  const src = jobThumb(job);
  return (
    <li className="flex shrink-0 snap-start flex-col items-center justify-end gap-1.5">
      <div
        className={cn(
          'overflow-hidden rounded-[2px] bg-white',
          landscape ? 'h-16 w-[85px]' : 'h-[85px] w-16',
          job.status === 'rejected' && 'opacity-40',
        )}
      >
        {src && (
          <img
            src={src}
            alt=""
            loading="lazy"
            onLoad={(e) => setLandscape(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)}
            className="size-full object-cover"
          />
        )}
      </div>
      <span className="flex items-center gap-1 text-[11px] leading-4 text-guest-ink/70">
        <span aria-hidden className={cn('size-1.5 rounded-full', status.dot)} />
        {status.label}
      </span>
    </li>
  );
}

/** A free print: a quiet empty slot that opens the camera. */
function EmptySlot({ onClick }) {
  return (
    <li className="flex shrink-0 snap-start flex-col items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label="צילום חדש"
        className="flex h-[85px] w-16 items-center justify-center rounded-[2px] border border-guest-line bg-guest-raised text-guest-ink/55 transition-colors duration-200 active:bg-guest-ink/10"
      >
        <Plus {...ICON} className="size-4" />
      </button>
      <span aria-hidden className="h-4" />
    </li>
  );
}

/**
 * The guest's magnets as a row of polaroids, newest first, then the remaining
 * quota as empty slots. More than fit → the row scrolls sideways (the page
 * never scrolls).
 */
export default function MagnetsRow({ jobs, used, quota, remaining, onShowAll, onCapture }) {
  return (
    <section aria-labelledby="guest-magnets">
      <div className="flex items-center justify-between">
        <h2 id="guest-magnets" className="text-[15px] font-medium leading-5">
          המגנטים שלי <span className="text-guest-ink/55">· <bdi className="tabular-nums">{used}</bdi> מתוך <bdi className="tabular-nums">{quota}</bdi></span>
        </h2>
        <button
          type="button"
          onClick={onShowAll}
          className="-my-3 -me-2 px-2 py-3 text-[13px] font-medium leading-5 text-guest-ink/70 active:text-guest-ink"
        >
          הצגת הכל
        </button>
      </div>
      <ul className="-mx-5 mt-3 flex items-end gap-2 overflow-x-auto scroll-px-5 px-5 [scrollbar-width:none] snap-x [&::-webkit-scrollbar]:hidden">
        {jobs.map((job) => <MagnetThumb key={job.id} job={job} />)}
        {Array.from({ length: remaining }, (_, i) => <EmptySlot key={`slot-${i}`} onClick={onCapture} />)}
      </ul>
    </section>
  );
}
