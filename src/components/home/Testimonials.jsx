import React from "react";

const testimonials = [
  {
    name: "יעל ויונתן",
    event: "חתונה · 320 אורחים",
    text: "קיבלנו מאות תמונות מדהימות מהאורחים שלנו. זה היה פשוט, אלגנטי והוסיף כל כך הרבה לאירוע.",
    featured: true,
  },
  {
    name: "דניאל לוי",
    event: "בר מצווה · 180 אורחים",
    text: "הדרך הכי נוחה לאסוף תמונות מכל המשפחה. כולם השתתפו.",
  },
  {
    name: "מיכל כהן",
    event: "אירוע פרטי · 85 אורחים",
    text: "האורחים התלהבו מהפשטות. במקום לרדוף אחרי תמונות, הכל היה שם.",
  },
];

export default function Testimonials() {
  const [featured, ...secondary] = testimonials;

  return (
    <section id="testimonials" className="py-24 md:py-32 border-t border-border" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-indigo-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-5"><bdi>03</bdi> · לקוחות</p>
            <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-foreground/90">
              הם כבר
              <br />
              <span className="italic text-muted-foreground">השתמשו ב-Memoria.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-[3fr_2fr] gap-12 md:gap-16 items-start">

            {/* Featured — large pull quote */}
            <blockquote className="relative">
              <span
                className="font-playfair absolute leading-none select-none pointer-events-none text-indigo-500/25"
                style={{ fontSize: '8rem', top: '-2.5rem', right: '-1rem' }}
                aria-hidden="true"
              >
                "
              </span>
              <p
                className="font-playfair leading-[1.45] text-foreground/90 mb-8 relative z-10"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
              >
                {featured.text}
              </p>
              <footer>
                <div className="h-px w-8 bg-indigo-500/50 mb-4" />
                <span className="text-sm font-semibold text-foreground/70">— {featured.name}</span>
                <span className="text-muted-foreground text-sm mx-2">·</span>
                <span className="text-muted-foreground text-sm">{featured.event}</span>
              </footer>
            </blockquote>

            {/* Secondary — compact */}
            <div className="space-y-8 pt-4 md:pt-6 border-t md:border-t-0 border-border">
              {secondary.map((t, i) => (
                <div key={i} className="border-b border-border pb-8 last:border-0 last:pb-0">
                  <p className="text-muted-foreground text-base leading-relaxed mb-4 italic font-light">"{t.text}"</p>
                  <div>
                    <span className="text-sm font-semibold text-foreground/70">{t.name}</span>
                    <span className="text-muted-foreground/60 text-xs mx-2">·</span>
                    <span className="text-muted-foreground/60 text-xs">{t.event}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
