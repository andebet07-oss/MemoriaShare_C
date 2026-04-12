import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Zap, ZapOff, CameraOff, Loader2, CheckCircle, Lock, WifiOff, Upload } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { compressImage } from '@/functions/processImage';

export default function MagnetCamera({ event, userId, remainingPrints, onClose, onPrintJobCreated }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const videoTrackRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingBlobRef = useRef(null);

  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [isVintage, setIsVintage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [shutterEffect, setShutterEffect] = useState(false);
  const [blackFrame, setBlackFrame] = useState(false);
  const [frontFlash, setFrontFlash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'error'
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  // UX-03: synchronous counter to block rapid double-taps before remainingPrints prop updates
  const capturedCountRef = useRef(0);

  const vintageStyle = "sepia(0.4) contrast(0.85) brightness(1.1) saturate(1.2)";
  const isQuotaExhausted = remainingPrints <= 0;

  useEffect(() => { startCamera(); return () => stopCamera(); }, [isFrontCamera]);

  const startCamera = async () => {
    // IG/FB in-app browser: getUserMedia API is unavailable in sandboxed WKWebView
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraFailed(true);
      setIsLoading(false);
      return;
    }
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
        } else if (e.name === 'NotAllowedError' || e.name === 'NotFoundError' || e.name === 'NotReadableError') {
          throw e;
        } else {
          // Sandboxed WebView can throw generic errors even if API exists
          setCameraFailed(true);
          setIsLoading(false);
          return;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn('[MagnetCamera] play() failed:', err));
      }
      videoTrackRef.current = stream.getVideoTracks()[0];
    } catch (err) {
      const map = {
        NotAllowedError: 'הגישה למצלמה נדחתה. אנא אפשרו הרשאות בהגדרות.',
        NotFoundError: 'לא נמצאה מצלמה במכשיר.',
        NotReadableError: 'המצלמה תפוסה על ידי אפליקציה אחרת.',
      };
      setCameraError(map[err.name] || 'לא ניתן לגשת למצלמה. אנא נסו בדפדפן אחר.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); videoTrackRef.current = null; };

  // Shared upload + DB insert — called from both camera and file-picker paths
  const uploadAndSubmit = async (blob) => {
    let photo = null;
    try {
      const file = new File([blob], `magnet-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const { file_url, path } = await memoriaService.storage.upload(file, event.id);
      photo = await memoriaService.photos.create({
        event_id: event.id, file_url, path, created_by: userId,
        is_approved: true, is_hidden: false, filter_applied: 'none',
      });
      await memoriaService.printJobs.create({ event_id: event.id, photo_id: photo.id, guest_user_id: userId });

      pendingBlobRef.current = null;
      setRetryMode(false);
      if (navigator.vibrate) navigator.vibrate(100);
      setLastResult('success');
      onPrintJobCreated();
    } catch (err) {
      console.error('[MagnetCamera] uploadAndSubmit failed:', err);
      // BUG-01: photo created but print job failed — delete orphan
      if (photo?.id) memoriaService.photos.delete(photo.id).catch(() => {});

      const isNetworkError = !navigator.onLine || err.message?.includes('NetworkError') || err.message?.includes('fetch');
      if (isNetworkError && blob) {
        // Preserve the blob for retry — do NOT release the quota slot
        pendingBlobRef.current = blob;
        setRetryMode(true);
      } else {
        // Non-network failure: release the slot so the guest can try again
        capturedCountRef.current = Math.max(0, capturedCountRef.current - 1);
      }
      setLastResult('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setLastResult(null), 2500);
    }
  };

  const captureAndPrint = async () => {
    if (isQuotaExhausted) { setShowQuotaModal(true); return; }

    // Offline retry: re-use the preserved blob instead of re-capturing
    if (retryMode && pendingBlobRef.current) {
      setIsSubmitting(true);
      setLastResult(null);
      await uploadAndSubmit(pendingBlobRef.current);
      return;
    }

    // UX-03: synchronous guard
    if (isSubmitting || !videoRef.current) return;
    if (capturedCountRef.current >= remainingPrints) return;
    capturedCountRef.current += 1;
    setIsSubmitting(true);
    setLastResult(null);

    setBlackFrame(true);
    await new Promise(r => setTimeout(r, 25));
    setBlackFrame(false);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.save();
      // BUG-02: apply vintage filter to canvas so captured pixels match the live preview
      if (isVintage) ctx.filter = vintageStyle;
      if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Pass canvas directly so compressImage preserves the baked-in vintage pixels
      const blob = await compressImage(canvas);
      await uploadAndSubmit(blob);
    } catch (err) {
      console.error('[MagnetCamera] capture failed:', err);
      capturedCountRef.current = Math.max(0, capturedCountRef.current - 1);
      setLastResult('error');
      setIsSubmitting(false);
      setTimeout(() => setLastResult(null), 2500);
    }
  };

  // File-picker path for IG/FB in-app browsers
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isQuotaExhausted) { setShowQuotaModal(true); return; }
    if (capturedCountRef.current >= remainingPrints) return;
    capturedCountRef.current += 1;
    setIsSubmitting(true);
    setLastResult(null);
    try {
      const blob = await compressImage(file);
      await uploadAndSubmit(blob);
    } catch (err) {
      console.error('[MagnetCamera] file upload failed:', err);
      capturedCountRef.current = Math.max(0, capturedCountRef.current - 1);
      setLastResult('error');
      setIsSubmitting(false);
      setTimeout(() => setLastResult(null), 2500);
    }
    e.target.value = ''; // allow same file to be re-selected if needed
  };

  // ── In-app browser fallback ──────────────────────────────────────────────
  if (cameraFailed) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
        <button onClick={onClose} className="absolute top-12 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="w-20 h-20 rounded-3xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-6">
          <CameraOff className="w-9 h-9 text-violet-400" />
        </div>
        <h3 className="text-white font-black text-xl mb-2">נפתח בתוך אפליקציה</h3>
        <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-xs">
          הדפדפן הפנימי של אינסטגרם / פייסבוק לא תומך בגישה ישירה למצלמה.
          לחצו על הכפתור כדי לצלם.
        </p>
        <p className={`text-sm font-bold mb-6 ${isQuotaExhausted ? 'text-red-400' : 'text-violet-400'}`}>
          {isQuotaExhausted ? 'מכסת ההדפסות הסתיימה' : `נותרו ${remainingPrints} הדפסות`}
        </p>
        {lastResult === 'success' && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 mb-4">
            <CheckCircle className="w-4 h-4" /><span className="text-sm font-semibold">נשלח להדפסה!</span>
          </div>
        )}
        {lastResult === 'error' && (
          <div className="px-5 py-3 rounded-full bg-red-500/25 border border-red-500/40 text-red-300 mb-4">
            <span className="text-sm font-semibold">שגיאה, נסו שוב</span>
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting || isQuotaExhausted}
          className="w-full max-w-xs py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-lg rounded-2xl disabled:opacity-50 transition-colors flex items-center justify-center gap-3 mb-3"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {isSubmitting ? 'שולח להדפסה...' : 'צלמו תמונה'}
        </button>
        <button onClick={onClose} className="text-white/40 text-sm py-2 hover:text-white/60 transition-colors">ביטול</button>
      </div>
    );
  }

  // ── Main camera UI ────────────────────────────────────────────────────────
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

      {/* Offline retry banner */}
      {retryMode && (
        <div className="absolute top-28 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/25 border border-orange-500/40 text-orange-300 backdrop-blur-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">חיבור אינטרנט נכשל — לחצו לנסות שוב</span>
          </div>
        </div>
      )}

      {/* Feedback overlay */}
      {lastResult && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-50 pointer-events-none">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl border ${lastResult === 'success' ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300' : 'bg-red-500/25 border-red-500/40 text-red-300'}`}>
            {lastResult === 'success'
              ? <><CheckCircle className="w-4 h-4" /><span className="text-sm font-semibold">נשלח להדפסה!</span></>
              : <span className="text-sm font-semibold">{retryMode ? 'חיבור נכשל — לחצו שוב לניסיון חוזר' : 'שגיאה, נסו שוב'}</span>
            }
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-50 flex items-center justify-center gap-10 px-8 pt-6"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)` }}>
        <button onClick={() => setIsVintage(v => !v)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${isVintage ? 'bg-yellow-500/25 border-yellow-500/40 text-yellow-300' : 'bg-black/40 border-white/20 text-white/50'}`}>
          V
        </button>

        {/* Shutter — orange ring in retry mode, locked icon when quota exhausted */}
        <button onClick={captureAndPrint} disabled={isSubmitting || isLoading}
          className={`relative w-20 h-20 rounded-full p-1.5 bg-transparent disabled:opacity-50 transition-transform active:scale-95 border-[3px] ${retryMode ? 'border-orange-400/80' : 'border-white/80'}`}>
          {isSubmitting
            ? <div className="w-full h-full rounded-full bg-white/80 flex items-center justify-center"><Loader2 className="w-6 h-6 text-black animate-spin" /></div>
            : retryMode
            ? <div className="w-full h-full rounded-full bg-orange-500/30 flex items-center justify-center"><Upload className="w-6 h-6 text-orange-300" /></div>
            : isQuotaExhausted
            ? <div className="w-full h-full rounded-full bg-white/30 flex items-center justify-center"><Lock className="w-6 h-6 text-white/60" /></div>
            : <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
          }
        </button>

        <button onClick={() => setIsFrontCamera(f => !f)} className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center">
          <RotateCw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Quota exhausted modal — bottom sheet */}
      {showQuotaModal && (
        <div className="absolute inset-0 z-[200] flex items-end" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuotaModal(false)} />
          <div className="relative w-full bg-[#111] rounded-t-3xl border-t border-white/10 px-6 pb-10 pt-5 shadow-2xl"
            style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)` }}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white font-black text-lg leading-snug mb-2">מכסת ההדפסות הסתיימה</p>
                <p className="text-white/55 text-sm leading-relaxed">
                  ניצלת את כל ההדפסות שלך לאירוע זה. נשמח להדפיס עבורך תמונות נוספות בעמדת המפעיל!
                </p>
              </div>
              <button onClick={() => setShowQuotaModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <button onClick={() => setShowQuotaModal(false)} className="mt-5 w-full py-3.5 bg-white/8 border border-white/12 text-white/80 font-semibold rounded-2xl hover:bg-white/12 transition-all text-sm">
              הבנתי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
