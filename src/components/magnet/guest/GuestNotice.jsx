import { Check, CircleAlert, RotateCw, Undo2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ICON } from './guestStyles';

const NOTICES = {
  ready: {
    Icon: Check, badge: 'bg-guest-ready/15 text-guest-ready',
    title: (n) => (n > 1 ? `${n} מגנטים מוכנים` : 'מגנט מוכן'),
    body: 'גשו לעמדת המגנטים לאיסוף',
  },
  rejected: {
    Icon: Undo2, badge: 'bg-guest-rejected/15 text-guest-rejected',
    title: (n) => (n > 1 ? `${n} הדפסות נדחו` : 'הדפסה אחת נדחתה'),
    body: (n) => (n > 1 ? 'ההדפסות חזרו למכסה שלך' : 'ההדפסה חזרה למכסה שלך'),
  },
  offline: {
    Icon: WifiOff, badge: 'bg-guest-ink/10 text-guest-ink/70',
    title: () => 'אין חיבור לאינטרנט',
    body: 'הסטטוס יתעדכן כשהחיבור יחזור',
  },
  error: {
    Icon: CircleAlert, badge: 'bg-guest-ink/10 text-guest-ink/70',
    title: () => 'לא הצלחנו לטעון את ההדפסות',
    body: 'בדקו את החיבור ונסו שוב',
  },
};

/**
 * One calm status row at the top of the sheet: a round badge, a title and a
 * line of body text. Offline and error add a retry action.
 */
export default function GuestNotice({ kind, count = 1, onRetry }) {
  const n = NOTICES[kind];
  const retry = (kind === 'offline' || kind === 'error') && onRetry;
  return (
    <div
      role="status"
      className="flex items-center gap-3 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', n.badge)}>
        <n.Icon {...ICON} className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-5">{n.title(count)}</p>
        <p className="text-[13px] leading-5 text-guest-ink/70">{typeof n.body === 'function' ? n.body(count) : n.body}</p>
      </div>
      {retry && (
        <button
          type="button"
          onClick={onRetry}
          className="-me-2 flex h-11 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-[13px] font-medium text-guest-ink active:bg-guest-ink/10"
        >
          <RotateCw {...ICON} className="size-4" />
          נסו שוב
        </button>
      )}
    </div>
  );
}
