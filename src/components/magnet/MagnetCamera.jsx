import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Zap, ZapOff, CameraOff, Loader2, Upload, Film } from 'lucide-react';
import MagnetReview from './MagnetReview';
import FrameStripText from './FrameStripText';
import { resolveEventFrame } from '@/lib/framesUtils';
import { formatEventDate } from '@/lib/formatEventDate';
import { reportError } from '@/lib/sentry';
import { Button } from '@/components/ui/button';

const VINTAGE_FILTER = 'sepia(0.35) contrast(0.88) brightness(1.08) saturate(1.15)';
// Round control over the camera view (floating, blurred); `on` tints it with the brand accent.
const roundControl = (on = false) => `w-12 h-12 rounded-full flex items-center justify-center border-[1.5px] backdrop-blur-lg shadow-lg active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
  on ? 'bg-brand/15 border-brand/50' : 'bg-foreground/10 border-foreground/15'
}`;
const IN_APP_UA_RE = /Instagram|FBAN|FBAV|Line|Twitter/i;

// Vintage filter pixel-loop fallback for browsers that don't support ctx.filter
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
  const startIdRef    = useRef(0);   // F08: cancellation token for overlapping startCamera calls
  const timeoutsRef   = useRef([]);  // F07: track all setTimeout ids for unmount cleanup
  // UX-03: synchronous counter for confirmed prints not yet reflected in `remainingPrints`
  // prop (parent's fetchPrintJobs is async). Resets when prop catches up.
  const capturedCountRef = useRef(0);

  const [isFront,    setIsFront]    = useState(false);
  const [flash,      setFlash]      = useState('off');
  const [vintage,    setVintage]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [camError,   setCamError]   = useState(null);
  // F03: detect in-app browser at mount; avoids trying getUserMedia where it never succeeds
  const [camFailed,  setCamFailed]  = useState(() => IN_APP_UA_RE.test(navigator.userAgent));
  const [shutterFx,  setShutterFx]  = useState(false);
  const [blackFx,    setBlackFx]    = useState(false);
  const [frontFlash, setFrontFlash] = useState(false);
  const [mode,       setMode]       = useState('camera');
  const [capturedURL, setCapturedURL] = useState(null);
  // Resolved frame for WYSIWYG viewfinder overlay
  const [eventFrame, setEventFrame]  = useState(null);

  // F07: helper that registers timeout id for cleanup
  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }

  // F07: clear all pending timeouts on unmount
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  // Resolve the event's frame (custom upload, library or fallback) for the
  // WYSIWYG viewfinder — the same resolver the composite and print path use.
  useEffect(() => {
    let cancelled = false;
    resolveEventFrame(event)
      .then((frame) => { if (!cancelled) setEventFrame(frame); })
      .catch((err) => {
        reportError('MagnetCamera.resolveEventFrame', err, { eventId: event?.id });
        if (!cancelled) setEventFrame(null);
      });
    return () => { cancelled = true; };
  }, [event?.overlay_frame_url, event?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // UX-03: reset synchronous counter once parent's fetchPrintJobs() catches up
  useEffect(() => { capturedCountRef.current = 0; }, [remainingPrints]);

  // Camera lifecycle
  useEffect(() => {
    if (mode !== 'camera' || camFailed) return;
    startCamera();
    return stopCamera;
  }, [isFront, mode]);

  // F14: Escape to close
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // Orientation change — brief blackout to hide distortion
  useEffect(() => {
    const fn = () => { setBlackFx(true); later(() => setBlackFx(false), 400); };
    window.addEventListener('orientationchange', fn);
    screen.orientation?.addEventListener?.('change', fn);
    return () => {
      window.removeEventListener('orientationchange', fn);
      screen.orientation?.removeEventListener?.('change', fn);
    };
  }, []);

  // ── Camera operations ──────────────────────────────────────────────────────────
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setCamFailed(true); setLoading(false); return; }
    // F08: stamp this invocation; stale callbacks check against current stamp
    const id = ++startIdRef.current;
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
        } else if (e.name === 'NotAllowedError' && IN_APP_UA_RE.test(navigator.userAgent)) {
          // F03: in-app browser denied permission → route to file-upload fallback
          if (id !== startIdRef.current) return;
          setCamFailed(true); setLoading(false); return;
        } else if (['NotAllowedError', 'NotFoundError', 'NotReadableError'].includes(e.name)) {
          throw e;
        } else {
          setCamFailed(true); setLoading(false); return;
        }
      }
      // F08: discard result if a newer startCamera call is already running
      if (id !== startIdRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('[MagnetCamera] play():', e));
      }
      videoTrackRef.current = stream.getVideoTracks()[0];
    } catch (e) {
      if (id !== startIdRef.current) return;
      const msgs = {
        NotAllowedError:  'הגישה למצלמה נדחתה. אנא אפשרו הרשאות בהגדרות.',
        NotFoundError:    'לא נמצאה מצלמה במכשיר.',
        NotReadableError: 'המצלמה תפוסה על ידי אפליקציה אחרת.',
      };
      setCamError(msgs[e.name] || 'לא ניתן לגשת למצלמה. נסו בדפדפן אחר.');
    } finally {
      if (id === startIdRef.current) setLoading(false);
    }
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
    }
    // F04: front-flash (screen-based) now fires at capture time, not here
  }

  async function handleCapture() {
    if (!videoRef.current || loading || capturingRef.current) return;
    // F09 + UX-03: subtract local counter so rapid taps before prop refresh are blocked
    if (remainingPrints - capturedCountRef.current <= 0) {
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      return;
    }
    const v = videoRef.current;
    // F01: guard against capture before video stream delivers first frame
    if (!v.videoWidth || !v.videoHeight) return;
    capturingRef.current = true;
    if (navigator.vibrate) navigator.vibrate(40);

    try {
      // F04: front-flash fires at capture, not at button toggle
      const cap = videoTrackRef.current?.getCapabilities?.() ?? {};
      const needFrontFlash = flash === 'on' && !cap.torch;
      if (needFrontFlash) {
        setFrontFlash(true);
        await new Promise(r => later(r, 50)); // let overlay illuminate the subject
      }

      // Shutter blink animation
      setBlackFx(true);
      await new Promise(r => later(r, 25));
      setBlackFx(false);
      setShutterFx(true);
      later(() => setShutterFx(false), 150);
      if (needFrontFlash) later(() => setFrontFlash(false), 200);

      // Capture to canvas — center-crop to 3:4 to match viewfinder (WYSIWYG)
      const VW = v.videoWidth, VH = v.videoHeight;
      const TARGET_AR = 3 / 4;
      let sx = 0, sy = 0, sw = VW, sh = VH;
      if (VW / VH > TARGET_AR) {
        sw = Math.round(VH * TARGET_AR);
        sx = Math.round((VW - sw) / 2);
      } else if (VW / VH < TARGET_AR) {
        sh = Math.round(VW / TARGET_AR);
        sy = Math.round((VH - sh) / 2);
      }
      const c = canvasRef.current;
      c.width = sw; c.height = sh;
      const ctx = c.getContext('2d');
      ctx.save();
      if (isFront) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      // F05: prefer ctx.filter (GPU, near-zero cost) over pixel-loop
      if (vintage && typeof ctx.filter !== 'undefined') ctx.filter = VINTAGE_FILTER;
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.restore();
      // F05: pixel-loop only as fallback for browsers without ctx.filter
      if (vintage && typeof ctx.filter === 'undefined') {
        applyVintagePixels(ctx, c.width, c.height);
      }

      setCapturedURL(c.toDataURL('image/jpeg', 0.92));
      setMode('review');
    } finally {
      // F02: always release lock so shutter is usable even if drawImage threw
      capturingRef.current = false;
    }
  }

  function handleRetake() { setCapturedURL(null); setMode('camera'); capturingRef.current = false; }

  function handlePrintJobCreated() {
    // UX-03: increment synchronously so a tap immediately after returning from review
    // sees the just-consumed print before parent's fetchPrintJobs() resolves.
    capturedCountRef.current++;
    setCapturedURL(null);
    setMode('camera');
    capturingRef.current = false;
    onPrintJobCreated?.();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });
    setCapturedURL(url); setMode('review'); e.target.value = '';
  }

  // ── Review mode ────────────────────────────────────────────────────────────────
  if (mode === 'review' && capturedURL) {
    return <MagnetReview imageDataURL={capturedURL} event={event} userId={userId} onRetake={handleRetake} onPrintJobCreated={handlePrintJobCreated} />;
  }

  // ── In-app browser fallback ────────────────────────────────────────────────────
  if (camFailed) return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 text-center bg-background bg-glow" dir="rtl">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <button onClick={onClose} aria-label="סגור"
        className="absolute top-12 right-5 w-10 h-10 rounded-full bg-foreground/10 border border-foreground/15 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
        <X className="w-4 h-4 text-foreground" />
      </button>
      <div className="w-20 h-20 rounded-2xl bg-brand/15 border border-brand/25 flex items-center justify-center mb-6">
        <CameraOff className="w-9 h-9 text-brand" />
      </div>
      <h3 className="text-foreground font-semibold text-xl mb-2">נפתח בתוך אפליקציה</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[260px]">
        הדפדפן הפנימי של אינסטגרם / פייסבוק לא תומך בגישה ישירה למצלמה.
      </p>
      <Button size="lg" onClick={() => fileInputRef.current?.click()}>
        <Upload className="!size-5" /> צלמו תמונה
      </Button>
    </div>
  );

  // F11: normalize date safely (event.date may be string 'YYYY-MM-DD', ISO, or Date object)
  const dateFmt = formatEventDate(event?.date) || null;

  const quotaId = 'magnet-camera-quota';
  const isDisabled = loading || (remainingPrints - capturedCountRef.current) <= 0;

  // ── Main camera UI ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none bg-background bg-glow" dir="rtl"
      role="dialog" aria-modal="true" aria-label="מצלמה לאירוע">

      {/* Flash overlays */}
      <div className={`absolute inset-0 bg-black z-[115] pointer-events-none transition-opacity duration-75 ${blackFx ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-150 ${shutterFx ? 'opacity-80' : 'opacity-0'}`} />
      <div className={`absolute inset-0 bg-[#FFF5EC] z-[101] pointer-events-none transition-opacity ${frontFlash ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: frontFlash ? '50ms' : '200ms' }} />

      {/* F16: role="alert" so screen readers announce camera errors immediately */}
      {camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50" role="alert">
          <CameraOff className="w-10 h-10 text-status-rejected mb-3" />
          <p className="text-foreground text-sm leading-relaxed mb-5">{camError}</p>
          {/* F10: "נסה שוב" lets user retry without full exit */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={startCamera}>נסה שוב</Button>
            <Button onClick={onClose}>חזרה</Button>
          </div>
        </div>
      )}

      {/* ── Header — navigation + status only (capture tools live at the bottom) ── */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 pt-12 pb-3">
        {/* F06: aria-label on all icon buttons */}
        <button onClick={onClose} aria-label="סגור מצלמה"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/10 border border-foreground/15 backdrop-blur-md active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* Quota chip — slim single line; amber at ≤3, red when exhausted */}
        <div id={quotaId}
          className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full border backdrop-blur-md ${
            remainingPrints <= 0 ? 'bg-status-rejected/15 border-status-rejected/30' : 'bg-foreground/10 border-foreground/15'
          }`}>
          {remainingPrints <= 0 ? (
            <span className="text-status-rejected text-xs font-semibold leading-none">המכסה הסתיימה</span>
          ) : (
            <>
              <span className={`text-base font-semibold leading-none tabular-nums ${remainingPrints <= 3 ? 'text-status-pending' : 'text-foreground'}`}>
                {remainingPrints}
              </span>
              <span className="text-xs text-foreground/60 font-medium leading-none">נותרו</span>
            </>
          )}
        </div>
      </div>

      {/* ── WYSIWYG viewfinder — shows the real assigned frame around the live feed ── */}
      {!camError && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 72, paddingBottom: 140 }}>
          {eventFrame?.isPng ? (
            // PNG frame WYSIWYG viewfinder:
            //   - An invisible copy of the frame img (width=100%, height=auto)
            //     establishes the container's natural aspect ratio.
            //   - Video is positioned absolutely using hole_bbox CSS percentages.
            //   - The real frame PNG is overlaid on top (same layer order as the compositor).
            // Because hole_bbox is normalised to the frame PNG's own W×H, the
            // percentage positions map exactly onto the container regardless of
            // the frame's actual pixel dimensions.
            (() => {
              const hb = eventFrame.hole_bbox;
              return (
                <div style={{
                  position: 'relative',
                  width: 'min(74vw, 288px)',
                  transform: 'rotate(-0.8deg)',
                  boxShadow: '0 28px 72px rgba(0,0,0,0.8), 0 4px 18px rgba(0,0,0,0.5)',
                }}>
                  {/* Transparent placeholder — makes the container adopt the frame's natural height */}
                  <img src={eventFrame.image_url} alt="" aria-hidden="true"
                    style={{ display: 'block', width: '100%', height: 'auto', visibility: 'hidden', pointerEvents: 'none' }} />

                  {/* Live video clipped to the hole bbox */}
                  <div style={{
                    position: 'absolute',
                    left:   `${hb.x * 100}%`,
                    top:    `${hb.y * 100}%`,
                    width:  `${hb.w * 100}%`,
                    height: `${hb.h * 100}%`,
                    overflow: 'hidden',
                    background: '#111',
                  }}>
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900">
                        <Loader2 className="w-7 h-7 text-white/25 animate-spin" />
                      </div>
                    )}
                    <video ref={videoRef} autoPlay playsInline muted
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        transform: isFront ? 'scaleX(-1)' : 'none',
                        filter: vintage ? VINTAGE_FILTER : 'none',
                      }} />
                  </div>

                  {/* Real frame PNG overlaid on top */}
                  <img src={eventFrame.image_url} alt="" aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

                  {/* Live design text (name + date + ♥) so the guest sees the full
                      design, not a blank white strip. Mirrors compositePngFrame. */}
                  <FrameStripText textConfig={eventFrame.text_config} eventName={event?.name} dateFmt={dateFmt} />
                </div>
              );
            })()
          ) : (
            // Fallback: generic white polaroid (no frame or procedural frame)
            <div className="flex flex-col bg-white"
              style={{ width: 'min(74vw, 288px)', borderRadius: 2, padding: '7px 7px 0', boxShadow: '0 28px 72px rgba(0,0,0,0.8), 0 4px 18px rgba(0,0,0,0.5)', transform: 'rotate(-0.8deg)' }}>
              <div className="relative overflow-hidden bg-zinc-900" style={{ aspectRatio: '3/4' }}>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-900">
                    <Loader2 className="w-7 h-7 text-white/25 animate-spin" />
                  </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: isFront ? 'scaleX(-1)' : 'none', filter: vintage ? VINTAGE_FILTER : 'none' }} />
              </div>
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
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* ── Bottom controls ── */}
      {/* 3-zone grid keeps the shutter dead-centre on screen while the effect
          toggles (flash, filter) cluster on one side and flip on the other. */}
      {!camError && (
        <div className="absolute bottom-0 inset-x-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)' }}>

          {/* Left zone — effect toggles */}
          <div className="flex items-center justify-center gap-5">
            {/* Flash — F06 */}
            <button onClick={toggleFlash}
              aria-label={flash === 'on' ? 'כבה פלאש' : 'הפעל פלאש'} aria-pressed={flash === 'on'}
              className={roundControl(flash === 'on')}>
              {flash === 'on' ? <Zap className="w-5 h-5 text-brand" /> : <ZapOff className="w-5 h-5 text-foreground/70" />}
            </button>

            {/* Vintage film filter — grouped with the other capture controls */}
            <button onClick={() => setVintage(v => !v)}
              aria-label={vintage ? 'בטל פילטר וינטאג׳' : 'הפעל פילטר וינטאג׳'} aria-pressed={vintage}
              className={roundControl(vintage)}>
              <Film className={`w-5 h-5 ${vintage ? 'text-brand' : 'text-foreground/70'}`} />
            </button>
          </div>

          {/* Centre zone — shutter (F01, F02, F06, F09) */}
          <button
            onClick={handleCapture}
            aria-label="צלם תמונה"
            aria-disabled={isDisabled}
            aria-describedby={quotaId}
            className={`relative w-20 h-20 flex items-center justify-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background ${isDisabled ? 'opacity-25' : ''}`}>
            <div className="absolute inset-0 rounded-full border-[3.5px] border-foreground/70" />
            <div className={`w-[61px] h-[61px] rounded-full ${loading ? 'bg-secondary' : 'bg-primary shadow-indigo-glow'}`} />
            {loading && <Loader2 className="absolute w-5 h-5 text-foreground/70 animate-spin" />}
          </button>

          {/* Right zone — camera flip (F06) */}
          <div className="flex items-center justify-center">
            <button onClick={() => setIsFront(f => !f)} aria-label="החלף מצלמה קדמית/אחורית"
              className={roundControl()}>
              <RotateCw className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
