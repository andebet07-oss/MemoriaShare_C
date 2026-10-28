import SectionHeading from './SectionHeading';

const BENEFITS = [
  { title: 'מגנט מעוצב לכל אורח', desc: 'כל תמונה יוצאת כמגנט פולרואיד בעיצוב של האירוע, עם השמות והתאריך שלכם.' },
  { title: 'בלי אפליקציה, בלי הרשמה', desc: 'סורקים QR, מצלמים ושולחים להדפסה. עובד על כל טלפון.' },
  { title: 'עמדת הדפסה וצוות מקצועי', desc: 'אנחנו מגיעים, מקימים עמדה ומדפיסים לאורך כל האירוע. אתם רק נהנים.' },
  { title: 'מכסה לכל אורח', desc: 'אתם קובעים כמה מגנטים כל אורח מקבל, כך שכולם נהנים.' },
  { title: 'עיצוב לבחירתכם', desc: 'מבחר עיצובי פולרואיד נקיים, בעברית או באנגלית.' },
  { title: 'איכות צילום', desc: 'הדפסה מקצועית בגודל 7.5 × 10 ס״מ, שנראית מצוין גם שנים אחרי.' },
];

// The events we work, as a quiet row under the heading (not links, not filters).
const EVENT_TYPES = ['חתונות', 'בר/בת מצווה', 'בריתות', 'אירועי חברה', 'ימי הולדת'];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border py-24 md:py-32" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_2fr] md:gap-20">

          <div className="self-start md:sticky md:top-32">
            <SectionHeading number="01" label="למה Memoria" title="מזכרת שנשארת על המקרר." />
            <ul aria-label="סוגי אירועים" className="mt-6 flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <li key={type} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">{type}</li>
              ))}
            </ul>
          </div>

          <ol className="divide-y divide-border">
            {BENEFITS.map((b, i) => (
              <li key={b.title} className="flex items-start gap-6 py-8">
                <span className="shrink-0 pt-0.5 text-xl font-medium leading-none tabular-nums text-brand md:text-2xl">
                  <bdi>{String(i + 1).padStart(2, '0')}</bdi>
                </span>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{b.title}</h3>
                  <p className="text-base font-light leading-relaxed text-muted-foreground">{b.desc}</p>
                </div>
              </li>
            ))}
          </ol>

        </div>
      </div>
    </section>
  );
}
