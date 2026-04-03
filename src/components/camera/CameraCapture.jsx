import React, { useState, useRef, useEffect } from "react";
// הנה התיקון שהפיל אותנו: נוספו Camera ו-CameraOff לשורת הייבוא!
import { X, RotateCw, Zap, ZapOff, Wand2, Image as ImageIcon, Trash2, ChevronDown, Send, AlertCircle, CameraOff, Camera } from "lucide-react";

export default function CameraCapture({ 
  onCapture, 
  onClose, 
  onFinalUpload, 
  pendingPhotos = [], 
  onRemovePhoto,
  maxPhotos = 15,
  isFrontCamera: initialFrontCamera = true,
  eventName = "",
  eventDate = ""
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isFrontCamera, setIsFrontCamera] = useState(initialFrontCamera);
  const [flashMode, setFlashMode] = useState('off'); // 'off' | 'auto' | 'on'
  const [isVintage, setIsVintage] = useState(true);
  const videoTrackRef = useRef(null);
  const capturePhotoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [cameraError, setCameraError] = useState(null); 
  
  const [showQuickGallery, setShowQuickGallery] = useState(false);
  const [shutterEffect, setShutterEffect] = useState(false);
  const [frontFlash, setFrontFlash] = useState(false);
  const [pulseMagazine, setPulseMagazine] = useState(false); 
  
  const torchSupported = useRef(false);
  const vintageFilterStyle = "sepia(0.4) contrast(0.85) brightness(1.1) saturate(1.2)";
  
  const shotsRemaining = Math.max(0, maxPhotos - pendingPhotos.length);
  const [counterPop, setCounterPop] = useState(false);
  const isQuotaExhausted = maxPhotos <= 0;

  useEffect(() => {
    if (pendingPhotos.length > 0) {
      setPulseMagazine(true);
      setCounterPop(true);
      const timer = setTimeout(() => { setPulseMagazine(false); setCounterPop(false); }, 400);
      return () => clearTimeout(timer);
    }
  }, [pendingPhotos.length]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [isFrontCamera]);

  // Smooth orientation-change: briefly hide the viewfinder to avoid visible distortion
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsRotating(true);
      setTimeout(() => setIsRotating(false), 400);
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Volume-Down physical button → trigger capture (works on some Android/desktop browsers;
  // iOS/Safari intercepts volume keys at the OS level, so this is a best-effort listener).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'VolumeDown') {
        e.preventDefault();
        capturePhotoRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser does not support camera API");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFrontCamera ? "user" : "environment", width: { ideal: 1920 }, height: { ideal: 1080 }, aspectRatio: { ideal: 16 / 9 } },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      videoTrackRef.current = videoTrack;
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
      torchSupported.current = !!capabilities.torch;
      
      setIsLoading(false);
    } catch (err) {
      console.error("Camera access failed", err);
      let errorMessage;
      if (err.name === 'NotAllowedError') {
        errorMessage = "הגישה למצלמה נדחתה. אנא אפשרו הרשאות מצלמה בהגדרות הדפדפן ונסו שוב.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "לא נמצאה מצלמה במכשיר. ודאו שמצלמה זמינה ונסו שוב.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "המצלמה תפוסה על ידי אפליקציה אחרת. סגרו את האפליקציה האחרת ונסו שוב.";
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = "המצלמה אינה תומכת בהגדרות הנדרשות. נסו שוב.";
      } else {
        errorMessage = "לא ניתן לגשת למצלמה. אנא וודאו שאישרתם הרשאות ונסו לפתוח בדפדפן רגיל (כרום/ספארי).";
      }
      setCameraError(errorMessage);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const drawDateStamp = (ctx, width, height) => {
    const now = new Date();
    const dateStr = `'${now.getFullYear().toString().slice(-2)}  ${(now.getMonth() + 1).toString().padStart(2, '0')}  ${now.getDate().toString().padStart(2, '0')}`;
    const fontSize = Math.floor(width * 0.038);
    ctx.save();
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255, 120, 0, 0.92)";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(200, 80, 0, 0.5)";
    ctx.translate(width * 0.06, height * 0.92);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "left";
    ctx.fillText(dateStr, 0, 0);

    // Branding text below the date
    const brandFontSize = Math.floor(width * 0.022);
    ctx.font = `${brandFontSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
    ctx.shadowBlur = 0;
    ctx.fillText("MEMORIA • LIVE POV", 0, fontSize * 1.6);
    ctx.restore();
  };

  // אפייה ידנית של פילטר וינטג' על פיקסלים - עובד בכל דפדפן כולל Safari iOS
  const applyVintageToPixels = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Step A: Balanced Warm Tint Matrix (Soft & Natural)
      let tr = (r * 0.88) + (g * 0.1)  + (b * 0.02);
      let tg = (r * 0.05) + (g * 0.9)  + (b * 0.05);
      let tb = (r * 0.05) + (g * 0.05) + (b * 0.9);

      // Step B: Safe-Range Mapping (The "Soft Film" Look)
      // Maps 0-255 into approximately 30-230. 
      // This lifts shadows (+30) and prevents burnt highlights (max ~230).
      data[i]     = 30 + (tr / 255) * 200; // Lifted Red
      data[i + 1] = 25 + (tg / 255) * 200; // Lifted Green
      data[i + 2] = 20 + (tb / 255) * 200; // Lifted Blue
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const capturePhoto = async () => {
    if (shotsRemaining <= 0 || !videoRef.current) return;

    // Haptic feedback (supported on Android Chrome; silently ignored elsewhere)
    if (navigator.vibrate) navigator.vibrate(50);

    const shouldUseFlash = flashMode !== 'off';

    // שלב 1: אפקטים ודיליי טרום-צילום
    if (shouldUseFlash) {
      if (isFrontCamera) {
        setFrontFlash(true);
        await new Promise(r => setTimeout(r, 450));
      } else {
        if (torchSupported.current && videoTrackRef.current) {
          try {
            await videoTrackRef.current.applyConstraints({ advanced: [{ torch: true }] });
            await new Promise(r => setTimeout(r, 600));
          } catch { /* ignore */ }
        }
      }
    } else {
      setShutterEffect(true);
      setTimeout(() => setShutterEffect(false), 150);
    }

    // שלב 2: ציור פריים הווידאו לקנבס הראשי
    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const canvas = canvasRef.current;
    canvas.width = vw;
    canvas.height = vh;
    const context = canvas.getContext('2d');

    // מירור למצלמה קדמית
    context.save();
    if (isFrontCamera) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, vw, vh);
    context.restore();

    // שלב 3: אפיית פילטר וינטג' ידנית על הפיקסלים (עובד בכל דפדפן)
    if (isVintage) {
      applyVintageToPixels(context, vw, vh);
      drawDateStamp(context, vw, vh);
    }

    // שלב 4: כיבוי פלאש/טורצ' לאחר הצילום
    if (shouldUseFlash) {
      if (isFrontCamera) {
        setFrontFlash(false);
      } else if (torchSupported.current && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
        } catch { /* ignore */ }
      }
    }

    // שלב 5: שמירת הקובץ
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `pov-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, isVintage ? 'vintage' : 'none');
      }
    }, 'image/jpeg', 0.92);
  };

  // Keep ref in sync with latest closure so the volume-button listener always calls the current version
  useEffect(() => {
    capturePhotoRef.current = capturePhoto;
  });

  const cycleFlash = () =>
    setFlashMode(prev => prev === 'off' ? 'auto' : prev === 'auto' ? 'on' : 'off');

  const handleFinishAndUpload = () => {
    if (pendingPhotos.length > 0 && onFinalUpload) onFinalUpload();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col font-sans select-none" dir="rtl">
      
      {/* שאטר לבן — פידבק ויזואלי כשהפלאש כבוי */}
      <div className={`absolute inset-0 bg-white z-[110] transition-opacity duration-150 pointer-events-none ${shutterEffect ? 'opacity-80' : 'opacity-0'}`}></div>
      <div className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }}></div>
      
      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 z-40 px-6 pt-12 pb-10 flex flex-col items-center text-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="absolute right-6 top-12 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-lg">
          <X className="w-5 h-5" />
        </button>
        <div className="text-white font-bold text-[17px] tracking-[0.25em] uppercase drop-shadow-md tracking-widest">{eventName}</div>
        <div className="text-white/70 text-[10px] tracking-[0.2em] mt-1">{eventDate}</div>
        <div className="text-white/30 text-[9px] tracking-widest mt-1">MEMORIA • LIVE POV</div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-zinc-900">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <CameraOff className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">שגיאת מצלמה</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">{cameraError}</p>
            <button onClick={onClose} className="bg-white text-black px-8 py-3.5 rounded-full font-bold shadow-xl active:scale-95 transition-transform">
              חזור לגלריה
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" 
            style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none', filter: isVintage ? vintageFilterStyle : 'none', transition: 'transform 400ms ease-in-out, filter 300ms ease' }} />
        )}

        {/* Brief black cover during device rotation to prevent visible distortion */}
        {isRotating && <div className="absolute inset-0 bg-black z-50" />}
        
        {isLoading && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          </div>
        )}

        {isQuotaExhausted && !cameraError && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <h3 className="text-xl font-black text-white mb-2">מימשת את כל המכסה שלך</h3>
              <p className="text-white/60 text-sm mb-8">לא ניתן לצלם תמונות נוספות באירוע זה. תודה על ה-POV המדהים שלך!</p>
              <button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-2xl font-bold">סגור מצלמה</button>
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="bg-black px-10 pt-4 relative z-[60]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)' }}>

        {/* Camera Controls Row */}
        {!cameraError && (
          <div className="flex items-center justify-center gap-8 mb-4">
            <button onClick={() => setIsFrontCamera(!isFrontCamera)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 shadow-xl transition-all">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={() => setIsVintage(!isVintage)} className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-xl active:scale-90 ${isVintage ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/40' : 'bg-white/10 border-white/10 text-white'}`}>
              <Wand2 className="w-5 h-5" />
            </button>
            <button onClick={cycleFlash} className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-xl active:scale-90 ${flashMode === 'on' ? 'bg-amber-400 border-amber-300 text-black shadow-amber-400/40' : flashMode === 'auto' ? 'bg-amber-400/50 border-amber-300/50 text-black' : 'bg-white/10 border-white/10 text-white'}`}>
              {flashMode === 'off' ? (
                <ZapOff className="w-5 h-5" />
              ) : flashMode === 'auto' ? (
                <span className="relative flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 text-[9px] font-black leading-none">A</span>
                </span>
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-6 h-24">
          
          <div className="flex flex-col items-center w-20">
            <div className="relative h-12 w-full flex items-center justify-center overflow-hidden bg-white/5 rounded-xl border border-white/10 shadow-inner">
                <span
                  key={shotsRemaining}
                  className={`text-2xl font-bold tracking-tighter transition-all duration-150 ${shotsRemaining === 0 ? 'text-red-500 animate-pulse' : 'text-white'} ${counterPop ? 'scale-125' : 'scale-100'}`}
                  style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}
                >
                    {shotsRemaining}
                </span>
            </div>
            <span className="text-white/30 text-[8px] font-black mt-2 text-center leading-tight">עוד {shotsRemaining} רגעים<br/>לאלבום</span>
          </div>

          <div className="relative">
             <button onClick={capturePhoto} disabled={shotsRemaining <= 0 || isLoading || isQuotaExhausted || cameraError}
                className="relative w-24 h-24 flex items-center justify-center active:scale-90 transition-transform duration-150 disabled:opacity-50 group"
             >
                <div className="absolute w-full h-full rounded-full border-[3px] border-white/30 transition-all group-active:border-white/60"></div>
                <div className="w-[76px] h-[76px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
                </div>
             </button>
          </div>

          <div className="relative w-20 flex flex-col items-center justify-center gap-2">
            <button onClick={() => setShowQuickGallery(!showQuickGallery)} disabled={!!cameraError}
                className={`relative w-16 h-20 active:scale-95 transition-all duration-300 disabled:opacity-50 ${pulseMagazine ? 'scale-110 rotate-3' : 'scale-100'}`}
            >
                {pendingPhotos.length > 0 ? (
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-white/20 rounded-[14px] translate-x-2 -translate-y-1 rotate-6 border border-white/30 shadow-lg"></div>
                    <img src={pendingPhotos[pendingPhotos.length - 1].previewUrl} 
                        className="w-full h-full object-cover rounded-[14px] border-[3px] border-white shadow-2xl relative z-10" alt="Last POV" />
                    <div className="absolute -top-2 -left-2 bg-indigo-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center z-20 shadow-lg border-[2px] border-black">
                      {pendingPhotos.length}
                    </div>
                </div>
                ) : (
                <div className="w-full h-full rounded-xl border-2 border-white/20 border-dashed flex items-center justify-center text-white/20 bg-white/5">
                    <ImageIcon className="w-6 h-6" />
                </div>
                )}
            </button>
          </div>
        </div>
      </div>

      {/* --- אלבום אופקי משופר --- */}
      <div 
        className={`absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-3xl rounded-t-[32px] border-t border-white/10 z-[100] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${showQuickGallery ? 'translate-y-0' : 'translate-y-full'}`} 
        style={{ height: '55vh' }}
      >
        <div className="w-full pt-4 pb-2 flex justify-center" onClick={() => setShowQuickGallery(false)}>
            <div className="w-12 h-1.5 bg-white/30 rounded-full cursor-pointer"></div>
        </div>

        <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-white text-xl font-black tracking-tight">התמונות שלי</h2>
              <p className="text-white/50 text-xs mt-0.5">{pendingPhotos.length} תמונות ממתינות לאלבום</p>
            </div>
            <button onClick={() => setShowQuickGallery(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
              <ChevronDown className="w-4 h-4" />
            </button>
        </div>
        
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-2 snap-x snap-mandatory flex gap-4 scrollbar-hide" dir="ltr">
            {pendingPhotos.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-white/20 text-center">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold">צלמו תמונות כדי למלא את האלבום</p>
                </div>
            ) : (
                [...pendingPhotos].reverse().map((photo) => (
                    <div key={photo.id} className="relative h-full w-[65vw] sm:w-[220px] shrink-0 snap-center bg-white/5 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 group">
                        <img src={photo.previewUrl} className="w-full h-full object-cover" alt="POV Shot" />
                        
                        <div className="absolute top-3 left-3">
                            <button onClick={() => onRemovePhoto(photo.id)} 
                                className="w-9 h-9 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center active:scale-90 transition-all border border-white/20 hover:bg-red-500/80"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        <div className="px-6 py-6 bg-gradient-to-t from-black via-black/80 to-transparent">
            {pendingPhotos.length > 0 ? (
                <button onClick={handleFinishAndUpload}
                    className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center gap-3 border border-indigo-400"
                >
                    סיימתי, שתפו לאלבום! ({pendingPhotos.length})
                    <Send className="w-5 h-5 -rotate-12" />
                </button>
            ) : (
                <button onClick={() => setShowQuickGallery(false)}
                    className="w-full h-14 bg-white/10 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                   <Camera className="w-5 h-5" />
                   חזור לצלם
                </button>
            )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}