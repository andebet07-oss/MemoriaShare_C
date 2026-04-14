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
    premium: true,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32 border-t border-white/5" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12 md:gap-20 max-w-6xl mx-auto">

          {/* Sticky left header */}
          <div className="md:sticky md:top-32 self-start">
            <p className="text-[#b8945f] text-[10px] font-bold tracking-[0.3em] uppercase mb-6">01 · למה Memoria</p>
            <h2 className="font-editorial text-4xl md:text-5xl leading-[1.1] text-[#e8e2d5] mb-4">
              הטכנולוגיה שקופה.
              <br />
              <span className="italic text-[#a89a85]">הרגש נשאר.</span>
            </h2>
          </div>

          {/* Editorial numbered list */}
          <div className="divide-y divide-white/[0.08]">
            {BENEFITS.map((b, i) => (
              <div key={i} className="py-8 flex gap-6 items-start">
                <span
                  className="font-editorial tabular-nums shrink-0 pt-1 leading-none"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', color: 'rgba(255,255,255,0.2)' }}
                >
                  0{i + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-editorial text-[#e8e2d5] text-xl mb-2 flex items-center gap-3 flex-wrap">
                    {b.title}
                    {b.premium && (
                      <span
                        className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 border"
                        style={{ color: 'var(--amber)', borderColor: 'rgba(184,148,95,0.35)' }}
                      >
                        PREMIUM
                      </span>
                    )}
                  </h3>
                  <p className="text-[#a89a85] text-base leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
