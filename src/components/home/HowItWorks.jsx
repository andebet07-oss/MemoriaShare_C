import SectionHeading from './SectionHeading';

const STEPS = [
  { title: 'סורקים את הקוד', desc: 'על השולחנות מחכה שלט עם QR. סריקה במצלמה, ודף האירוע נפתח.' },
  { title: 'מצלמים ושולחים', desc: 'האורח רואה את המסגרת כבר במצלמה, מצלם ושולח להדפסה בלחיצה.' },
  { title: 'אוספים בעמדה', desc: 'המגנט מודפס במקום, והאורח מקבל עדכון כשהוא מוכן לאיסוף.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-border py-24 md:py-32" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading number="02" label="איך זה עובד" title="שלושה צעדים, מגנט אחד." className="mb-16" />

          <ol className="grid grid-cols-1 gap-0 md:grid-cols-3 md:gap-12">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-b border-border py-10 last:border-0 md:border-b-0 md:py-0">
                <span className="mb-5 block text-6xl font-light leading-none tabular-nums text-brand/80 md:text-7xl">
                  <bdi>{String(i + 1).padStart(2, '0')}</bdi>
                </span>
                <div className="mb-6 h-px w-10 bg-foreground/15" />
                <h3 className="mb-3 text-2xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-base font-light leading-relaxed text-muted-foreground">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
