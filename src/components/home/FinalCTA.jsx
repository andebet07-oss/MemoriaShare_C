import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Magnet, Camera } from "lucide-react";

export default function FinalCTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCreateEventClick = () => {
    if (isAuthenticated) {
      navigate(createPageUrl("CreateEvent"));
    } else {
      const returnUrl = `${window.location.origin}${createPageUrl("CreateEvent")}`;
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl } });
    }
  };

  return (
    <section id="contact" className="py-24" dir="rtl">
      <div className="container mx-auto px-6">

        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">מוכנים להתחיל?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            בחרו את החוויה שמתאימה לכם
          </h2>
          <p className="text-white/40 text-lg">שני מוצרים, תוצאה אחת — אירוע שלא ישכח</p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* MemoriaShare */}
          <button
            onClick={handleCreateEventClick}
            className="group flex flex-col items-start gap-5 p-8 bg-white text-black rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl text-right"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/8 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-black/60" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-xl leading-tight mb-2">אלבום דיגיטלי משותף</p>
              <p className="text-black/50 text-sm leading-relaxed">
                האורחים מצלמים, הכל נשמר אצלכם. גלריה חיה בזמן אמת, הורדה מלאה אחרי האירוע. חינם לתמיד.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-black/55 text-sm font-bold group-hover:gap-3 transition-all">
              יצירת אירוע עכשיו <ArrowLeft className="w-4 h-4" />
            </div>
          </button>

          {/* MemoriaMagnet */}
          <button
            onClick={() => navigate('/MagnetLead')}
            className="group flex flex-col items-start gap-5 p-8 bg-gradient-to-br from-violet-950/80 to-black border border-violet-500/25 rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all text-right relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-transparent pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 relative z-10">
              <Magnet className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="font-extrabold text-xl text-white leading-tight">הדפסת מגנטים חיה</p>
                <span className="text-[9px] font-bold tracking-widest text-violet-400 uppercase bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-0.5">
                  Premium
                </span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed">
                צוות מקצועי שלנו באירוע שלכם. האורחים צולמים, המגנטים מודפסים מיד. יוצאים הביתה עם זיכרון ממשי.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-violet-400 text-sm font-bold group-hover:gap-3 transition-all relative z-10">
              לפרטים ותיאום <ArrowLeft className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>
    </section>
  );
}
