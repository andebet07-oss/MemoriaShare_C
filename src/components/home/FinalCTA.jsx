import React from "react";
import { Button } from "@/components/ui/button";

export default function FinalCTA({ onOpenChooser, onOpenDemo }) {
  return (
    <section id="contact" className="py-24 md:py-36 border-t border-border" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center">

          <p className="text-indigo-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">בואו נתחיל</p>

          <h2
            className="font-heebo font-extrabold leading-[1.1] text-foreground/90 mb-3"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            האירוע הבא שלכם
            <br />
            <span className="italic text-muted-foreground">מתחיל כאן.</span>
          </h2>

          <div className="h-px w-10 mx-auto my-8 bg-border" />

          <Button
            onClick={onOpenChooser}
            className="px-14 py-4 h-auto bg-cool-50 text-cool-950 font-semibold text-base hover:bg-foreground active:scale-[0.98] transition-all shadow-indigo-soft rounded-md"
            style={{ letterSpacing: '0.05em' }}
          >
            צרו אירוע
          </Button>

          {onOpenDemo && (
            <Button
              onClick={onOpenDemo}
              variant="ghost"
              className="block mx-auto mt-5 h-auto text-muted-foreground text-xs tracking-[0.2em] uppercase hover:text-foreground hover:bg-transparent transition-colors"
            >
              צפו בהדגמה
            </Button>
          )}

        </div>
      </div>
    </section>
  );
}
