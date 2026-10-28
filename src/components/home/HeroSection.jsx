import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';
import HeroPhones from './HeroPhones';
import { WhatsAppButton } from './WhatsApp';

// The guest's flow in three steps, under the subtitle.
const FLOW = ['סורקים QR', 'מצלמים מהטלפון', 'אוספים מגנט מודפס'];

// The entrance, once: the headline is there from the first frame (it is the
// page's largest paint, so it never waits on an animation), the lines under it
// fade up, the phones rise (HeroPhones), then the magnets settle. All under
// 1.5s; nothing moves with "reduce motion".
const rise = 'motion-safe:animate-rise';

/** ctaRef: the buttons row, watched by Home to keep the bottom bar off it. */
export default function HeroSection({ onCreateEvent, ctaRef }) {
  const ref = useRef(null);
  const onScreen = useInView(ref);

  return (
    <section
      ref={ref}
      // Off screen, the phones stop drifting.
      data-paused={onScreen ? undefined : ''}
      className="group/hero relative flex min-h-screen items-center justify-center overflow-hidden bg-page pb-20 pt-24 md:pt-36"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-glow-soft" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="text-center" dir="rtl">

          <p className="mb-5 text-sm text-muted-foreground md:text-base">מגנטים מודפסים באירוע</p>

          <h1 className="mb-6 text-[clamp(2.25rem,11.5vw,3rem)] font-extrabold leading-[1.12] text-foreground md:mb-8 md:text-[clamp(4.5rem,7.1vw,6.5rem)] md:leading-[1.02]">
            הזיכרונות שלכם,
            <br />
            <span className="text-foreground/70">מכל הזוויות</span>
          </h1>

          <p className={cn('mx-auto mb-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:mb-6 md:max-w-2xl md:text-[21px]', rise, 'motion-safe:[animation-delay:60ms]')}>
            האורחים מצלמים מהטלפון, ואנחנו מדפיסים להם מגנט מעוצב במקום.
            <br className="hidden sm:block" />
            {' '}בלי אפליקציה, עם עמדת הדפסה וצוות שלנו.
          </p>

          <ol aria-label="איך זה עובד" className={cn('mb-14 flex flex-wrap items-center justify-center gap-y-2 text-xs text-muted-foreground min-[360px]:text-[13px] sm:text-sm md:mb-16 md:text-[15px]', rise, 'motion-safe:[animation-delay:120ms]')}>
            {FLOW.map((step, i) => (
              // Smaller below 360px, so the three steps always fit on one line.
              <li key={step} className={cn('whitespace-nowrap px-1.5 leading-none min-[360px]:px-2.5 sm:px-3', i > 0 && 'border-s border-foreground/15', i === 0 && 'ps-0 min-[360px]:ps-0 sm:ps-0', i === FLOW.length - 1 && 'pe-0 min-[360px]:pe-0 sm:pe-0')}>{step}</li>
            ))}
          </ol>

          <HeroPhones />

          <div ref={ctaRef} className={cn('flex flex-col items-center justify-center gap-3 sm:flex-row', rise, 'motion-safe:[animation-delay:300ms]')}>
            <Button size="lg" className="w-full max-w-72 px-12 sm:w-auto" onClick={onCreateEvent}>שריינו תאריך</Button>
            <WhatsAppButton className="w-full max-w-72 px-8 sm:w-auto" />
          </div>

        </div>
      </div>
    </section>
  );
}
