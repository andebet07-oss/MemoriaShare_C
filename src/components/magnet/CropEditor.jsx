import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Wand2, Check, ZoomIn } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { detectFaces, computeAutoCrop } from '@/hooks/useFaceCrop';
import { eventRenderSpec, renderComposite, loadImage } from '@/lib/polaroid/renderPolaroid';
import { cropOrientation, imageOrientation, getCompositedUrl } from '@/lib/magnetPrint';
import { Button } from '@/components/ui/button';

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const PREVIEW_SCALE = 1.5; // px per design unit (450 × 600 preview)

/**
 * CropEditor — modal for face-centred smart crop + manual pan/zoom of the RAW
 * photo, previewed live in the event's template (WYSIWYG: the same renderer
 * draws the print). Persists crop_config; printing re-renders raw + crop.
 */
export default function CropEditor({ job, event, onUpdate, onClose }) {
  const [rawImg, setRawImg] = useState(null);
  const [cfg, setCfg] = useState(null); // { orientation, panX, panY, zoom }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const dragRef = useRef(null); // { startX, startY, panX, panY }
  const boxRef = useRef(null);

  // Load the raw photo; seed the crop from the stored config, else centre on faces
  // in the orientation the guest captured (read from the stored composite).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const img = await loadImage(job.raw_photo_url);
        let initial = job.crop_config && { ...job.crop_config, orientation: cropOrientation(job.crop_config) };
        if (!initial) {
          const composite = await loadImage(getCompositedUrl(job)).catch(() => null);
          const { boxes } = await detectFaces(img);
          initial = computeAutoCrop({ boxes, orientation: composite ? imageOrientation(composite) : 'portrait' });
        }
        if (!cancelled) { setRawImg(img); setCfg(initial); }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [job.id]);

  // Live preview whenever the crop changes.
  useEffect(() => {
    if (!rawImg || !cfg) return;
    let cancelled = false;
    renderComposite({ ...eventRenderSpec(event), orientation: cfg.orientation, photo: rawImg, crop: cfg }, PREVIEW_SCALE)
      .then((canvas) => { if (!cancelled) setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9)); })
      .catch((err) => { console.warn('[CropEditor] preview failed:', err?.message); });
    return () => { cancelled = true; };
  }, [cfg, rawImg, event]);

  const autoRecenter = useCallback(async () => {
    if (!rawImg) return;
    const { boxes } = await detectFaces(rawImg);
    setCfg(c => computeAutoCrop({ boxes, orientation: c?.orientation || 'portrait' }));
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
    setIsSaving(true); setSaveError(false);
    try {
      const updated = await memoriaService.printJobs.update(job.id, { crop_config: cfg });
      onUpdate?.(updated);
      onClose?.();
    } catch (err) {
      console.error('[CropEditor] save failed:', err?.message);
      setSaveError(true);
      setIsSaving(false);
    }
  };

  const orientation = cfg?.orientation || 'portrait';

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
              className={`mx-auto mb-4 overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none shadow-lg ${
                orientation === 'landscape' ? 'max-w-[320px]' : 'max-w-[240px]'
              }`}
            >
              <img src={previewUrl} alt="תצוגה מקדימה" className="w-full block pointer-events-none" draggable={false} />
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground w-16">כיוון</span>
              <div className="flex gap-2 flex-1">
                {[['portrait', 'לאורך'], ['landscape', 'לרוחב']].map(([o, label]) => (
                  <button key={o} type="button" onClick={() => setCfg(c => ({ ...c, orientation: o }))}
                    aria-pressed={orientation === o}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                      orientation === o ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-2 mb-4">
              <ZoomIn className="w-5 h-5 text-muted-foreground shrink-0" />
              <input type="range" min="1" max="3" step="0.1" value={cfg?.zoom ?? 1}
                onChange={e => setCfg(c => ({ ...c, zoom: parseFloat(e.target.value) }))}
                aria-label="זום"
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
            {saveError && <p className="text-sm text-destructive text-center mt-3">שמירת החיתוך נכשלה — נסו שוב.</p>}
            <p className="text-sm text-muted-foreground text-center mt-3">גררו את התמונה למיקום · ההדפסה תיווצר מחדש מהמקור</p>
          </>
        )}
      </div>
    </div>
  );
}
