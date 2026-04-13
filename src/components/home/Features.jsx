import React from "react";
import { Download, Zap, Lock, QrCode, Smartphone, Magnet } from "lucide-react";

const BENEFITS = [
  {
    icon: QrCode,
    title: "בלי אפליקציה, בלי הרשמה",
    desc: "האורחים סורקים QR מהמצלמה ומעלים תמונות מיד — שום התקנה, שום סיסמה.",
  },
  {
    icon: Zap,
    title: "גלריה חיה בזמן אמת",
    desc: "כל תמונה מופיעה מיידית לכל המוזמנים. ראו את האירוע מתפתח מכל הזוויות בו-זמנית.",
  },
  {
    icon: Lock,
    title: "פרטיות ואבטחה מלאה",
    desc: "הגלריה שלכם מוגנת בקוד PIN פרטי. בטוח ומסודר הרבה יותר מקבוצת וואטסאפ.",
  },
  {
    icon: Download,
    title: "הורדה מלאה בקליק",
    desc: "אחרי האירוע, כל הגלריה אצלכם בקובץ אחד. כל התמונות, לנצח.",
  },
  {
    icon: Smartphone,
    title: "עובד על כל טלפון",
    desc: "אייפון, אנדרואיד, גרסה ישנה — לא משנה. כל אורח יכול לצלם ולשתף.",
  },
  {
    icon: Magnet,
    title: "מגנטים מודפסים חי",
    desc: "צוות מקצועי, עמדת הדפסה, מגנטים איכותיים — חוויה שהאורחים לא ישכחו.",
    subtle: true,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">למה Memoria?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            הטכנולוגיה שקופה. הרגש נשאר.
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            פיתחנו כל פרט כדי שהאורחים ייהנו ואתם תקבלו את כל הזיכרונות.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5
                ${b.subtle
                  ? 'bg-white/[0.03] border-violet-500/15 hover:border-violet-500/25 sm:col-span-2 lg:col-span-1'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.12]'
                }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.subtle ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.06] border border-white/[0.08]'}`}>
                  <b.icon className={`w-5 h-5 ${b.subtle ? 'text-violet-400/70' : 'text-white/60'}`} />
                </div>
                {b.subtle && (
                  <span className="text-[10px] font-bold tracking-wider uppercase text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-full mt-2.5">פרמיום</span>
                )}
              </div>
              <h3 className="text-white font-bold text-base mb-2">{b.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
