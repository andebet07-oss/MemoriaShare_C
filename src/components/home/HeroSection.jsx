import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import HeroPhones from './HeroPhones';
import { WhatsAppButton } from './WhatsApp';

// The guest's flow in three steps, under the subtitle.
const FLOW = ['סורקים QR', 'מצלמים מהטלפון', 'אוספים מגנט מודפס'];

/** ctaRef: the buttons row, watched by Home to keep the floating button off it. */
export default function HeroSection({ onCreateEvent, ctaRef }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pb-20 pt-20">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="text-center" dir="rtl">

          {/* Wordmark */}
          <div className="mb-8 flex flex-col items-center gap-3 duration-700 animate-in fade-in">
            <span dir="ltr" className="text-3xl font-semibold text-foreground/90 md:text-4xl">Memoria</span>
            <span className="block h-px w-10 bg-border" />
            <span className="text-sm text-muted-foreground">מגנטים מודפסים באירוע</span>
          </div>

          <h1
            className="mb-6 text-[clamp(2.25rem,11.5vw,3rem)] font-extrabold leading-tight text-foreground delay-100 duration-700 animate-in fade-in slide-in-from-bottom-4 fill-mode-both md:text-7xl"
          >
            הזיכרונות שלכם,
            <br />
            <span className="text-foreground/70">מכל הזוויות</span>
          </h1>

          <p
            className="mx-auto mb-5 max-w-lg text-base font-light leading-relaxed text-muted-foreground delay-200 duration-700 animate-in fade-in fill-mode-both md:text-lg"
          >
            האורחים מצלמים מהטלפון, ואנחנו מדפיסים להם מגנט מעוצב במקום.
            <br className="hidden sm:block" />
            {' '}בלי אפליקציה, עם עמדת הדפסה וצוות שלנו.
          </p>

          <ol aria-label="איך זה עובד" className="mb-14 flex flex-wrap items-center justify-center gap-y-2 text-[13px] text-muted-foreground delay-200 duration-700 animate-in fade-in fill-mode-both sm:text-sm">
            {FLOW.map((step, i) => (
              <li key={step} className={cn('whitespace-nowrap px-2.5 leading-none sm:px-3', i > 0 && 'border-s border-foreground/15', i === 0 && 'ps-0 sm:ps-0', i === FLOW.length - 1 && 'pe-0 sm:pe-0')}>{step}</li>
            ))}
          </ol>

          <HeroPhones />

          <div ref={ctaRef} className="flex flex-col items-center justify-center gap-3 delay-500 duration-700 animate-in fade-in fill-mode-both sm:flex-row">
            <Button size="lg" className="w-full max-w-72 px-12 sm:w-auto" onClick={onCreateEvent}>שריינו תאריך</Button>
            <WhatsAppButton className="w-full max-w-72 px-8 sm:w-auto" />
          </div>

        </div>
      </div>
    </section>
  );
}
