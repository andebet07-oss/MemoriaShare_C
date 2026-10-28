import { useRef } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import { cn } from '@/lib/utils';

const VIRTUAL_WIDTH = 375; // the screens are laid out as on a 375px-wide phone, then scaled

/**
 * A phone in the hero. Its screen renders real app screens at phone size and
 * scales them to fit. The scaled layer is transformed, so it is also the
 * containing block for the screens' `fixed inset-0` roots. Screens are inert
 * (no focus, no clicks) and hidden from assistive tech: they are pictures.
 */
export default function PhoneFrame({ center = false, className, label, children }) {
  const ref = useRef(null);
  const size = useElementSize(ref);
  // The screen's inner box (its 1px border excluded).
  const width = Math.max(0, size.width - 2);
  const height = Math.max(0, size.height - 2);
  const scale = width ? width / VIRTUAL_WIDTH : 0;

  return (
    <figure className={cn('relative shrink-0', className)} aria-label={label}>
      {/* Soft indigo light behind the phone */}
      <div className={cn('absolute -inset-10 -z-10 rounded-full blur-[60px]', center ? 'bg-brand/25' : 'bg-brand/[0.08]')} />
      <div
        className={cn(
          'relative rounded-[2.8rem] border border-foreground/20 bg-cool-950 shadow-card-dark',
          // One size at every width: on phones, HeroPhones scales the whole group.
          center ? 'h-[512px] w-64 p-2.5' : 'h-[416px] w-52 p-2',
        )}
      >
        <div ref={ref} className="relative h-full w-full overflow-hidden rounded-[2.3rem] border border-foreground/10 bg-cool-950">
          {scale > 0 && (
            <div
              inert=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 origin-top-right select-none"
              style={{ width: VIRTUAL_WIDTH, height: height / scale, transform: `scale(${scale})` }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
