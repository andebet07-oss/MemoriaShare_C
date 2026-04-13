import React from "react";

export default function FinalCTA({ onOpenChooser }) {
  return (
    <section id="contact" className="py-16 md:py-24" dir="rtl">
      <div className="container mx-auto px-6">

        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">מוכנים להתחיל?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            כל הזיכרונות שלכם,
            <br />
            במקום אחד
          </h2>
          <p className="text-white/40 text-base">פשוט. אלגנטי. זיכרונות לכל החיים.</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onOpenChooser}
            className="px-12 py-4 bg-white text-black font-bold text-base rounded-full hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.12)]"
          >
            צרו אירוע
          </button>
        </div>

      </div>
    </section>
  );
}
