import React from "react";

export default function FinalCTA({ onOpenChooser, onOpenDemo }) {
  return (
    <section id="contact" className="py-24 md:py-36 border-t border-white/5" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center">

          <p className="text-[#b8945f] text-[10px] font-bold tracking-[0.3em] uppercase mb-6">Begin</p>

          <h2
            className="font-editorial leading-[1.1] text-[#e8e2d5] mb-3"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            האירוע הבא שלכם
            <br />
            <span className="italic text-[#a89a85]">מתחיל כאן.</span>
          </h2>

          <div className="h-px w-10 mx-auto my-8 bg-[#e8e2d5]/20" />

          <button
            onClick={onOpenChooser}
            className="px-14 py-4 bg-[#e8e2d5] text-[#0a0907] font-semibold text-base hover:bg-white active:scale-[0.98] transition-all"
            style={{ letterSpacing: '0.05em' }}
          >
            צרו אירוע
          </button>

          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="block mx-auto mt-5 text-[#a89a85] text-xs tracking-[0.2em] uppercase hover:text-[#e8e2d5] transition-colors"
            >
              צפו בהדגמה
            </button>
          )}

        </div>
      </div>
    </section>
  );
}
