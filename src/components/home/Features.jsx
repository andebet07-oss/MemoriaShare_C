import React from "react";
import { Download, Zap, Lock, QrCode, Smartphone, Magnet } from "lucide-react";

const BENEFITS = [
  {
    icon: QrCode,
    gradient: "from-violet-500/15 to-violet-500/5",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    title: "בלי אפליקציה, בלי הרשמה",
    desc: "האורחים סורקים QR מהמצלמה ומעלים תמונות מיד — שום התקנה, שום סיסמה.",
  },
  {
    icon: Zap,
    gradient: "from-yellow-500/15 to-yellow-500/5",
    border: "border-yellow-500/20",
    iconColor: "text-yellow-400",
    title: "גלריה חיה בזמן אמת",
    desc: "כל תמונה מופיעה מיידית לכל המוזמנים. ראו את האירוע מתפתח מכל הזוויות בו-זמנית.",
  },
  {
    icon: Lock,
    gradient: "from-emerald-500/15 to-emerald-500/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    title: "פרטיות ואבטחה מלאה",
    desc: "הגלריה שלכם מוגנת בקוד PIN פרטי. בטוח ומסודר הרבה יותר מקבוצת וואטסאפ.",
  },
  {
    icon: Download,
    gradient: "from-blue-500/15 to-blue-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    title: "הורדה מלאה בקליק",
    desc: "אחרי האירוע, כל הגלריה אצלכם בקובץ אחד. כל התמונות, לנצח.",
  },
  {
    icon: Smartphone,
    gradient: "from-pink-500/15 to-pink-500/5",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
    title: "עובד על כל טלפון",
    desc: "אייפון, אנדרואיד, גרסה ישנה — לא משנה. כל אורח יכול לצלם ולשתף.",
  },
  {
    icon: Magnet,
    gradient: "from-violet-600/20 to-violet-900/10",
    border: "border-violet-500/30",
    iconColor: "text-violet-300",
    title: "מגנטים מודפסים חי",
    desc: "שדרגו לחוויה פרמיום — האורחים מצלמים והמגנטים מודפסים ממש באירוע.",
    premium: true,
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
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${b.gradient} border ${b.border} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
            >
              {b.premium && (
                <span className="absolute top-4 left-4 text-[9px] font-bold tracking-widest text-violet-400 uppercase bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-0.5">
                  Premium
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${b.iconColor}`}>
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base mb-2">{b.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
