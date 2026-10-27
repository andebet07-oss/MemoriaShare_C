import { Button } from '@/components/ui/button';
import HeroPhones from './HeroPhones';

export default function HeroSection({ onCreateEvent }) {
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
            className="mx-auto mb-14 max-w-lg text-base font-light leading-relaxed text-muted-foreground delay-200 duration-700 animate-in fade-in fill-mode-both md:text-lg"
          >
            האורחים מצלמים מהטלפון, ואנחנו מדפיסים להם מגנט מעוצב במקום.
            <br className="hidden sm:block" />
            {' '}בלי אפליקציה, עם עמדת הדפסה וצוות שלנו.
          </p>

          <HeroPhones />

          <div className="flex justify-center delay-500 duration-700 animate-in fade-in fill-mode-both">
            <Button size="lg" className="px-12" onClick={onCreateEvent}>שריינו תאריך</Button>
          </div>

        </div>
      </div>
    </section>
  );
}
