import { cn } from '@/lib/utils';
import { SURFACE } from './guestStyles';

/** Jobs in progress: available / printing / ready, in one card. */
export default function StatStrip({ available, printing, ready }) {
  const stats = [
    { label: 'זמינות', value: available },
    { label: 'בהדפסה', value: printing, dot: 'bg-guest-printing' },
    { label: 'מוכנים', value: ready },
  ];
  return (
    <dl className={cn(SURFACE, 'grid grid-cols-3 divide-x divide-x-reverse divide-guest-line')}>
      {stats.map(({ label, value, dot }) => (
        <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
          <dt className="order-2 text-xs leading-4 text-guest-ink/55">{label}</dt>
          <dd className="order-1 flex items-center gap-2 text-[22px] font-medium leading-7 tabular-nums">
            {value}
            {dot && value > 0 && <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
