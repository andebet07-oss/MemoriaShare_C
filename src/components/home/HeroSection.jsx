import React from 'react';

export default function HeroSection({ onOpenChooser }) {
  const eventPhotos = [
    "/Left_PhoneMoucup_hero.jpeg",
    "/Center_PhoneMoucup_hero.jpeg",
    "/right_PhoneMoucup_hero.jpeg",
  ];

  const MiniIPhone = ({ image, className = "", title = "Event Name", isCenter = false }) => (
    <div className={`relative transform ${className}`} style={{ flexShrink: 0 }}>
      <div className={`absolute -inset-10 blur-[60px] rounded-full -z-10 ${isCenter ? 'bg-white/15' : 'bg-white/4'}`} />
      <div
        className={`relative bg-[#0c0c0c] rounded-[2.8rem] shadow-2xl border border-white/20 ${
          isCenter
            ? 'w-44 md:w-64 h-[348px] md:h-[512px]'
            : 'w-36 md:w-52 h-[288px] md:h-[416px]'
        }`}
        style={{ padding: isCenter ? '10px' : '8px' }}
      >
        <div className="w-full h-full bg-black rounded-[2.3rem] overflow-hidden relative border border-white/10">
          <img src={image} className="w-full h-full object-cover object-center opacity-90" alt="event" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

          <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start px-3 pt-4">
              <div className="text-center flex-1 px-2">
                <p className="text-white text-[7px] md:text-[9px] font-semibold leading-tight drop-shadow-lg">{title}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="w-2 h-2 border border-white/60 rounded-sm backdrop-blur-sm" />
                <div className="w-2 h-2 border border-white/60 rounded-sm backdrop-blur-sm" />
                <div className="w-2 h-2 border border-white/60 rounded-sm backdrop-blur-sm" />
              </div>
            </div>

            <div className="pb-4 px-3 space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-5 h-5 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  <div className="text-yellow-400 text-[7px]">⚡</div>
                </div>
                <div className="flex gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
                  <span className="text-white/50 text-[6px] font-medium">.5</span>
                  <span className="text-white text-[6px] font-semibold">1×</span>
                  <span className="text-white/50 text-[6px] font-medium">3</span>
                </div>
                <div className="w-5 h-5 bg-black/30 backdrop-blur-md rounded-md flex items-center justify-center border border-white/20">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-white text-[6px] md:text-[8px] font-bold leading-none drop-shadow-lg">15 SHOTS</p>
                  <p className="text-white/50 text-[5px] md:text-[6px] drop-shadow-lg">REMAINING</p>
                </div>
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-[2.5px] border-white/80 p-[3px] bg-transparent">
                  <div className="w-full h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
                <div className="w-6 h-8 md:w-8 md:h-10 rounded-md overflow-hidden border border-white/40 bg-black/40 backdrop-blur-sm">
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
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center" dir="rtl">

          {/* Wordmark */}
          <div className="mb-8 flex flex-col items-center gap-3 animate-in fade-in duration-700">
            <span className="font-editorial text-[#e8e2d5]/90 text-3xl md:text-4xl tracking-widest">Memoria</span>
            <span className="block h-px w-10 bg-[#e8e2d5]/20" />
            <span className="text-[#a89a85] text-[10px] font-semibold tracking-[0.35em] uppercase">שיתוף תמונות חי באירועים</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: '100ms' }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              הזיכרונות שלכם,
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white/80 to-white/25">
              מכל הזוויות
            </span>
          </h1>

          {/* Subtitle — two clean sentences */}
          <p
            className="text-base md:text-lg text-[#a89a85] mb-14 max-w-lg mx-auto font-light leading-relaxed animate-in fade-in duration-700"
            style={{ animationDelay: '200ms' }}
          >
            כל אורח מצלם מהטלפון שלו.
            <br className="hidden sm:block" />
            {' '}כל התמונות מתאחדות בגלריה חיה אחת — בזמן אמת, בלי אפליקציה.
          </p>

          {/* Three phones — spaced properly with gap, no translate-x overlap */}
          <div
            className="flex justify-center items-end gap-3 md:gap-8 mb-16 relative z-20 animate-in fade-in duration-700"
            style={{ animationDelay: '300ms', minHeight: '320px' }}
          >
            <MiniIPhone
              image={eventPhotos[0]}
              className="-rotate-6 translate-y-5 opacity-80 z-10"
              title="Party Night"
            />
            <MiniIPhone
              image={eventPhotos[1]}
              className="z-30 -translate-y-3"
              title="Wedding Vibes"
              isCenter={true}
            />
            <MiniIPhone
              image={eventPhotos[2]}
              className="rotate-6 translate-y-5 opacity-80 z-10"
              title="Classic Ceremony"
            />
          </div>

          {/* CTA */}
          <div
            className="flex justify-center animate-in fade-in duration-700"
            style={{ animationDelay: '450ms' }}
          >
            <button
              onClick={onOpenChooser}
              className="px-12 py-4 bg-[#e8e2d5] text-[#0a0907] font-semibold text-base hover:bg-white active:scale-[0.98] transition-all"
              style={{ letterSpacing: '0.05em' }}
            >
              צרו אירוע
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
