import React, { useState, useEffect } from "react";
import { 
  QrCode, 
  Copy, 
  LayoutDashboard, 
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  RotateCw,
  Signal,
  Wifi,
  BatteryFull,
  Loader2,
  MessageSquare
} from "lucide-react";
import confetti from "canvas-confetti";
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const { Event } = base44.entities;

// --- ממשק המצלמה המעוצב בתוך האייפון ---
const CameraMockupUI = ({ event }) => {
  const formattedDate = event?.date 
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(event.date)).replace(/\./g, '.')
    : "02.25.2026";

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden font-sans select-none">
      <div className="absolute inset-0 z-0 bg-zinc-900">
        {event?.cover_image && (
          <img src={event.cover_image} className="w-full h-full object-cover opacity-80 scale-105 animate-pulse-slow" alt="" />
        )}
        <div className="absolute inset-0 bg-black/20 backdrop-contrast-[1.1]" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-10 z-50 flex items-center justify-between px-5 pointer-events-none opacity-80">
        <span className="text-[10px] font-bold text-white tracking-tight">09:41</span>
        <div className="flex items-center gap-1.5">
          <Signal size={12} fill="white" className="text-white" />
          <Wifi size={12} className="text-white" />
          <BatteryFull size={14} fill="white" className="text-white" />
        </div>
      </div>

      <div className="relative z-20 w-full pt-10 pb-2 text-center bg-gradient-to-b from-black/60 to-transparent">
        <h2 className="text-white font-black text-[12px] md:text-[14px] tracking-[0.1em] uppercase truncate px-3 drop-shadow-lg">
          {event?.name || "האירוע שלך"}
        </h2>
        <p className="text-white/50 text-[8px] uppercase tracking-[0.3em] mt-0.5 font-bold">{formattedDate}</p>
      </div>

      <div className="mt-auto relative z-20 w-full pb-8 pt-10 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-around px-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/70"><Zap size={18} /></div>
          
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 rounded-full border-[2px] border-white/40 shadow-inner"></div>
            <div className="w-[70%] h-[70%] rounded-full bg-white shadow-lg"></div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/70"><RotateCw size={18} /></div>
        </div>
      </div>
    </div>
  );
};

const PhonePreview = ({ event }) => (
  <div className="relative animate-float-slow">
    <div className="relative w-[175px] h-[320px] sm:w-[220px] sm:h-[450px] bg-zinc-900 rounded-[2.2rem] md:rounded-[3.2rem] p-[7px] md:p-[9px] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] border border-white/10 shrink-0 mx-auto overflow-hidden">
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-60 flex items-center justify-end px-2 shadow-inner">
        <div className="w-1 h-1 rounded-full bg-[#111] border border-white/5 shadow-sm"></div>
      </div>
      <div className="relative w-full h-full bg-black rounded-[1.8rem] md:rounded-[2.4rem] overflow-hidden border border-black shadow-inner">
        <CameraMockupUI event={event} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none z-[70]" />
    </div>
    <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px] rounded-full -z-10" />
  </div>
);

export default function EventSuccess() {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvent();
    confetti({ particleCount: 120, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1', '#ffffff', '#128C7E'] });
  }, []);

  const loadEvent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (!eventId) { setIsLoading(false); return; }
    try {
      const events = await Event.filter({ id: eventId });
      if (events.length > 0) setEvent(events[0]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const BASE_URL = 'https://memoriashare.com';
  const eventUrl = event ? `${BASE_URL}${createPageUrl(`Event?code=${event.unique_code}`)}&pin=${event.pin_code}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    if (!event) return;
    const text = encodeURIComponent(`היי! פתחנו אלבום תמונות משותף לאירוע שלנו ב-Memoria. מוזמנים לצלם ולשתף:\n${eventUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(eventUrl)}&bgcolor=FFFFFF&color=000000&margin=20`;
  };

  if (isLoading) return <div className="fixed inset-0 bg-black flex items-center justify-center"><Loader2 className="animate-spin text-gray-700" /></div>;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050505] text-white overflow-hidden overscroll-none font-sans" dir="rtl">
      
      {/* הוספת Margin-top של 60 פיקסלים כדי להוריד את הכל למטה מתחת לסטטוס בר האמיתי */}
      <div className="flex-none mt-[60px] pb-1 text-center px-6 z-20">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[8px] uppercase tracking-widest">
          <Sparkles size={10} className="animate-pulse" /> האירוע הוקם בהצלחה
        </div>
        <h1 className="text-lg font-black tracking-tight leading-tight">מזל טוב! הכל מוכן.</h1>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-4 min-h-0">
        <PhonePreview event={event} />
      </div>

      <div className="flex-none px-6 py-4 bg-gradient-to-t from-black to-black/80 backdrop-blur-xl border-t border-white/5 shadow-2xl z-30" style={{ paddingBottom: 'max(1.2rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-sm mx-auto space-y-4">
          
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3.5 shadow-inner">
            <div className="flex justify-between items-center mb-2.5">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">קישור להזמנת אורחים</p>
               <button onClick={() => setShowQRModal(true)} className="flex items-center gap-1.5 text-indigo-400/80 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-300">
                  <QrCode size={11} /> הצגת QR
               </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-mono text-indigo-300/80 truncate flex items-center" dir="ltr">
                {eventUrl}
              </div>
              <button onClick={copyLink} className={`px-4 rounded-xl transition-all active:scale-95 shadow-md ${copied ? 'bg-emerald-600' : 'bg-white text-black'}`}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
             <div className="flex gap-2.5">
                <button onClick={shareToWhatsApp} className="flex-1 h-14 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-2xl text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                   <MessageSquare size={18} /> שיתוף בוואטסאפ
                </button>
                <button onClick={() => navigate(createPageUrl(`Dashboard?id=${event?.id}`))} className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-indigo-500/30">
                   <LayoutDashboard size={18} /> ניהול אירוע
                </button>
             </div>
             <button onClick={() => navigate(createPageUrl("MyEvents"))} className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">
                <ArrowRight size={12} className="rotate-180" /> חזרה לאירועים שלי
             </button>
          </div>
        </div>
      </div>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="bg-white text-black max-w-[320px] rounded-[32px] p-8" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl mb-4">קוד QR לאירוע</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
               <img src={generateQRCode()} alt="QR" className="w-full aspect-square" />
            </div>
            <p className="text-center text-[11px] font-medium text-gray-500 leading-relaxed">האורחים יכולים לסרוק את הקוד<br/>ולהתחיל לשתף תמונות מיד</p>
            <Button onClick={() => setShowQRModal(false)} className="w-full bg-black text-white rounded-2xl h-12 font-bold active:scale-95 transition-transform">סגור</Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float-slow { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.05); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 4s infinite linear; }
      `}</style>
    </div>
  );
}