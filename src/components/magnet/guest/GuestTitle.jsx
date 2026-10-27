import { useRef } from 'react';
import { Camera, Check, Magnet } from 'lucide-react';
import { useElementSize } from '@/hooks/useElementSize';
import { useEventTitle } from '@/hooks/useEventTitle';
import { cn } from '@/lib/utils';
import { formatGuestDate, ICON } from './guestStyles';

/**
 * The event title over the bottom of the hero photo, start-aligned: the
 * welcome line, the names in the magnet template's font, and the date (only
 * what the event stores). Its fade melts the photo into the sheet and keeps
 * the text readable over any cover. `children` goes under the date.
 */
export default function GuestTitle({ event, children }) {
  const ref = useRef(null);
  const { width } = useElementSize(ref);
  const title = useEventTitle(event, width);
  const date = formatGuestDate(event.date);

  return (
    <div className="relative px-5">
      <div aria-hidden className="absolute inset-x-0 -top-24 bottom-0 bg-guest-fade-up" />
      <div ref={ref} className="relative mx-auto w-full max-w-md">
        <p className="text-[13px] leading-5 text-guest-ink/70">ברוכים הבאים לאירוע של</p>
        <h1
          style={title.style}
          className={cn(
            'mt-1 leading-[1.12] text-guest-ink transition-opacity duration-300 ease-out motion-reduce:transition-none',
            title.ready ? 'opacity-100' : 'opacity-0',
          )}
        >
          {title.lines.map((line) => <span key={line} className="block"><bdi>{line}</bdi></span>)}
        </h1>
        {date && <p className="mt-1 text-[13px] leading-5 text-guest-ink/60">{date}</p>}
        {children}
      </div>
    </div>
  );
}

const STEPS = [
  { Icon: Camera, label: 'מצלמים' },
  { Icon: Check, label: 'מאשרים' },
  { Icon: Magnet, label: 'אוספים מגנט בעמדה' },
];

/** First visit: how it works, as one quiet line. */
export function FlowLine() {
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5 text-guest-ink/70">
      {STEPS.map(({ Icon, label }, i) => (
        <li key={label} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-guest-ink/40">·</span>}
          <span className="flex items-center gap-1.5">
            <Icon {...ICON} className="size-3.5" />
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
