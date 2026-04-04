import React, { useState, useEffect } from "react";
import memoriaService from "@/components/memoriaService";

import { Button } from "@/components/ui/button";
import { Calendar, Camera, Loader2, Lock, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { checkGuestQuota } from "@/functions/checkGuestQuota";

export default function EventPage() {
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quota state
  const [quotaStatus, setQuotaStatus] = useState(null); // null = not checked yet
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code');
    if (eventCode) {
      try {
        const found = await memoriaService.events.getByCode(eventCode);
        if (found) {
          setEvent(found);
          // Check quota immediately after loading the event
          await checkEventQuota(found.id);
        }
      } catch (error) {
        console.error('שגיאה בטעינת האירוע:', error);
      }
    }
    setIsLoading(false);
  };

  const checkEventQuota = async (eventId) => {
    setIsCheckingQuota(true);
    try {
      const result = await checkGuestQuota({ event_id: eventId });
      setQuotaStatus(result?.data || result);
    } catch (error) {
      // On error, allow entry — don't block users due to network issues
      console.error('שגיאה בבדיקת מכסה:', error);
      setQuotaStatus({ allowed: true });
    } finally {
      setIsCheckingQuota(false);
    }
  };

  const handleStartCapture = () => {
    if (!event) return;
    // Always navigate to the gallery — EventGallery handles anonymous sign-in and Guest Book itself
    navigate(createPageUrl(`EventGallery?code=${event.unique_code}`));
  };

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center text-center p-6">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold mb-4">אירוע לא נמצא</h1>
        <p className="text-gray-400 mb-8">ייתכן שהקוד שגוי או שהאירוע הוסר</p>
      </div>
    </div>
  );

  if (!event.is_active) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center">
        {event.cover_image && <img src={event.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center border border-white/20 max-w-sm">
          <h2 className="text-3xl font-bold mb-4">אירוע סגור</h2>
          <p className="text-gray-300 mb-8">אירוע זה אינו פעיל כעת.</p>
        </div>
      </div>
    );
  }

  // Determine block state from quota check
  const isBlocked = quotaStatus && !quotaStatus.allowed && !quotaStatus.exempt;
  const blockType = quotaStatus?.quota_type;

  const getBlockUI = () => {
    if (blockType === 'event_closed') {
      return {
        icon: <Clock className="w-10 h-10 text-gray-300 mb-4" />,
        title: 'ההעלאות נסגרו',
        message: quotaStatus.reason,
      };
    }
    if (blockType === 'guest_tier') {
      return {
        icon: <Users className="w-10 h-10 text-gray-300 mb-4" />,
        title: 'האירוע מלא',
        message: quotaStatus.reason,
      };
    }
    if (blockType === 'per_user') {
      return {
        icon: <Lock className="w-10 h-10 text-gray-300 mb-4" />,
        title: 'הגעת למגבלה',
        message: quotaStatus.reason,
      };
    }
    return {
      icon: <Lock className="w-10 h-10 text-gray-300 mb-4" />,
      title: 'לא ניתן להצטרף',
      message: quotaStatus?.reason || 'לא ניתן להצטרף לאירוע זה כרגע.',
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black"></div>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-10"></div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-6 pb-12">
        <div className="max-w-md mx-auto text-center space-y-6">
          {/* Event title & date */}
          <div className="space-y-3 animate-fade-in">
            <h1 className="text-4xl font-bold text-white leading-tight">{event.name}</h1>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Calendar className="w-5 h-5" />
              <span>{new Date(event.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          {/* Blocked state — friendly error message */}
          {isBlocked ? (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
              {getBlockUI().icon}
              <h2 className="text-white font-bold text-xl mb-2">{getBlockUI().title}</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{getBlockUI().message}</p>
            </div>
          ) : (
            /* Normal / loading state */
            <Button
              onClick={handleStartCapture}
              disabled={isCheckingQuota}
              className="w-full bg-white text-black font-black text-xl py-8 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCheckingQuota ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6" />
                  התחילו לצלם
                </>
              )}
            </Button>
          )}

          <p className="text-white/30 text-[10px] tracking-widest uppercase">Powered by MemoriaShare</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}