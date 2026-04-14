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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-violet-50 via-pink-50 to-orange-50 overflow-hidden select-none flex flex-col items-center justify-between" dir="rtl">

      {/* Flash overlays */}
      <div className={`absolute inset-0 bg-black z-[115] pointer-events-none transition-opacity duration-75 ${blackFrame ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-80' : 'opacity-0'}`} />
      <div
        className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }}
      />

      {/* Polaroid frame card with video inset */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ width: '280px', aspectRatio: '4 / 5' }}>
          {/* Video inset with padding */}
          <div className="p-5 bg-gray-100 h-3/4 flex items-center justify-center overflow-hidden rounded">
            {!cameraError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                  filter: isVintage ? VINTAGE_FILTER : 'none',
                }}
              />
            ) : (
              <CameraOff className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Event info below video */}
          <div className="p-4 text-center bg-white">
            <h3 className="font-serif text-lg font-bold text-gray-800 leading-tight mb-1">{event.name}</h3>
            <p className="text-xs text-gray-500">{new Date(event.date || Date.now()).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Camera permission error modal */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm">
            <CameraOff className="w-12 h-12 text-red-500 mb-4 mx-auto" />
            <p className="text-gray-800 text-sm leading-relaxed mb-6">{cameraError}</p>
            <button onClick={onClose} className="w-full bg-gray-900 text-white px-6 py-3 rounded-full font-bold">
              חזרה
            </button>
          </div>
        </div>
      )}

      {/* ── Header: Close + Vintage Toggle ── */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 pt-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center active:scale-90 transition-transform hover:bg-white"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Vintage toggle */}
        <button
          onClick={() => setIsVintage(v => !v)}
          className={`w-12 h-12 rounded-full backdrop-blur-sm shadow-md flex items-center justify-center text-sm font-bold transition-all active:scale-90 ${
            isVintage
              ? 'bg-amber-300 text-amber-900'
              : 'bg-white/80 text-gray-600'
          }`}
          title="Vintage filter"
        >
          V
        </button>
      </div>

      {/* ── Bottom controls: Flash | Shutter | Flip ── */}
      <div
        className="absolute bottom-0 inset-x-0 z-50 flex items-center justify-center gap-6 px-8 py-8"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)` }}
      >
        {/* Flash — 48px minimum */}
        <button
          onClick={toggleFlash}
          className={`w-12 h-12 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
            flashMode === 'on'
              ? 'bg-amber-400 text-amber-900'
              : 'bg-white/80 text-gray-600'
          }`}
          title="Flash"
        >
          {flashMode === 'on'
            ? <Zap className="w-6 h-6" />
            : <ZapOff className="w-6 h-6" />
          }
        </button>

        {/* Shutter — 80px lime-green */}
        <button
          onClick={handleCapture}
          disabled={isLoading || remainingPrints <= 0}
          className="w-20 h-20 rounded-full bg-lime-400 hover:bg-lime-500 disabled:opacity-40 active:scale-95 transition-all shadow-xl flex-shrink-0 flex items-center justify-center"
          title="Capture"
        >
          {isLoading
            ? <Loader2 className="w-8 h-8 text-white animate-spin" />
            : <div className="w-16 h-16 rounded-full bg-lime-300 shadow-inner" />
          }
        </button>

        {/* Flip camera — 48px minimum */}
        <button
          onClick={() => setIsFrontCamera(f => !f)}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center active:scale-90 transition-transform flex-shrink-0 text-gray-600 hover:bg-white"
          title="Flip camera"
        >
          <RotateCw className="w-6 h-6" />
        </button>
      </div>

      {/* Quota indicator floating below polaroid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-32 text-center pointer-events-none">
        <p className={`text-sm font-semibold drop-shadow-lg ${remainingPrints <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
          {remainingPrints <= 0 ? 'מכסה הסתיימה' : `נותרו ${remainingPrints}`}
        </p>
      </div>
    </div>
  );
}
