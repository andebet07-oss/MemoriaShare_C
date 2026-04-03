import React from "react";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "יעל ויונתן",
      event: "חתונה",
      text: "קיבלנו מאות תמונות מדהימות מהאורחים שלנו. זה היה פשוט, אלגנטי והוסיף כל כך הרבה לאירוע.",
      rating: 5
    },
    {
      name: "דניאל לוי", 
      event: "בר מצווה",
      text: "הדרך הכי נוחה לאסוף תמונות מכל המשפחה. כולם השתתפו וזה יצר מזכרת מדהימה.",
      rating: 5
    },
    {
      name: "מיכל כהן",
      event: "יום הולדת", 
      text: "האורחים התלהבו מהפשטות ומהרעיון. במקום לרדוף אחרי תמונות, הכל היה שם.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-transparent to-black/30" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-100">הם כבר השתמשו ב-Memoria</h2>
          <p className="text-xl text-gray-400">אלפי לקוחות מרוצים לא טועים.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/70 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-gray-400/20 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-300 fill-gray-300" />
                ))}
              </div>
              <p className="text-lg text-gray-200 mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div className="border-t border-white/10 pt-4">
                <div className="font-bold text-white">{testimonial.name}</div>
                <div className="text-gray-400 text-sm">{testimonial.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}