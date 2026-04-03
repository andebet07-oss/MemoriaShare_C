import React, { useState, useEffect } from "react";
import { ArrowLeft, BatteryFull, Signal, Wifi } from "lucide-react";

export default function PhoneMockup({ eventData = {} }) {
  const formattedDate = eventData.date 
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(eventData.date)).replace(/\./g, '.')
    : "תאריך האירוע";

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [eventData.cover_image]);

  // שימוש בתמונת ברירת המחדל מהשרת שלך
  const displayImage = eventData.cover_image || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6856836a59e22df6936b8f37/305fc46ef_IMG_0999.jpg";

  return (
    // Outer Hardware Frame (מסגרת המכשיר - Bezel)
    <div className="relative w-[160px] h-[335px] md:w-[240px] md:h-[500px] bg-zinc-800 rounded-[2.2rem] md:rounded-[3rem] p-[5px] md:p-[7px] shadow-[0_30px_60px_rgba(0,0,0,0.7)] shrink-0 ring-1 ring-white/10">
      
      {/* Hardware Side Buttons (כפתורי חומרה) */}
      <div className="absolute top-[25%] -left-[2px] w-[2px] h-[8%] bg-zinc-600 rounded-l-sm"></div>
      <div className="absolute top-[35%] -left-[2px] w-[2px] h-[8%] bg-zinc-600 rounded-l-sm"></div>
      <div className="absolute top-[30%] -right-[2px] w-[2px] h-[12%] bg-zinc-600 rounded-r-sm"></div>
      
      {/* Inner Screen (המסך עצמו) */}
      <div className="relative w-full h-full bg-black rounded-[1.9rem] md:rounded-[2.6rem] overflow-hidden flex flex-col">
        
        {/* iOS Status Bar */}
        <div className="absolute top-2.5 md:top-3.5 left-0 right-0 px-4 md:px-6 flex justify-between items-center z-40 pointer-events-none">
          {/* Left side (Icons - flipped for RTL) */}
          <div className="flex items-center gap-1 md:gap-1.5 opacity-90">
            <Signal className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white fill-white" />
            <Wifi className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
            <BatteryFull className="w-3.5 h-3.5 md:w-5 md:h-5 text-white fill-white" />
          </div>
          
          {/* Right side (Time) */}
          <div className="text-white text-[9px] md:text-[12px] font-semibold tracking-wide font-sans">
            09:41
          </div>
        </div>

        {/* Dynamic Island */}
        <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 w-[30%] h-4 md:h-5 bg-black rounded-full z-40 flex items-center justify-end px-1.5 shadow-[0_0_2px_rgba(255,255,255,0.1)]">
           <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#111] border border-white/10"></div>
        </div>
        
        {/* Background Image / Fallback Gradient */}
        {imageError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-[#0a0a0a] z-0"></div>
        ) : (
          <img 
            src={displayImage} 
            onError={() => setImageError(true)} 
            alt="Event Cover" 
            className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500" 
          />
        )}
        
        {/* Gradient Overlay למטה כדי שהטקסט יהיה קריא */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10"></div>
        
        {/* Content inside Phone */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pb-6 md:pb-8 z-20 flex flex-col items-center text-center" dir="rtl">
          
          <h1 
            className="text-white font-black text-[15px] md:text-[22px] leading-tight mb-0.5 drop-shadow-xl line-clamp-2"
            style={{ fontFamily: "'Assistant', sans-serif", letterSpacing: '-0.03em' }}
          >
            {eventData.name || "שם האירוע"}
          </h1>
          
          <p className="text-white/70 font-medium text-[9px] md:text-[12px] mb-1.5 tracking-widest drop-shadow-md">
            {formattedDate}
          </p>

          {/* תיאור קצר מה-AI אם יש */}
          {eventData.description && (
             <p className="text-white/80 text-[10px] md:text-[13px] leading-snug line-clamp-2 px-1 mb-3 drop-shadow-md">
               {eventData.description}
             </p>
          )}

          {/* Separator Line */}
          <div className="w-[85%] h-[1px] bg-white/20 mb-3 md:mb-5 mt-2"></div>
          
          {/* Action Button (Rectangular with rounded corners like POV) */}
          <button className="w-full bg-white text-black font-bold text-[11px] md:text-[14px] py-2.5 md:py-3.5 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-2xl pointer-events-none transition-transform">
            צלמו תמונות
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 opacity-70" />
          </button>
        </div>

        {/* iOS Home Indicator (פס הבית למטה) */}
        <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[3px] md:h-1.5 bg-white/70 rounded-full z-30"></div>
      </div>
    </div>
  );
}