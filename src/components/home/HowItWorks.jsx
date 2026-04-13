import React from "react";
import { QrCode, Camera, Sparkles } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: QrCode,
    title: "סורקים את הברקוד",
    desc: "המארח שולח קוד QR לאורחים. סריקה מהירה מהמצלמה — שום הורדה, שום הרשמה.",
    iconColor: "text-violet-400",
    border: "border-violet-500/30",
    glow: "bg-violet-500/10",
  },
  {
    number: "02",
    icon: Camera,
    title: "מצלמים ומשתפים",
    desc: "האורחים מצלמים מהאירוע ומעלים ישירות — כל טלפון, כל רגע, כל זווית.",
    iconColor: "text-white",
    border: "border-white/20",
    glow: "bg-white/5",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "נהנים מגלריה חיה",
    desc: "כל התמונות מתכנסות בזמן אמת. אחרי האירוע — מורידים הכל בקליק אחד. רוצים מגנטים מודפסים? יש גם את זה.",
    iconColor: "text-violet-400",
    border: "border-violet-500/30",
    glow: "bg-violet-500/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24" dir="rtl">
      <div className="container mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">איך זה עובד?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            שלושה שלבים. חווייה שלמה.
          </h2>
          <p className="text-white/40 text-base">פשוט כמו שצריך להיות.</p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">

          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-8 right-[18%] left-[18%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl ${step.glow} border ${step.border} flex items-center justify-center mb-5 relative z-10 shrink-0`}>
                <step.icon className={`w-7 h-7 ${step.iconColor}`} />
              </div>
              <span className="text-white/15 text-[10px] font-black tracking-[0.2em] mb-2 uppercase">{step.number}</span>
              <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed max-w-[220px]">{step.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
