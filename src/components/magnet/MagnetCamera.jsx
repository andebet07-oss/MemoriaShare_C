import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Zap, ZapOff, CameraOff, Loader2, Upload, Wand2 } from 'lucide-react';
import MagnetReview from './MagnetReview';

const VINTAGE = 'sepia(0.35) contrast(0.88) brightness(1.08) saturate(1.15)';
const DARK_BG  = 'radial-gradient(ellipse 120% 70% at 50% 25%, #1c0d3a 0%, #0a0a0e 55%)';

// Bake vintage filter pixel-by-pixel at capture time (robust across all browsers)
function applyVintagePixels(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h), px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i+1], b = px[i+2];
    px[i]   = 30 + ((r*0.88 + g*0.10 + b*0.02) / 255) * 200;
    px[i+1] = 25 + ((r*0.05 + g*0.90 + b*0.05) / 255) * 200;
    px[i+2] = 20 + ((r*0.05 + g*0.05 + b*0.90) / 255) * 200;
  }
  ctx.putImageData(d, 0, 0);
}

export default function MagnetCamera({ event, userId, remainingPrints, onClose, onPrintJobCreated }) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const videoTrackRef = useRef(null);
  const fileInputRef  = useRef(null);
  const capturingRef  = useRef(false);

  const [isFront,      setIsFront]      = useState(false);
  const [flash,        setFlash]        = useState('off');
  const [vintage,      setVintage]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [camError,     setCamError]     = useState(null);
  const [camFailed,    setCamFailed]    = useState(false);
  const [shutterFx,    setShutterFx]    = useState(false);
  const [blackFx,      setBlackFx]      = useState(false);
  const [frontFlash,   setFrontFlash]   = useState(false);
  const [mode,         setMode]         = useState('camera');
  const [capturedURL,  setCapturedURL]  = useState(null);

  // ── Camera lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera') return;
    startCamera();
    return stopCamera;
  }, [isFront, mode]); // eslint-disable-line

  // Volume-down physical button → shutter
  useEffect(() => {
    const fn = (e) => { if (e.code === 'VolumeDown') { e.preventDefault(); handleCapture(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [loading, flash, isFront, vintage, remainingPrints]); // eslint-disable-line

  // Orientation change — brief blackout to hide distortion
  useEffect(() => {
    const fn = () => { setBlackFx(true); setTimeout(() => setBlackFx(false), 400); };
    window.addEventListener('orientationchange', fn);
    return () => window.removeEventListener('orientationchange', fn);
  }, []);

  // ── Camera operations ──────────────────────────────────────────────────────────
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setCamFailed(true); setLoading(false); return; }
    setLoading(true); setCamError(null);
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFront ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch (e) {
        if (e.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isFront ? 'user' : 'environment' }, audio: false });
        } else if (['NotAllowedError', 'NotFoundError', 'NotReadableError'].includes(e.name)) {
          throw e;
        } else { setCamFailed(true); setLoading(false); return; }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('[MagnetCamera] play():', e));
      }
      videoTrackRef.current = stream.getVideoTracks()[0];
    } catch (e) {
      const msgs = { NotAllowedError: 'הגישה למצלמה נדחתה. אנא אפשרו הרשאות בהגדרות.', NotFoundError: 'לא נמצאה מצלמה במכשיר.', NotReadableError: 'המצלמה תפוסה על ידי אפליקציה אחרת.' };
      setCamError(msgs[e.name] || 'לא ניתן לגשת למצלמה. נסו בדפדפן אחר.');
    } finally { setLoading(false); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    videoTrackRef.current = null;
  }

  async function toggleFlash() {
    const next = flash === 'off' ? 'on' : 'off'; setFlash(next);
    const cap = videoTrackRef.current?.getCapabilities?.() ?? {};
    if (cap.torch) {
      await videoTrackRef.current.applyConstraints({ advanced: [{ torch: next === 'on' }] }).catch(() => {});
    } else if (next === 'on') { setFrontFlash(true); setTimeout(() => setFrontFlash(false), 600); }
  }

  async function handleCapture() {
    if (!videoRef.current || loading || remainingPrints <= 0 || capturingRef.current) return;
    capturingRef.current = true;
    if (navigator.vibrate) navigator.vibrate(40);

    // Shutter animation
    setBlackFx(true); await new Promise(r => setTimeout(r, 25)); setBlackFx(false);
    setShutterFx(true); setTimeout(() => setShutterFx(false), 150);

    // Capture to canvas
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    ctx.save();
    if (isFront) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0);
    ctx.restore();
    if (vintage) applyVintagePixels(ctx, c.width, c.height);

    setCapturedURL(c.toDataURL('image/jpeg', 0.92));
    setMode('review');
  }

  function handleRetake() { setCapturedURL(null); setMode('camera'); capturingRef.current = false; }

  async function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });
    setCapturedURL(url); setMode('review'); e.target.value = '';
  }

  // ── Review mode ────────────────────────────────────────────────────────────────
  if (mode === 'review' && capturedURL) {
    return <MagnetReview imageDataURL={capturedURL} event={event} userId={userId} onRetake={handleRetake} onPrintJobCreated={onPrintJobCreated} />;
  }

  // ── In-app browser fallback ────────────────────────────────────────────────────
  if (camFailed) return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 text-center" style={{ background: DARK_BG }} dir="rtl">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <button onClick={onClose} className="absolute top-12 right-5 w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
        <X className="w-4 h-4 text-white" />
      </button>
      <div className="w-20 h-20 rounded-3xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-6">
        <CameraOff className="w-9 h-9 text-violet-400" />
      </div>
      <h3 className="text-white font-black text-xl mb-2">נפתח בתוך אפליקציה</h3>
      <p className="text-white/45 text-sm leading-relaxed mb-8 max-w-[260px]">
        הדפדפן הפנימי של אינסטגרם / פייסבוק לא תומך בגישה ישירה למצלמה.
      </p>
      <button onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-7 py-4 text-[#0a0a0e] font-black text-lg rounded-2xl active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(145deg,#c2f449,#a3e635)', boxShadow: '0 0 28px rgba(163,230,53,0.4)' }}>
        <Upload className="w-5 h-5" /> צלמו תמונה
      </button>
    </div>
  );

  const dateFmt = event?.date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(event.date + 'T00:00:00'))
    : null;

  // ── Main camera UI ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none" style={{ background: DARK_BG }} dir="rtl">

      {/* Flash overlays */}
      <div className={`absolute inset-0 bg-black z-[115] pointer-events-none transition-opacity duration-75 ${blackFx ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-150 ${shutterFx ? 'opacity-80' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }} />

      {/* Camera error */}
      {camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50">
          <CameraOff className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-white text-sm leading-relaxed mb-5">{camError}</p>
          <button onClick={onClose} className="bg-white text-black px-7 py-2.5 rounded-full font-bold text-sm active:scale-95 transition-transform">חזרה</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 pt-12 pb-3">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
          <X className="w-4 h-4 text-white" />
        </button>

        <p className={`text-xs font-medium tracking-wide ${remainingPrints <= 0 ? 'text-red-400' : 'text-white/40'}`}>
          {remainingPrints <= 0 ? 'מכסת ההדפסות הסתיימה' : `נותרו ${remainingPrints} הדפסות`}
        </p>

        <button onClick={() => setVintage(v => !v)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: vintage ? 'rgba(124,134,225,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${vintage ? 'rgba(124,134,225,0.45)' : 'rgba(255,255,255,0.12)'}`, backdropFilter: 'blur(12px)' }}>
          <Wand2 className={`w-4 h-4 ${vintage ? 'text-indigo-300' : 'text-white/35'}`} />
        </button>
      </div>

      {/* ── Polaroid viewfinder ── */}
      {!camError && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 72, paddingBottom: 140 }}>
          <div className="flex flex-col bg-white"
            style={{ width: 'min(74vw, 288px)', borderRadius: 2, padding: '7px 7px 0', boxShadow: '0 28px 72px rgba(0,0,0,0.8), 0 4px 18px rgba(0,0,0,0.5)', transform: 'rotate(-0.8deg)' }}>

            {/* Live video area */}
            <div className="relative overflow-hidden bg-zinc-900" style={{ aspectRatio: '3/4' }}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900">
                  <Loader2 className="w-7 h-7 text-white/25 animate-spin" />
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: isFront ? 'scaleX(-1)' : 'none', filter: vintage ? VINTAGE : 'none' }} />
            </div>

            {/* Polaroid label strip */}
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: 11, paddingBottom: 13, gap: 3 }}>
              <span className="text-[#1a1a1a] font-bold text-[12px] leading-none text-center truncate w-full px-2"
                style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
                {event?.name || 'Memoria'}
              </span>
              {dateFmt && (
                <span className="text-[#999] text-[10px] tracking-widest"
                  style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.12em' }}>
                  {dateFmt}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* ── Bottom controls ── */}
      {!camError && (
        <div className="absolute bottom-0 inset-x-0 z-40 flex items-center justify-center gap-10"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)' }}>

          {/* Flash */}
          <button onClick={toggleFlash}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all"
            style={{ background: flash === 'on' ? 'rgba(124,134,225,0.15)' : 'rgba(255,255,255,0.07)', border: `1.5px solid ${flash === 'on' ? 'rgba(124,134,225,0.5)' : 'rgba(255,255,255,0.13)'}`, backdropFilter: 'blur(16px)', boxShadow: flash === 'on' ? '0 0 18px rgba(124,134,225,0.25)' : '0 4px 14px rgba(0,0,0,0.4)' }}>
            {flash === 'on' ? <Zap className="w-5 h-5 text-indigo-300" /> : <ZapOff className="w-5 h-5 text-white/45" />}
          </button>

          {/* Lime shutter */}
          <button onClick={handleCapture} disabled={loading || remainingPrints <= 0}
            className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-25">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full" style={{ border: '3.5px solid rgba(255,255,255,0.7)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }} />
            {/* Lime disc */}
            <div className="w-[61px] h-[61px] rounded-full"
              style={{ background: loading ? '#374151' : 'linear-gradient(145deg, #caff4a, #a3e635)', boxShadow: loading ? 'none' : '0 0 30px rgba(163,230,53,0.5), 0 3px 10px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.4)' }} />
            {loading && <Loader2 className="absolute w-5 h-5 text-white/60 animate-spin" />}
          </button>

          {/* Flip */}
          <button onClick={() => setIsFront(f => !f)}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
            <RotateCw className="w-5 h-5 text-white/45" />
          </button>
        </div>
      )}
    </div>
  );
}
