import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft } from "lucide-react";

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

        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">מוכנים להתחיל?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            כל הזיכרונות שלכם,
            <br />
            במקום אחד
          </h2>
          <p className="text-white/40 text-base">פשוט. אלגנטי. בחינם.</p>
        </div>

        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">

          {/* Primary action */}
          <button
            onClick={handleCreateEventClick}
            className="w-full sm:w-auto px-12 py-4 bg-white text-black font-bold text-base rounded-full hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.12)]"
          >
            צרו אירוע עכשיו — בחינם
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/20 text-xs">או</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Magnet — elegant secondary card */}
          <button
            onClick={() => navigate('/MagnetLead')}
            className="group w-full max-w-sm flex items-center justify-between gap-4 px-6 py-4 bg-white/[0.03] border border-violet-500/15 rounded-2xl hover:border-violet-500/30 hover:bg-white/[0.05] transition-all text-right"
          >
            <div className="text-right">
              <p className="text-white/80 font-semibold text-sm">הדפסת מגנטים חיה באירוע</p>
              <p className="text-white/35 text-xs mt-0.5">שירות פרמיום מנוהל — צוות שלנו אצלכם</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-violet-400/60 group-hover:text-violet-400 group-hover:-translate-x-0.5 transition-all shrink-0" />
          </button>

        </div>
      </div>
    </section>
  );
}
