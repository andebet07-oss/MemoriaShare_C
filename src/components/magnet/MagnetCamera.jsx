import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Zap, ZapOff, CameraOff, Loader2, CheckCircle, Lock } from 'lucide-react';
import memoriaService from '@/components/memoriaService';

export default function MagnetCamera({ event, userId, remainingPrints, onClose, onPrintJobCreated }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const videoTrackRef = useRef(null);

  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [isVintage, setIsVintage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [shutterEffect, setShutterEffect] = useState(false);
  const [blackFrame, setBlackFrame] = useState(false);
  const [frontFlash, setFrontFlash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'error'

  const vintageStyle = "sepia(0.4) contrast(0.85) brightness(1.1) saturate(1.2)";
  const isQuotaExhausted = remainingPrints <= 0;

  useEffect(() => { startCamera(); return () => stopCamera(); }, [isFrontCamera]);

  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFrontCamera ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch (e) {
        if (e.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isFrontCamera ? 'user' : 'environment' }, audio: false });
        } else throw e;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn('[MagnetCamera] play() failed:', err));
      }
      videoTrackRef.current = stream.getVideoTracks()[0];
    } catch (err) {
      const map = { NotAllowedError: 'הגישה למצלמה נדחתה. אנא אפשרו הרשאות בהגדרות.', NotFoundError: 'לא נמצאה מצלמה במכשיר.', NotReadableError: 'המצלמה תפוסה על ידי אפליקציה אחרת.' };
      setCameraError(map[err.name] || 'לא ניתן לגשת למצלמה. אנא נסו בדפדפן אחר.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); videoTrackRef.current = null; };

  const captureAndPrint = async () => {
    if (isQuotaExhausted || isSubmitting || !videoRef.current) return;
    setIsSubmitting(true);
    setLastResult(null);

    // Shutter effect
    setBlackFrame(true);
    await new Promise(r => setTimeout(r, 25));
    setBlackFrame(false);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    // BUG-01: hoist photo so the catch block can run compensating delete
    let photo = null;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.save();
      // BUG-02: apply vintage filter to canvas so captured frame matches the live preview
      if (isVintage) ctx.filter = vintageStyle;
      if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      const file = new File([blob], `magnet-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const { file_url, path } = await memoriaService.storage.upload(file, event.id);
      photo = await memoriaService.photos.create({
        event_id: event.id,
        file_url,
        path,
        created_by: userId,
        is_approved: true,
        is_hidden: false,
        filter_applied: 'none',
      });
      await memoriaService.printJobs.create({ event_id: event.id, photo_id: photo.id, guest_user_id: userId });

      if (navigator.vibrate) navigator.vibrate(100);
      setLastResult('success');
      onPrintJobCreated();
    } catch (err) {
      console.error('[MagnetCamera] captureAndPrint failed:', err);
      // BUG-01: photo was created but print job failed — delete the orphan to keep storage clean
      if (photo?.id) {
        memoriaService.photos.delete(photo.id).catch(() => {});
      }
      setLastResult('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setLastResult(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none" dir="rtl">
      <div className={`absolute inset-0 bg-black z-[115] pointer-events-none transition-opacity duration-75 ${blackFrame ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-white z-[110] transition-opacity duration-150 pointer-events-none ${shutterEffect ? 'opacity-80' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }} />

      {!cameraError && (
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none', filter: isVintage ? vintageStyle : 'none' }}
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-zinc-900">
          <CameraOff className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-sm leading-relaxed">{cameraError}</p>
          <button onClick={onClose} className="mt-6 bg-white text-black px-8 py-3 rounded-full font-bold">חזרה</button>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm drop-shadow-lg">{event.name}</p>
          <p className={`text-xs font-bold drop-shadow-lg ${isQuotaExhausted ? 'text-red-400' : 'text-white/80'}`}>
            {isQuotaExhausted ? 'מכסת ההדפסות הסתיימה' : `נותרו ${remainingPrints} הדפסות`}
          </p>
        </div>
        <button onClick={() => setFlashMode(f => f === 'off' ? 'on' : 'off')} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
          {flashMode === 'off' ? <ZapOff className="w-4 h-4 text-white/70" /> : <Zap className="w-4 h-4 text-yellow-400" />}
        </button>
      </div>

      {/* Feedback overlay */}
      {lastResult && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-50 pointer-events-none">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl border ${lastResult === 'success' ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300' : 'bg-red-500/25 border-red-500/40 text-red-300'}`}>
            {lastResult === 'success' ? <><CheckCircle className="w-4 h-4" /><span className="text-sm font-semibold">נשלח להדפסה!</span></> : <span className="text-sm font-semibold">שגיאה, נסו שוב</span>}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-50 flex items-center justify-center gap-10 px-8 pb-12 pt-6"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)` }}>
        <button onClick={() => setIsVintage(v => !v)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${isVintage ? 'bg-yellow-500/25 border-yellow-500/40 text-yellow-300' : 'bg-black/40 border-white/20 text-white/50'}`}>
          V
        </button>

        {/* Shutter */}
        <button onClick={captureAndPrint} disabled={isQuotaExhausted || isSubmitting || isLoading}
          className="relative w-20 h-20 rounded-full border-[3px] border-white/80 p-1.5 bg-transparent disabled:opacity-50 transition-transform active:scale-95">
          {isSubmitting
            ? <div className="w-full h-full rounded-full bg-white/80 flex items-center justify-center"><Loader2 className="w-6 h-6 text-black animate-spin" /></div>
            : isQuotaExhausted
            ? <div className="w-full h-full rounded-full bg-white/30 flex items-center justify-center"><Lock className="w-6 h-6 text-white/60" /></div>
            : <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
          }
        </button>

        <button onClick={() => setIsFrontCamera(f => !f)} className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center">
          <RotateCw className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  );
}
