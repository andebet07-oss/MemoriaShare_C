import { useState, useRef, useCallback, useMemo } from 'react';
import { Trash2, Loader2, Smile, X } from 'lucide-react';
import { getStickerPack } from './stickerPacks';
import memoriaService from '@/components/memoriaService';
import { compressImage } from '@/functions/processImage';

const DARK_BG = 'radial-gradient(ellipse 120% 70% at 50% 25%, #1c0d3a 0%, #0a0a0e 55%)';
const EMOJI_SIZE = 52;

function drawOverlay(ctx, w, h, name, date) {
  const oh = h * 0.22;
  const g = ctx.createLinearGradient(0, h - oh, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.80)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h - oh, w, oh);
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(w * 0.066)}px Heebo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(name || '', w / 2, h - oh * 0.38);
  if (date) {
    ctx.font = `${Math.round(w * 0.04)}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(
      new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(date + 'T00:00:00')),
      w / 2, h - oh * 0.16,
    );
  }
}

function drawSticker(ctx, s, w, h) {
  const cx = s.x * w, cy = s.y * h;
  if (s.type === 'emoji') {
    ctx.font = `${Math.round(w * 0.13)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.content, cx, cy);
  } else {
    const sz = Math.round(w * 0.055);
    ctx.font = `bold ${sz}px Heebo, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = sz * 0.2; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.88)'; ctx.strokeText(s.content, cx, cy);
    ctx.fillStyle = '#fff'; ctx.fillText(s.content, cx, cy);
  }
}

const PaperPlane = () => (
  <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="animate-paperPlane">
    <path d="M6 34L62 6L42 62L32 40L6 34Z" fill="#caff4a" opacity="0.9"/>
    <path d="M32 40L42 34L6 34" stroke="#84cc16" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M32 40L42 62" stroke="#84cc16" strokeWidth="1.4"/>
  </svg>
);

const Champagne = () => (
  <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
    <path d="M26 6H42L48 30L34 40L20 30L26 6Z" fill="rgba(202,255,74,0.2)" stroke="#caff4a" strokeWidth="1.5"/>
    <path d="M34 40V58M26 58H42" stroke="#caff4a" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="16" r="2.5" fill="#caff4a" opacity="0.65"/>
    <circle cx="50" cy="12" r="2" fill="#caff4a" opacity="0.5"/>
    <circle cx="54" cy="26" r="1.5" fill="#caff4a" opacity="0.55"/>
    <circle cx="14" cy="28" r="2" fill="#caff4a" opacity="0.4"/>
    <path d="M22 9L18 5M46 11L50 7" stroke="#caff4a" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function MagnetReview({ imageDataURL, event, userId, onRetake, onPrintJobCreated }) {
  const photoRef = useRef(null);
  const [stickers, setStickers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [draggingUid, setDraggingUid] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // null | 'loading' | 'success' | 'error'

  const pack = useMemo(() => getStickerPack(event?.name || ''), [event?.name]);
  const dateLabel = useMemo(() => {
    if (!event?.date) return null;
    return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
      .format(new Date(event.date + 'T00:00:00'));
  }, [event?.date]);

  const onPointerDown = useCallback((e, uid) => {
    e.preventDefault(); e.stopPropagation();
    const rect = photoRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = stickers.find(s => s.uid === uid);
    if (!s) return;
    dragOffset.current = { x: e.clientX - rect.left - s.x * rect.width, y: e.clientY - rect.top - s.y * rect.height };
    setDraggingUid(uid);
  }, [stickers]);

  const onPointerMove = useCallback((e) => {
    if (!draggingUid) return;
    e.preventDefault();
    const rect = photoRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left - dragOffset.current.x) / rect.width));
    const y = Math.max(0.04, Math.min(0.96, (e.clientY - rect.top  - dragOffset.current.y) / rect.height));
    setStickers(prev => prev.map(s => s.uid === draggingUid ? { ...s, x, y } : s));
  }, [draggingUid]);

  const addSticker = (def) => {
    setStickers(prev => [...prev, { uid: `${def.id}-${Date.now()}`, type: def.type, content: def.content, x: 0.5, y: 0.38 }]);
    setShowPicker(false);
  };

  const compositeAndSubmit = async () => {
    setIsSubmitting(true);
    setModal('loading');
    let photo = null;
    try {
      const img = new Image();
      img.src = imageDataURL;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      drawOverlay(ctx, canvas.width, canvas.height, event?.name, event?.date);
      for (const s of stickers) drawSticker(ctx, s, canvas.width, canvas.height);
      const blob = await compressImage(canvas);
      const file = new File([blob], `magnet-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const { file_url, path } = await memoriaService.storage.upload(file, event.id);
      photo = await memoriaService.photos.create({ event_id: event.id, file_url, path, created_by: userId, is_approved: true, is_hidden: false, filter_applied: 'none' });
      await memoriaService.printJobs.create({ event_id: event.id, photo_id: photo.id, guest_user_id: userId });
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      setModal('success');
      setTimeout(() => { setModal(null); onPrintJobCreated(); }, 2800);
    } catch (err) {
      console.error('[MagnetReview] submit failed:', err);
      if (photo?.id) memoriaService.photos.delete(photo.id).catch(() => {});
      setModal('error');
      setTimeout(() => setModal(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none" style={{ background: DARK_BG }} dir="rtl">

      {/* ── Polaroid + stickers ── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingBottom: '108px' }}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDraggingUid(null)}
        onPointerLeave={() => setDraggingUid(null)}
      >
        <div
          className="flex flex-col bg-white"
          style={{ width: 'min(74vw, 288px)', borderRadius: '6px', transform: 'rotate(-1deg)', boxShadow: '0 36px 80px rgba(0,0,0,0.72), 0 8px 20px rgba(0,0,0,0.5)' }}
        >
          {/* Photo area */}
          <div ref={photoRef} className="relative overflow-hidden" style={{ aspectRatio: '3/4', touchAction: draggingUid ? 'none' : 'auto' }}>
            <img src={imageDataURL} alt="captured" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

            {stickers.map(s => (
              <div
                key={s.uid}
                onPointerDown={e => onPointerDown(e, s.uid)}
                className="absolute"
                style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: 'translate(-50%,-50%)', touchAction: 'none', userSelect: 'none', zIndex: draggingUid === s.uid ? 60 : 50, cursor: draggingUid === s.uid ? 'grabbing' : 'grab', filter: draggingUid === s.uid ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))', transition: draggingUid === s.uid ? 'none' : 'filter 0.15s' }}
              >
                {s.type === 'emoji'
                  ? <span style={{ fontSize: EMOJI_SIZE, lineHeight: 1, display: 'block' }}>{s.content}</span>
                  : <span className="font-black block whitespace-nowrap" style={{ fontSize: '22px', lineHeight: 1.2, color: '#fff', WebkitTextStroke: '2px rgba(0,0,0,0.88)', textShadow: '0 2px 10px rgba(0,0,0,0.8)', fontFamily: "'Heebo','Assistant',sans-serif" }}>{s.content}</span>
                }
                {draggingUid !== s.uid && (
                  <button onPointerDown={e => { e.stopPropagation(); setStickers(p => p.filter(x => x.uid !== s.uid)); }} className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-black/80 border border-white/30 flex items-center justify-center z-10" style={{ touchAction: 'none' }}>
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Label strip */}
          <div className="py-3 px-4 flex flex-col items-center justify-center text-center bg-white" style={{ minHeight: '56px' }}>
            <p className="font-bold text-gray-900 text-sm leading-tight tracking-wide" style={{ fontFamily: "'Heebo','Assistant',sans-serif" }}>{event?.name || ''}</p>
            {dateLabel && <p className="text-gray-400 text-[11px] mt-0.5 tracking-widest" style={{ fontFamily: 'Georgia,serif' }}>{dateLabel}</p>}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center px-6 gap-4"
        style={{ paddingTop: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', background: 'linear-gradient(to top, rgba(10,10,14,0.96) 60%, transparent)' }}
      >
        <button onClick={onRetake} disabled={isSubmitting} aria-label="צלם מחדש" className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <Trash2 className="w-5 h-5 text-white/70" />
        </button>

        <button onClick={compositeAndSubmit} disabled={isSubmitting} className="flex-1 h-14 font-black text-base rounded-full disabled:opacity-50 active:scale-[0.97] transition-all flex items-center justify-center gap-2" style={{ background: isSubmitting ? 'rgba(163,230,53,0.45)' : 'linear-gradient(145deg,#caff4a,#a3e635)', color: '#1a2a00', boxShadow: isSubmitting ? 'none' : '0 4px 28px rgba(163,230,53,0.35)' }}>
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a2a00' }} /> : 'שלח להדפסה'}
        </button>

        <button onClick={() => setShowPicker(true)} aria-label="הוסף מדבקה" className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <Smile className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* ── Loading modal ── */}
      {modal === 'loading' && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-8" style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px)' }}>
          <PaperPlane />
          <p className="text-white font-bold text-xl tracking-wide">שולחים להדפסה...</p>
          <p className="text-white/40 text-sm text-center">התמונה שלך בדרך</p>
        </div>
      )}

      {/* ── Success modal ── */}
      {modal === 'success' && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5 px-8" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}>
          <Champagne />
          <p className="text-white font-black text-2xl tracking-wide">נשלח!</p>
          <p className="text-white/55 text-sm text-center leading-relaxed">התמונה שלך בתור ההדפסה<br/>המגנט יהיה מוכן בקרוב</p>
          <div className="px-5 py-2 rounded-full text-xs font-semibold" style={{ background: 'rgba(202,255,74,0.12)', color: '#caff4a', border: '1px solid rgba(202,255,74,0.28)' }}>סוגרים תוך שנייה...</div>
        </div>
      )}

      {/* ── Error toast ── */}
      {modal === 'error' && (
        <div className="absolute inset-x-4 top-14 z-[100] flex justify-center">
          <div className="px-5 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.38)', backdropFilter: 'blur(12px)' }}>
            שגיאה — נסו שוב
          </div>
        </div>
      )}

      {/* ── Sticker picker ── */}
      {showPicker && (
        <div className="absolute inset-0 z-[200] flex items-end" dir="rtl">
          <div className="absolute inset-0 bg-black/55" onClick={() => setShowPicker(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: 'rgba(18,10,32,0.97)', border: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'rgba(255,255,255,0.18)' }} />
            <div className="flex items-center justify-between px-5 mb-4">
              <p className="text-white font-bold text-base">הוסיפו מדבקה</p>
              <button onClick={() => setShowPicker(false)} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-5 pb-2 max-h-52 overflow-y-auto">
              {pack.map(def => (
                <button key={def.id} onClick={() => addSticker(def)} className="aspect-square rounded-xl flex items-center justify-center active:scale-90 transition-all p-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  {def.type === 'emoji'
                    ? <span style={{ fontSize: '36px', lineHeight: 1 }}>{def.content}</span>
                    : <span className="text-[10px] font-black text-center leading-tight" style={{ color: '#caff4a', fontFamily: "'Heebo','Assistant',sans-serif" }}>{def.content}</span>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes paperFly {
          0%   { transform: translate(0,0) rotate(0deg); opacity:1; }
          45%  { transform: translate(28px,-22px) rotate(10deg); opacity:1; }
          72%  { transform: translate(46px,-38px) rotate(14deg); opacity:0.55; }
          100% { transform: translate(0,0) rotate(0deg); opacity:1; }
        }
        .animate-paperPlane { animation: paperFly 1.3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
