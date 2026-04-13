import React from "react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "יעל ויונתן",
      event: "חתונה · 320 אורחים",
      text: "קיבלנו מאות תמונות מדהימות מהאורחים שלנו. זה היה פשוט, אלגנטי והוסיף כל כך הרבה לאירוע.",
    },
    {
      name: "דניאל לוי",
      event: "בר מצווה · 180 אורחים",
      text: "הדרך הכי נוחה לאסוף תמונות מכל המשפחה. כולם השתתפו וזה יצר מזכרת מדהימה.",
    },
    {
      name: "מיכל כהן",
      event: "אירוע פרטי · 85 אורחים",
      text: "האורחים התלהבו מהפשטות ומהרעיון. במקום לרדוף אחרי תמונות, הכל היה שם.",
    }
  ];

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-b from-transparent to-black/30" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">מה אומרים עלינו?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">הם כבר השתמשו ב-Memoria</h2>
          <p className="text-white/40 text-base">אלפי לקוחות מרוצים לא טועים.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/70 backdrop-blur-sm rounded-2xl p-7 border border-white/[0.07] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-0.5">
              <span className="text-white/10 text-5xl font-serif leading-none select-none block mb-2">"</span>
              <p className="text-white/70 text-base mb-6 leading-relaxed">{testimonial.text}</p>
              <div className="border-t border-white/[0.07] pt-4">
                <div className="font-bold text-white text-sm">{testimonial.name}</div>
                <div className="text-white/35 text-xs mt-0.5">{testimonial.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
