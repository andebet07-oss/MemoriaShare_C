import { useState, useRef, useCallback, useMemo } from 'react';
import { Trash2, Loader2, CheckCircle, Smile, X } from 'lucide-react';
import { getStickerPack } from './stickerPacks';
import memoriaService from '@/components/memoriaService';
import { compressImage } from '@/functions/processImage';

// Display size of emoji stickers on-screen (px)
const EMOJI_SIZE_PX = 54;
// Emoji font size relative to canvas width (for compositing)
const EMOJI_CANVAS_RATIO = 0.13;
// Text sticker font size relative to canvas width
const TEXT_CANVAS_RATIO = 0.055;

// Draw the semi-transparent event overlay at the bottom of the canvas
function drawOverlay(ctx, w, h, eventName, eventDate) {
  const overlayH = h * 0.22;
  const grd = ctx.createLinearGradient(0, h - overlayH, 0, h);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.80)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, h - overlayH, w, overlayH);

  ctx.textAlign = 'center';

  const nameSz = Math.round(w * 0.066);
  ctx.font = `bold ${nameSz}px Heebo, Assistant, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(eventName || '', w / 2, h - overlayH * 0.38);

  if (eventDate) {
    const dateSz = Math.round(w * 0.04);
    ctx.font = `${dateSz}px Heebo, Assistant, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const formatted = new Intl.DateTimeFormat('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(eventDate + 'T00:00:00'));
    ctx.fillText(formatted, w / 2, h - overlayH * 0.16);
  }
}

// Draw a single sticker onto the canvas at its fractional (x, y) position
function drawSticker(ctx, sticker, w, h) {
  const cx = sticker.x * w;
  const cy = sticker.y * h;

  if (sticker.type === 'emoji') {
    const sz = Math.round(w * EMOJI_CANVAS_RATIO);
    ctx.font = `${sz}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.content, cx, cy);
  } else {
    const sz = Math.round(w * TEXT_CANVAS_RATIO);
    ctx.font = `bold ${sz}px Heebo, Assistant, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = sz * 0.2;
    ctx.strokeStyle = 'rgba(0,0,0,0.88)';
    ctx.strokeText(sticker.content, cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sticker.content, cx, cy);
  }
}

export default function MagnetReview({ imageDataURL, event, userId, onRetake, onPrintJobCreated }) {
  const containerRef = useRef(null);
  const [stickers, setStickers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [draggingUid, setDraggingUid] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'error'

  const stickerPack = useMemo(() => getStickerPack(event?.name || ''), [event?.name]);

  const formattedDate = useMemo(() => {
    if (!event?.date) return null;
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(event.date + 'T00:00:00'));
  }, [event?.date]);

  // ── Sticker drag ────────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e, uid) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = stickers.find(s => s.uid === uid);
    if (!s) return;
    dragOffsetRef.current = {
      x: e.clientX - rect.left - s.x * rect.width,
      y: e.clientY - rect.top  - s.y * rect.height,
    };
    setDraggingUid(uid);
  }, [stickers]);

  const onPointerMove = useCallback((e) => {
    if (!draggingUid) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left - dragOffsetRef.current.x) / rect.width));
    const y = Math.max(0.04, Math.min(0.96, (e.clientY - rect.top  - dragOffsetRef.current.y) / rect.height));
    setStickers(prev => prev.map(s => s.uid === draggingUid ? { ...s, x, y } : s));
  }, [draggingUid]);

  const onPointerUp = useCallback(() => setDraggingUid(null), []);

  // ── Sticker add / remove ────────────────────────────────────────────────────

  const addSticker = (def) => {
    setStickers(prev => [...prev, {
      uid: `${def.id}-${Date.now()}`,
      type: def.type,
      content: def.content,
      x: 0.5,
      y: 0.38,
    }]);
    setShowPicker(false);
  };

  const removeSticker = (uid) => {
    setStickers(prev => prev.filter(s => s.uid !== uid));
  };

  // ── Canvas composite + upload ───────────────────────────────────────────────

  const compositeAndSubmit = async () => {
    setIsSubmitting(true);
    setLastResult(null);
    let success = false;
    let photo = null;

    try {
      const img = new Image();
      img.src = imageDataURL;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);
      drawOverlay(ctx, canvas.width, canvas.height, event?.name, event?.date);
      for (const s of stickers) drawSticker(ctx, s, canvas.width, canvas.height);

      const blob = await compressImage(canvas);
      const file = new File([blob], `magnet-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });

      const { file_url, path } = await memoriaService.storage.upload(file, event.id);
      photo = await memoriaService.photos.create({
        event_id: event.id, file_url, path, created_by: userId,
        is_approved: true, is_hidden: false, filter_applied: 'none',
      });
      await memoriaService.printJobs.create({
        event_id: event.id, photo_id: photo.id, guest_user_id: userId,
      });

      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      success = true;
      setLastResult('success');
      onPrintJobCreated();
    } catch (err) {
      console.error('[MagnetReview] compositeAndSubmit failed:', err);
      if (photo?.id) memoriaService.photos.delete(photo.id).catch(() => {});
      setLastResult('error');
    } finally {
      setIsSubmitting(false);
      if (success) setTimeout(() => setLastResult(null), 3000);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none" dir="rtl">

      {/* ── Photo + sticker canvas ── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: draggingUid ? 'none' : 'auto' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Photo */}
        <img
          src={imageDataURL}
          alt="captured"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Event overlay — mirrors canvas composite */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '22%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.80))' }}
        >
          <div className="absolute bottom-[14%] inset-x-0 text-center px-6">
            <p
              className="text-white/92 font-bold text-xl leading-tight drop-shadow-lg"
              style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}
            >
              {event?.name}
            </p>
            {formattedDate && (
              <p
                className="text-white/55 text-sm mt-0.5"
                style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}
              >
                {formattedDate}
              </p>
            )}
          </div>
        </div>

        {/* Draggable stickers */}
        {stickers.map(s => (
          <div
            key={s.uid}
            onPointerDown={e => onPointerDown(e, s.uid)}
            className="absolute"
            style={{
              left: `${s.x * 100}%`,
              top:  `${s.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
              userSelect: 'none',
              zIndex: draggingUid === s.uid ? 60 : 50,
              cursor: draggingUid === s.uid ? 'grabbing' : 'grab',
              filter: draggingUid === s.uid
                ? 'drop-shadow(0 6px 16px rgba(0,0,0,0.55))'
                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
              transition: draggingUid === s.uid ? 'none' : 'filter 0.15s',
            }}
          >
            {s.type === 'emoji' ? (
              <span style={{ fontSize: EMOJI_SIZE_PX, lineHeight: 1, display: 'block' }}>
                {s.content}
              </span>
            ) : (
              <span
                className="font-black block whitespace-nowrap"
                style={{
                  fontSize: '22px',
                  lineHeight: 1.2,
                  color: '#fff',
                  WebkitTextStroke: '2px rgba(0,0,0,0.88)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  fontFamily: "'Heebo', 'Assistant', sans-serif",
                }}
              >
                {s.content}
              </span>
            )}

            {/* Long-press delete badge — shown when this sticker is NOT dragging and stickers > 0 */}
            {draggingUid !== s.uid && (
              <button
                onPointerDown={e => { e.stopPropagation(); removeSticker(s.uid); }}
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-black/70 border border-white/30 flex items-center justify-center z-10"
                style={{ touchAction: 'none' }}
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            )}
          </div>
        ))}

        {/* Feedback toast */}
        {lastResult && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-[70] pointer-events-none">
            <div className={`flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl border shadow-xl ${
              lastResult === 'success'
                ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/25 border-red-500/40 text-red-300'
            }`}>
              {lastResult === 'success'
                ? <><CheckCircle className="w-4 h-4 shrink-0" /><span className="text-sm font-semibold">נשלח להדפסה!</span></>
                : <span className="text-sm font-semibold">שגיאה — נסו שוב</span>
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom controls bar ── */}
      <div
        className="bg-[#0a0a0a] border-t border-white/[0.08] flex items-center justify-between px-7 shrink-0"
        style={{ paddingTop: '14px', paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 14px)` }}
      >
        {/* Retake */}
        <button
          onClick={onRetake}
          disabled={isSubmitting}
          className="w-12 h-12 rounded-full bg-white/[0.07] border border-white/[0.12] flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
          aria-label="צלם מחדש"
        >
          <Trash2 className="w-5 h-5 text-white/60" />
        </button>

        {/* Send to print */}
        <button
          onClick={compositeAndSubmit}
          disabled={isSubmitting}
          className="flex-1 mx-5 h-14 bg-white text-black font-black text-base rounded-2xl disabled:opacity-50 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {isSubmitting
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : 'שלח להדפסה'
          }
        </button>

        {/* Sticker picker trigger */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-12 h-12 rounded-full bg-white/[0.07] border border-white/[0.12] flex items-center justify-center active:scale-90 transition-transform"
          aria-label="הוסף מדבקה"
        >
          <Smile className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* ── Sticker picker bottom sheet ── */}
      {showPicker && (
        <div className="fixed inset-0 z-[200] flex items-end" dir="rtl">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />

          <div
            className="relative w-full bg-white rounded-t-3xl animate-in slide-in-from-bottom-4 duration-200 shadow-2xl"
            style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)` }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mt-3 mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 mb-4">
              <p className="text-black font-bold text-base">הוסיפו מדבקה</p>
              <button
                onClick={() => setShowPicker(false)}
                className="w-8 h-8 rounded-full bg-black/[0.07] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-black/60" />
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2.5 px-5 pb-2 max-h-56 overflow-y-auto">
              {stickerPack.map(def => (
                <button
                  key={def.id}
                  onClick={() => addSticker(def)}
                  className="aspect-square rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center active:scale-90 transition-transform overflow-hidden p-1.5"
                >
                  {def.type === 'emoji' ? (
                    <span style={{ fontSize: '38px', lineHeight: 1 }}>{def.content}</span>
                  ) : (
                    <span
                      className="text-[10px] font-black text-center text-black leading-tight"
                      style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}
                    >
                      {def.content}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
