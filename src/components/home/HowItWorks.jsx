import React from "react";

const STEPS = [
  {
    number: "01",
    title: "סורקים את הברקוד",
    desc: "המארח שולח קוד QR לאורחים. סריקה מהירה מהמצלמה — שום הורדה, שום הרשמה.",
  },
  {
    number: "02",
    title: "מצלמים ומשתפים",
    desc: "האורחים מצלמים מהאירוע ומעלים ישירות — כל טלפון, כל רגע, כל זווית.",
  },
  {
    number: "03",
    title: "נהנים מגלריה חיה",
    desc: "כל התמונות מתכנסות בזמן אמת. אחרי האירוע — מורידים הכל בקליק אחד. רוצים מגנטים מודפסים? יש גם את זה.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 border-t border-border" dir="rtl">
      <div className="container mx-auto px-6">

        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-indigo-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-5"><bdi>02</bdi> · איך זה עובד</p>
            <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-foreground/90">
              שלושה שלבים.
              <br />
              <span className="italic text-muted-foreground">חווייה שלמה.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-12">
            {STEPS.map((step, i) => (
              <div key={i} className="py-10 md:py-0 border-b md:border-b-0 border-border last:border-0">
                <span
                  className="font-playfair leading-none block mb-5 text-indigo-500/60"
                  style={{ fontSize: 'clamp(3.5rem, 8vw, 5rem)' }}
                >
                  <bdi>{step.number}</bdi>
                </span>
                <div className="h-px w-10 bg-foreground/15 mb-6" />
                <h3 className="font-playfair text-foreground/90 text-2xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
