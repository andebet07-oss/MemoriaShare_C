import Reveal from './Reveal';

const STEPS = [
  { title: 'סורקים את הקוד', desc: 'על השולחנות מחכה שלט עם QR. סריקה במצלמה, ודף האירוע נפתח.' },
  { title: 'מצלמים ושולחים', desc: 'האורח רואה את המסגרת כבר במצלמה, מצלם ושולח להדפסה בלחיצה.' },
  { title: 'אוספים בעמדה', desc: 'המגנט מודפס במקום, והאורח מקבל עדכון כשהוא מוכן לאיסוף.' },
];

/** The page's one colour band: deep indigo, white text. */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-band py-24 md:py-32" dir="rtl">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-band-light" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <Reveal>
          <h2 className="max-w-3xl text-balance text-[2.25rem] font-bold leading-[1.1] text-foreground md:text-[clamp(3rem,5vw,4.5rem)] md:leading-[1.05]">שלושה צעדים, מגנט אחד.</h2>
        </Reveal>

        <ol className="mt-14 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-3 md:gap-14">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 90}>
              <span aria-hidden="true" className="mb-6 block text-6xl font-light leading-none tabular-nums text-indigo-300 md:text-7xl">
                <bdi>{String(i + 1).padStart(2, '0')}</bdi>
              </span>
              <h3 className="mb-3 text-2xl font-semibold text-foreground md:text-[1.75rem]">{step.title}</h3>
              <p className="max-w-sm text-pretty text-[17px] leading-relaxed text-indigo-100/80 md:text-lg">{step.desc}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
