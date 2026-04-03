import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Play, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function HeroSection({ onOpenDemo }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const eventPhotos = [
    "/Left_PhoneMoucup_hero.jpeg",
    "/Center_PhoneMoucup_hero.jpeg",
    "/right_PhoneMoucup_hero.jpeg",
  ];

  // לוגיקה חכמה ליצירת אירוע
  const handleCreateEventClick = () => {
    if (isAuthenticated) {
      navigate(createPageUrl("CreateEvent"));
    } else {
      // יפנה להתחברות ויחזור אוטומטית לעמוד היצירה
      const returnUrl = `${window.location.origin}${createPageUrl("CreateEvent")}`;
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl } });
    }
  };

  const MiniIPhone = ({ image, className = "", delay = 0, title = "Event Name", isCenter = false }) => (
    <div 
      className={`relative transform transition-all duration-1000 ${className}`}
      style={{ 
        animation: `floating ${4 + delay/500}s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className={`absolute -inset-10 bg-white/${isCenter ? '20' : '5'} blur-[60px] rounded-full -z-10`}></div>
      <div className={`relative ${isCenter ? 'w-48 md:w-72 h-[380px] md:h-[560px]' : 'w-40 md:w-60 h-[320px] md:h-[480px]'} bg-[#0c0c0c] rounded-[2.8rem] p-2 md:p-3 shadow-2xl border border-white/20`}>
        <div className="w-full h-full bg-black rounded-[2.3rem] overflow-hidden relative border border-white/10">
          <img src={image} className="w-full h-full object-cover object-center opacity-90" alt="event" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
          
          <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start px-3 md:px-4 pt-3 md:pt-4">
               <X className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white drop-shadow-lg" />
               <div className="text-center flex-1 px-2">
                  <p className="text-white text-[7px] md:text-[9px] font-semibold leading-tight drop-shadow-lg">{title}</p>
                  <p className="text-white/60 text-[5px] md:text-[7px] drop-shadow-lg">235 participants</p>
               </div>
               <div className="flex flex-col gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 border border-white/60 rounded-sm backdrop-blur-sm"></div>
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 border border-white/60 rounded-sm backdrop-blur-sm"></div>
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 border border-white/60 rounded-sm backdrop-blur-sm"></div>
               </div>
            </div>

            <div className="pb-4 md:pb-5 px-3 md:px-4 space-y-3 md:space-y-4">
               <div className="flex justify-between items-center">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                     <div className="text-yellow-400 text-[7px] md:text-[9px]">⚡</div>
                  </div>
                  <div className="flex gap-1 md:gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-1.5 md:px-2 py-0.5 md:py-1 border border-white/20">
                     <span className="text-white/50 text-[6px] md:text-[7px] font-medium">.5</span>
                     <span className="text-white text-[6px] md:text-[7px] font-semibold">1×</span>
                     <span className="text-white/50 text-[6px] md:text-[7px] font-medium">3</span>
                  </div>
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-black/30 backdrop-blur-md rounded-md flex items-center justify-center border border-white/20">
                     <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <circle cx="12" cy="13" r="3"/>
                        <path d="M3 6.5c0-.28.22-.5.5-.5s.5.22.5.5c0 1.38.84 2.57 2.04 3.08l-.42.9C4.34 9.74 3 8.3 3 6.5zm18 0c0-.28-.22-.5-.5-.5s-.5.22-.5.5c0 1.8-1.34 3.24-3.62 3.98l-.42-.9C17.16 9.07 18 7.88 18 6.5z" opacity="0.6"/>
                        <path d="M3 17.5c0 .28.22.5.5.5s.5-.22.5-.5c0-1.38.84-2.57 2.04-3.08l-.42-.9C4.34 14.26 3 15.7 3 17.5zm18 0c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-1.8-1.34-3.24-3.62-3.98l-.42.9c1.2.51 2.04 1.7 2.04 3.08z" opacity="0.6"/>
                     </svg>
                  </div>
               </div>
               
               <div className="flex justify-between items-center">
                  <div className="text-left">
                     <p className="text-white text-[6px] md:text-[8px] font-bold leading-none drop-shadow-lg">15 SHOTS</p>
                     <p className="text-white/50 text-[5px] md:text-[6px] drop-shadow-lg">REMAINING</p>
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[2.5px] md:border-[3px] border-white/80 p-[3px] md:p-1 bg-transparent">
                     <div className="w-full h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                  </div>
                  <div className="w-7 h-9 md:w-9 md:h-11 rounded-md overflow-hidden border border-white/40 bg-black/40 backdrop-blur-sm">
                     <img src={image} className="w-full h-full object-cover" alt="last" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-10 pb-20">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center" dir="rtl">

          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md relative z-30">
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6 tracking-tight relative z-30">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              Memoria
            </span>
          </h1>

          <p className="text-xl md:text-3xl text-white/90 mb-4 max-w-2xl mx-auto font-light leading-tight relative z-30">
            האורחים מצלמים, הכל באלבום אחד
          </p>

          <div className="flex justify-center items-center gap-0 mb-16 h-[360px] md:h-[500px] relative z-20">
            <MiniIPhone
              image={eventPhotos[0]}
              className="-rotate-12 translate-y-8 opacity-85 scale-[0.72] md:scale-[0.78] -mr-16 md:-mr-24 z-10"
              delay={200}
              title="Party Night"
            />
            <MiniIPhone
              image={eventPhotos[1]}
              className="z-30 scale-[0.88] md:scale-[0.92]"
              delay={0}
              title="Wedding Vibes"
              isCenter={true}
            />
            <MiniIPhone
              image={eventPhotos[2]}
              className="rotate-12 translate-y-8 opacity-85 scale-[0.72] md:scale-[0.78] -ml-16 md:-ml-24 z-10"
              delay={400}
              title="Classic Ceremony"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button onClick={handleCreateEventClick} className="w-full sm:w-64 py-4 px-8 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-xl">
              צור אירוע חדש
            </button>
            
            <button onClick={onOpenDemo} className="w-full sm:w-64 py-4 px-8 bg-white/5 text-white font-semibold rounded-full border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all flex items-center justify-center">
              <Play className="w-4 h-4 ml-2 fill-current" />
              צפו בהדגמה
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floating {
          0% { transform: translateY(0px) rotate(var(--tw-rotate)) scale(var(--tw-scale-x)); }
          50% { transform: translateY(-20px) rotate(var(--tw-rotate)) scale(var(--tw-scale-x)); }
          100% { transform: translateY(0px) rotate(var(--tw-rotate)) scale(var(--tw-scale-x)); }
        }
      `}} />
    </div>
  );
}