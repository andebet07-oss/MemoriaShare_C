import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Zap, ZapOff, CameraOff, Loader2, Upload } from 'lucide-react';
import MagnetReview from './MagnetReview';

const VINTAGE_FILTER = 'sepia(0.4) contrast(0.85) brightness(1.1) saturate(1.2)';

export default function MagnetCamera({ event, userId, remainingPrints, onClose, onPrintJobCreated }) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const videoTrackRef = useRef(null);
  const fileInputRef  = useRef(null);
  const capturingRef  = useRef(false); // prevents double-tap on shutter

  const [isFrontCamera,    setIsFrontCamera]    = useState(false);
  const [flashMode,        setFlashMode]        = useState('off');
  const [isVintage,        setIsVintage]        = useState(false);
  const [isLoading,        setIsLoading]        = useState(true);
  const [cameraError,      setCameraError]      = useState(null);
  const [cameraFailed,     setCameraFailed]     = useState(false);
  const [shutterEffect,    setShutterEffect]    = useState(false);
  const [blackFrame,       setBlackFrame]       = useState(false);
  const [frontFlash,       setFrontFlash]       = useState(false);
  const [mode,             setMode]             = useState('camera'); // 'camera' | 'review'
  const [capturedDataURL,  setCapturedDataURL]  = useState(null);

  // Start / stop camera when entering / leaving camera mode or switching lens
  useEffect(() => {
    if (mode !== 'camera') return;
    startCamera();
    return () => stopCamera();
  }, [isFrontCamera, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
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
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920 }, height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (e) {
        if (e.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: isFrontCamera ? 'user' : 'environment' },
            audio: false,
          });
        } else if (['NotAllowedError', 'NotFoundError', 'NotReadableError'].includes(e.name)) {
          throw e;
        } else {
          // Sandboxed WebView (IG / FB in-app browser)
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
        NotAllowedError:  'הגישה למצלמה נדחתה. אנא אפשרו הרשאות בהגדרות.',
        NotFoundError:    'לא נמצאה מצלמה במכשיר.',
        NotReadableError: 'המצלמה תפוסה על ידי אפליקציה אחרת.',
      };
      setCameraError(map[err.name] || 'לא ניתן לגשת למצלמה. אנא נסו בדפדפן אחר.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    videoTrackRef.current = null;
  };

  // Hardware torch with front-flash fallback
  const toggleFlash = async () => {
    const next = flashMode === 'off' ? 'on' : 'off';
    setFlashMode(next);
    const capabilities = videoTrackRef.current?.getCapabilities?.() ?? {};
    if (capabilities.torch) {
      await videoTrackRef.current
        .applyConstraints({ advanced: [{ torch: next === 'on' }] })
        .catch(() => {});
    } else if (next === 'on') {
      // Software front-flash: brief white overlay
      setFrontFlash(true);
      setTimeout(() => setFrontFlash(false), 600);
    }
  };

  // Capture video frame → dataURL → switch to review
  const handleCapture = async () => {
    if (!videoRef.current || isLoading || remainingPrints <= 0 || capturingRef.current) return;
    capturingRef.current = true;

    // Shutter animation
    setBlackFrame(true);
    await new Promise(r => setTimeout(r, 25));
    setBlackFrame(false);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.save();
    if (isVintage)     { ctx.filter = VINTAGE_FILTER; }
    if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataURL = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataURL(dataURL);
    setMode('review');  // stopCamera fires via useEffect cleanup
  };

  // Return to camera from review screen
  const handleRetake = () => {
    setCapturedDataURL(null);
    setMode('camera'); // startCamera fires via useEffect
  };

  // File-picker path (IG / FB in-app browser) → go straight to review
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataURL = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    setCapturedDataURL(dataURL);
    setMode('review');
    e.target.value = '';
  };

  // ── Review mode ─────────────────────────────────────────────────────────────
  if (mode === 'review' && capturedDataURL) {
    return (
      <MagnetReview
        imageDataURL={capturedDataURL}
        event={event}
        userId={userId}
        onRetake={handleRetake}
        onPrintJobCreated={onPrintJobCreated}
      />
    );
  }

  // ── In-app browser fallback ──────────────────────────────────────────────────
  if (cameraFailed) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          onClick={onClose}
          className="absolute top-12 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-xs py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-colors"
        >
          <Upload className="w-5 h-5" />
          צלמו תמונה
        </button>
        <button
          onClick={onClose}
          className="text-white/40 text-sm py-2 mt-3 hover:text-white/60 transition-colors"
        >
          ביטול
        </button>
      </div>
    );
  }

  // ── Main camera UI ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none" dir="rtl">

      {/* Flash overlays */}
      <div className={`absolute inset-0 bg-black z-[115] pointer-events-none transition-opacity duration-75 ${blackFrame ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-80' : 'opacity-0'}`} />
      <div
        className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }}
      />

      {/* Live viewfinder */}
      {!cameraError && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: isFrontCamera ? 'scaleX(-1)' : 'none',
            filter: isVintage ? VINTAGE_FILTER : 'none',
          }}
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera permission error */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-zinc-900">
          <CameraOff className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-sm leading-relaxed">{cameraError}</p>
          <button onClick={onClose} className="mt-6 bg-white text-black px-8 py-3 rounded-full font-bold">
            חזרה
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-5 pt-12 pb-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Event name + quota */}
        <div className="text-center">
          <p className="text-white font-semibold text-sm drop-shadow-lg leading-tight">{event.name}</p>
          <p className={`text-xs drop-shadow-lg mt-0.5 ${remainingPrints <= 0 ? 'text-red-400 font-bold' : 'text-white/65'}`}>
            {remainingPrints <= 0 ? 'מכסת ההדפסות הסתיימה' : `נותרו ${remainingPrints} הדפסות`}
          </p>
        </div>

        {/* Vintage toggle — subtle, top-right */}
        <button
          onClick={() => setIsVintage(v => !v)}
          className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center text-xs font-black transition-all active:scale-90 ${
            isVintage
              ? 'bg-yellow-400/25 border-yellow-400/60 text-yellow-300'
              : 'bg-black/45 border-white/20 text-white/35'
          }`}
        >
          V
        </button>
      </div>

      {/* ── Bottom controls: Flash | Shutter | Flip ── */}
      <div
        className="absolute bottom-0 inset-x-0 z-50 flex items-center justify-center gap-8 px-8"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 28px)` }}
      >
        {/* Flash */}
        <button
          onClick={toggleFlash}
          className={`w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all active:scale-90 ${
            flashMode === 'on'
              ? 'bg-yellow-400/25 border-yellow-400/60'
              : 'bg-black/45 border-white/20'
          }`}
        >
          {flashMode === 'on'
            ? <Zap    className="w-5 h-5 text-yellow-400" />
            : <ZapOff className="w-5 h-5 text-white/60" />
          }
        </button>

        {/* Shutter */}
        <button
          onClick={handleCapture}
          disabled={isLoading || remainingPrints <= 0}
          className="w-20 h-20 rounded-full border-[3px] border-white/80 p-1.5 disabled:opacity-35 active:scale-95 transition-transform"
        >
          {isLoading
            ? <div className="w-full h-full rounded-full bg-white/25 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            : <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
          }
        </button>

        {/* Flip camera */}
        <button
          onClick={() => setIsFrontCamera(f => !f)}
          className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <RotateCw className="w-5 h-5 text-white/65" />
        </button>
      </div>
    </div>
  );
}
