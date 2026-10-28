import { cn } from '@/lib/utils';
import Reveal from './Reveal';
import { FridgeGroup, CameraVisual, PrintedVisual } from './WhyVisuals';

// The events we work, as one plain line under the headline.
const EVENT_TYPES = ['חתונות', 'בר/בת מצווה', 'בריתות', 'אירועי חברה', 'ימי הולדת'];

// Three points, each a big title, one line and a real visual.
const POINTS = [
  { title: 'מגנט מעוצב לכל אורח.', line: 'כל תמונה יוצאת כמגנט בעיצוב של האירוע, עם השמות והתאריך שלכם.', Visual: FridgeGroup },
  { title: 'בלי אפליקציה. בלי הרשמה.', line: 'סורקים QR, מצלמים ושולחים להדפסה. עובד מכל טלפון.', Visual: CameraVisual },
  { title: 'עמדה וצוות, במקום.', line: 'אנחנו מקימים עמדת הדפסה ומדפיסים לאורך כל האירוע. אתם רק נהנים.', Visual: PrintedVisual },
];

/** One point: text beside its visual, sides alternating on desktop (`flip`). */
function Point({ title, line, Visual, flip }) {
  return (
    // The visual takes the larger column, on alternating sides.
    <div className={cn('grid grid-cols-1 items-center gap-8 md:gap-14', flip ? 'md:grid-cols-[6fr_5fr]' : 'md:grid-cols-[5fr_6fr]')}>
      <Reveal>
        <h3 className="text-balance text-[1.875rem] font-bold leading-[1.12] text-foreground md:text-[clamp(2.5rem,3.8vw,3.5rem)] md:leading-[1.08]">{title}</h3>
        <p className="mt-3 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground md:mt-5 md:text-xl">{line}</p>
      </Reveal>
      <Reveal delay={120} className={cn(flip && 'md:order-first')}>
        <Visual />
      </Reveal>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 overflow-x-clip bg-page-alt py-24 md:py-32" dir="rtl">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <Reveal className="mb-14 md:mb-16">
          <h2 className="max-w-4xl text-balance text-[2.25rem] font-bold leading-[1.1] text-foreground md:text-[clamp(3rem,5vw,4.5rem)] md:leading-[1.05]">מזכרת שנשארת על המקרר.</h2>
          {/* Each type carries the dot before it, and the dot that would start a
              line sits in the clipped margin: no line starts or ends with a dot. */}
          <div className="mt-4 overflow-hidden md:mt-6">
            <ul aria-label="סוגי אירועים" className="-ms-6 flex flex-wrap gap-y-1 text-base text-muted-foreground md:text-xl">
              {EVENT_TYPES.map((type) => (
                <li key={type} className="flex items-center">
                  <span aria-hidden="true" className="w-6 text-center text-foreground/30">·</span>
                  {type}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <div className="flex flex-col gap-20 md:gap-24">
          {POINTS.map((p, i) => <Point key={p.title} {...p} flip={i % 2 === 1} />)}
        </div>
      </div>
    </section>
  );
}
