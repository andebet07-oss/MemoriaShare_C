import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Wand2, Check, ZoomIn } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { formatEventDate } from '@/lib/formatEventDate';
import { detectFaces, computeAutoCrop, applyCrop, composePreview, loadImageEl } from '@/hooks/useFaceCrop';
import { resolveEventFrame } from '@/lib/magnetPrint';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * CropEditor — modal for face-centered smart crop + manual pan/zoom of the RAW
 * photo, previewed live inside the event frame (WYSIWYG). Persists crop_config;
 * the print path regenerates the composite from raw + crop + frame.
 */
export default function CropEditor({ job, event, onUpdate, onClose }) {
  const [frame, setFrame] = useState(null);
  const [rawImg, setRawImg] = useState(null);
  const [cfg, setCfg] = useState(null); // { aspect, panX, panY, zoom }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dragRef = useRef(null); // { startX, startY, panX, panY }
  const boxRef = useRef(null);

  // Load frame + raw photo, seed crop from stored config or face-centered auto.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [f, img] = await Promise.all([resolveEventFrame(event), loadImageEl(job.raw_photo_url)]);
        if (cancelled) return;
        setFrame(f); setRawImg(img);
        let initial = job.crop_config;
        if (!initial) {
          const { boxes } = await detectFaces(img);
          initial = computeAutoCrop({ boxes, aspect: '3:4' });
        }
        if (!cancelled) setCfg(initial);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [job.id]);

  // Live WYSIWYG preview whenever the crop config changes.
  useEffect(() => {
    if (!frame || !rawImg || !cfg) return;
    let cancelled = false;
    (async () => {
      try {
        const cropped = applyCrop(rawImg, cfg);
        if (frame.isPng) {
          const canvas = await composePreview(cropped, frame, {
            maxWidth: 440, eventName: event?.name, eventDate: formatEventDate(event?.date) || null,
          });
          if (!cancelled) setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
        } else if (!cancelled) {
          setPreviewUrl(cropped.toDataURL('image/jpeg', 0.9));
        }
      } catch { /* transient — keep last preview */ }
    })();
    return () => { cancelled = true; };
  }, [cfg, frame, rawImg]);

  const autoRecenter = useCallback(async () => {
    if (!rawImg) return;
    const { boxes } = await detectFaces(rawImg);
    setCfg(c => computeAutoCrop({ boxes, aspect: c?.aspect || '3:4' }));
  }, [rawImg]);

  // Pan by dragging the preview (drag content → move crop window the opposite way).
  const onPointerDown = (e) => {
    if (!cfg) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: cfg.panX ?? 0.5, panY: cfg.panY ?? 0.5 };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current; const rect = boxRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    setCfg(c => ({ ...c, panX: clamp01(d.panX - dx), panY: clamp01(d.panY - dy) }));
  };
  const endDrag = () => { dragRef.current = null; };

  const save = async () => {
    setIsSaving(true);
    try {
      const updated = await memoriaService.printJobs.update(job.id, { crop_config: cfg });
      onUpdate?.(updated);
      onClose?.();
    } catch { setIsSaving(false); }
  };

  const aspect = cfg?.aspect || '3:4';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-cool-950 border border-white/10 p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base">חיתוך חכם</h3>
          <button onClick={onClose} aria-label="סגור" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {loadError ? (
          <p className="text-center text-white/40 text-sm py-12">לא ניתן לטעון את תמונת המקור.</p>
        ) : !previewUrl ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
        ) : (
          <>
            {/* Live framed preview — drag to pan */}
            <div
              ref={boxRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              className="mx-auto mb-4 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-white/5 touch-none select-none"
              style={{ maxWidth: 260 }}
            >
              <img src={previewUrl} alt="תצוגה מקדימה" className="w-full block pointer-events-none" draggable={false} />
            </div>

            {/* Aspect toggle */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/45 text-xs w-16">יחס</span>
              <div className="flex gap-2 flex-1">
                {['3:4', '4:3'].map(a => (
                  <button key={a} onClick={() => setCfg(c => ({ ...c, aspect: a }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      aspect === a ? 'bg-violet-500/25 border-violet-400/40 text-violet-200' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                    }`}>
                    {a === '3:4' ? 'לאורך 3:4' : 'לרוחב 4:3'}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-2 mb-4">
              <ZoomIn className="w-4 h-4 text-white/45 shrink-0" />
              <input type="range" min="1" max="3" step="0.1" value={cfg?.zoom ?? 1}
                onChange={e => setCfg(c => ({ ...c, zoom: parseFloat(e.target.value) }))}
                className="flex-1 accent-violet-400" />
              <span className="text-white/50 text-xs tabular-nums w-8 text-left">{(cfg?.zoom ?? 1).toFixed(1)}×</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={autoRecenter}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 text-xs font-bold transition-colors">
                <Wand2 className="w-3.5 h-3.5" /> מרכוז פנים
              </button>
              <button onClick={save} disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold transition-colors">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                שמור חיתוך
              </button>
            </div>
            <p className="text-white/30 text-[10px] text-center mt-3">גררו את התמונה למיקום · ההדפסה תיווצר מחדש מהמקור</p>
          </>
        )}
      </div>
    </div>
  );
}
