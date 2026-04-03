import React from 'react';
import { Camera, Settings, Share2, Image as ImageIcon, X } from 'lucide-react';

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "תאריך האירוע";
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function IphoneMockup({ coverImage, eventName, eventDate }) {
  return (
    <div className="bg-[#151515] rounded-3xl p-3 pb-6 border border-[#2A2A2A] shadow-2xl shadow-black/40 max-w-md mx-auto">
      <div className="aspect-[9/19.5] bg-black rounded-2xl overflow-hidden relative shadow-lg">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 pt-3 pb-1 text-white text-sm font-medium">
          <span>9:41</span>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full"></div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
            <svg className="w-6 h-4 text-white" viewBox="0 0 24 16" fill="currentColor">
                <rect x="1" y="4" width="22" height="8" rx="2" fill="currentColor"/>
                <rect x="23" y="6" width="2" height="4" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Header UI */}
        <div className="absolute top-16 left-0 right-0 px-4 flex justify-between items-start text-white z-20">
            <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
            </div>
            <div className="text-center bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-sm drop-shadow-lg">{eventName || "שם האירוע"}</h3>
            <p className="text-xs opacity-90 drop-shadow-lg">{formatDateForDisplay(eventDate)}</p>
            </div>
            <div className="flex flex-col gap-3">
            <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"><Settings className="w-4 h-4" /></div>
            <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"><Share2 className="w-4 h-4" /></div>
            <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"><ImageIcon className="w-4 h-4" /></div>
            </div>
        </div>

        {/* Background Image */}
        <img
          src={coverImage || "/Center_PhoneMoucup_hero.jpeg"}
          alt={eventName || "תמונת נושא"}
          className="absolute inset-0 w-full h-full object-cover"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Footer Camera UI */}
        <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between text-white z-20">
            <div className="text-center">
            <p className="text-sm font-bold tracking-wider">15</p>
            <p className="text-[10px] opacity-70 tracking-wider">SHOTS</p>
            <p className="text-[10px] opacity-70 tracking-wider">REMAINING</p>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span>.5</span>
                <span className="text-base bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">1x</span>
                <span>3</span>
                </div>
                <div className="w-16 h-16 bg-white/90 rounded-full border-4 border-white/20 shadow-lg cursor-pointer hover:bg-white transition-colors"></div>
            </div>

            <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-white/50 cursor-pointer" style={{ transform: 'rotate(10deg) scale(1.05)' }}>
            <img src={coverImage || "/Center_PhoneMoucup_hero.jpeg"} alt="preview" className="w-full h-full object-cover" />
            </div>
        </div>
      </div>
    </div>
  );
}