import React from "react";

export default function FinalCTA({ onOpenChooser, onOpenDemo }) {
  return (
    <section id="contact" className="py-24 md:py-36 border-t border-border" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center">

          <p className="text-gold-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">Begin</p>

          <h2
            className="font-playfair leading-[1.1] text-foreground/90 mb-3"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            האירוע הבא שלכם
            <br />
            <span className="italic text-muted-foreground">מתחיל כאן.</span>
          </h2>

          <div className="h-px w-10 mx-auto my-8 bg-border" />

          <button
            onClick={onOpenChooser}
            className="px-14 py-4 bg-warm-50 text-warm-950 font-semibold text-base hover:bg-foreground active:scale-[0.98] transition-all shadow-gold-soft"
            style={{ letterSpacing: '0.05em' }}
          >
            צרו אירוע
          </button>

          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="block mx-auto mt-5 text-muted-foreground text-xs tracking-[0.2em] uppercase hover:text-foreground transition-colors"
            >
              צפו בהדגמה
            </button>
          )}

        </div>
      </div>
    </section>
  );
}
