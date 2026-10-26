import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Wand2, Check, ZoomIn } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { formatEventDate } from '@/lib/formatEventDate';
import { detectFaces, computeAutoCrop, applyCrop, composePreview, loadImageEl } from '@/hooks/useFaceCrop';
import { resolveEventFrame } from '@/lib/framesUtils';
import { Button } from '@/components/ui/button';

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
        // Default the crop aspect to the assigned frame's aspect (landscape frames → 4:3).
        const frameAspect = f?.aspect === 'landscape' ? '4:3' : '3:4';
        let initial = job.crop_config;
        if (!initial) {
          const { boxes } = await detectFaces(img);
          initial = computeAutoCrop({ boxes, aspect: frameAspect });
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
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">חיתוך חכם</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="סגור">
            <X />
          </Button>
        </div>

        {loadError ? (
          <p className="text-center text-muted-foreground text-base py-12">לא ניתן לטעון את תמונת המקור.</p>
        ) : !previewUrl ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-muted-foreground animate-spin" /></div>
        ) : (
          <>
            {/* Live framed preview — drag to pan */}
            <div
              ref={boxRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              className="mx-auto mb-4 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-secondary touch-none select-none"
              style={{ maxWidth: 260 }}
            >
              <img src={previewUrl} alt="תצוגה מקדימה" className="w-full block pointer-events-none" draggable={false} />
            </div>

            {/* Aspect toggle */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground w-16">יחס</span>
              <div className="flex gap-2 flex-1">
                {['3:4', '4:3'].map(a => (
                  <button key={a} onClick={() => setCfg(c => ({ ...c, aspect: a }))}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                      aspect === a ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}>
                    {a === '3:4' ? 'לאורך 3:4' : 'לרוחב 4:3'}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-2 mb-4">
              <ZoomIn className="w-5 h-5 text-muted-foreground shrink-0" />
              <input type="range" min="1" max="3" step="0.1" value={cfg?.zoom ?? 1}
                onChange={e => setCfg(c => ({ ...c, zoom: parseFloat(e.target.value) }))}
                className="flex-1 accent-brand" />
              <span className="text-sm text-muted-foreground tabular-nums w-10 text-left">{(cfg?.zoom ?? 1).toFixed(1)}×</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={autoRecenter}>
                <Wand2 /> מרכוז פנים
              </Button>
              <Button className="flex-1" onClick={save} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
                שמור חיתוך
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-3">גררו את התמונה למיקום · ההדפסה תיווצר מחדש מהמקור</p>
          </>
        )}
      </div>
    </div>
  );
}
