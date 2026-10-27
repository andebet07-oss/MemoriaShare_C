import { Camera, CircleCheck, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SURFACE, ICON } from './guestStyles';

const PRESS = 'transition-[transform,background-color] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100';

/**
 * The sheet's actions, pinned to its bottom: the camera CTA and, once the
 * guest has jobs, a square button for "ההדפסות שלי".
 * capture: 'open' → the CTA; 'used' → a calm explanation in its place;
 * 'unknown' (the jobs failed to load) → no CTA until a retry succeeds.
 */
export default function GuestActions({ capture, onCapture, onStatus }) {
  if (capture === 'unknown' && !onStatus) return null;
  return (
    <div className="mt-auto flex gap-2 pt-5">
      {capture === 'open' && (
        <button
          type="button"
          onClick={onCapture}
          className={cn('flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-guest-ink text-base font-medium text-guest-bg active:bg-guest-ink/90', PRESS)}
        >
          <Camera {...ICON} className="size-5" />
          צלמו ושלחו להדפסה
        </button>
      )}
      {capture === 'used' && (
        <div role="status" className={cn(SURFACE, 'flex h-[54px] min-w-0 flex-1 items-center gap-3 px-4')}>
          <CircleCheck {...ICON} className="size-5 shrink-0 text-guest-ink/70" />
          <p className="min-w-0 text-[13px] leading-[18px]">
            <span className="block font-medium">ניצלתם את כל ההדפסות</span>
            <span className="block text-guest-ink/70">ניתן לאסוף בעמדת המגנטים</span>
          </p>
        </div>
      )}
      {onStatus && (
        <button
          type="button"
          onClick={onStatus}
          aria-label="ההדפסות שלי"
          title="ההדפסות שלי"
          className={cn(SURFACE, 'flex size-[54px] shrink-0 items-center justify-center text-guest-ink active:bg-guest-ink/10', PRESS)}
        >
          <Images {...ICON} className="size-5" />
        </button>
      )}
    </div>
  );
}
