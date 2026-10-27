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
      <div className={cn('absolute -inset-10 -z-10 rounded-full blur-[60px]', center ? 'bg-foreground/15' : 'bg-foreground/[0.04]')} />
      <div
        className={cn(
          'relative rounded-[min(2.8rem,9vw)] border border-foreground/20 bg-cool-950 shadow-card-dark md:rounded-[2.8rem]',
          // Phones: sized to the screen width so the group fits (see HeroSection). md and up: fixed sizes.
          center
            ? 'aspect-[176/348] w-[min(38vw,176px)] p-2.5 md:aspect-auto md:h-[512px] md:w-64'
            : 'aspect-[1/2] w-[min(28vw,144px)] p-2 md:aspect-auto md:h-[416px] md:w-52',
        )}
      >
        <div ref={ref} className="relative h-full w-full overflow-hidden rounded-[min(2.3rem,7.4vw)] border border-foreground/10 bg-cool-950 md:rounded-[2.3rem]">
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
