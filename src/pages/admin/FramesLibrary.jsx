import { Layers } from 'lucide-react';

export default function FramesLibrary() {
  return (
    <div className="min-h-full p-6 md:p-8" dir="rtl">
      <div className="mb-7">
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.35em] uppercase mb-1.5">Admin · 01</p>
        <h1 className="font-playfair text-3xl text-foreground leading-tight">ספריית מסגרות</h1>
        <p className="text-sm text-muted-foreground mt-1">אין מסגרות פעילות</p>
      </div>

      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cool-800/60 border border-border flex items-center justify-center mb-4">
          <Layers className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">ספריית המסגרות ריקה</p>
        <p className="text-xs text-muted-foreground/40">מסגרות חדשות יתווספו כאן</p>
      </div>
    </div>
  );
}
