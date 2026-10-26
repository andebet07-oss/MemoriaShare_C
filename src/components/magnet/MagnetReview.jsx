import { useState, useRef, useEffect } from 'react';
import { Trash2, Loader2, RotateCw } from 'lucide-react';
import { eventRenderSpec, renderComposite, canvasToJpegBlob, loadImage } from '@/lib/polaroid/renderPolaroid';
import { reportError } from '@/lib/sentry';
import memoriaService from '@/components/memoriaService';
import { Button } from '@/components/ui/button';
import { PaperPlane, Champagne } from './review/SendIllustrations';

/**
 * MagnetReview — the guest's framed preview before sending to print.
 * Shows the finished magnet exactly as it will be printed (the composite from
 * the polaroid renderer), with retake and send. What is shown is what is sent.
 */
export default function MagnetReview({ imageDataURL, orientation, event, userId, onRetake, onPrintJobCreated }) {
  const compositeRef = useRef(null); // the print-resolution canvas being shown
  const [previewUrl, setPreviewUrl] = useState(null);
  const [renderFailed, setRenderFailed] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // null | 'loading' | 'success' | 'error'

  useEffect(() => {
    let cancelled = false;
    setRenderFailed(false);
    (async () => {
      try {
        const photo = await loadImage(imageDataURL);
        const canvas = await renderComposite({ ...eventRenderSpec(event), orientation, photo });
        if (cancelled) return;
        compositeRef.current = canvas;
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
      } catch (err) {
        reportError('MagnetReview.render', err, { eventId: event?.id });
        if (!cancelled) setRenderFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [imageDataURL, orientation, event, renderAttempt]);

  const submit = async () => {
    if (!compositeRef.current) return;
    setIsSubmitting(true);
    setModal('loading');
    let photo = null;
    try {
      const blob = await canvasToJpegBlob(compositeRef.current, 0.92);
      const file = new File([blob], `magnet-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file_url, path } = await memoriaService.storage.upload(file, event.id);

      // Also store the RAW full camera frame so the operator's crop editor can
      // re-frame it. Non-fatal: without it the stored composite still prints.
      let raw_photo_url;
      try {
        const rawBlob = await (await fetch(imageDataURL)).blob();
        const rawFile = new File([rawBlob], `raw-${Date.now()}.jpg`, { type: rawBlob.type || 'image/jpeg' });
        raw_photo_url = (await memoriaService.storage.upload(rawFile, event.id)).file_url;
      } catch (rawErr) {
        reportError('MagnetReview.rawUpload', rawErr, { eventId: event?.id });
      }

      photo = await memoriaService.photos.create({ event_id: event.id, file_url, path, created_by: userId, is_approved: true, is_hidden: false, filter_applied: 'none' });
      await memoriaService.printJobs.create({ event_id: event.id, photo_id: photo.id, guest_user_id: userId, raw_photo_url });
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      setModal('success');
      setTimeout(() => { setModal(null); onPrintJobCreated(); }, 2800);
    } catch (err) {
      reportError('MagnetReview.submit', err, { eventId: event?.id });
      if (photo?.id) memoriaService.photos.delete(photo.id).catch(() => {});
      setModal('error');
      setTimeout(() => setModal(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none bg-background bg-glow" dir="rtl">

      {/* ── The finished magnet ── */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center px-5 pt-14 landscape:pt-4"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        {previewUrl ? (
          <img src={previewUrl} alt="המגנט שלך" draggable={false}
            className="block max-w-full max-h-full w-auto h-auto shadow-2xl" />
        ) : renderFailed ? (
          <div className="flex flex-col items-center gap-4 text-center" role="alert">
            <p className="text-foreground text-sm">לא הצלחנו להכין את המגנט. בדקו את החיבור ונסו שוב.</p>
            <Button variant="secondary" onClick={() => setRenderAttempt(n => n + 1)}>
              <RotateCw /> נסו שוב
            </Button>
          </div>
        ) : (
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" aria-label="מכינים את המגנט" />
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="absolute inset-x-0 bottom-0 px-5 bg-gradient-to-t from-background from-60% to-transparent"
        style={{ paddingTop: '18px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={onRetake} disabled={isSubmitting} aria-label="צלם מחדש"
            className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-foreground/10 border border-foreground/15 backdrop-blur-md active:scale-90 transition-transform disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
            <Trash2 className="w-5 h-5 text-foreground/70" />
          </button>
          <Button size="lg" className="flex-1" onClick={submit} disabled={!previewUrl || isSubmitting || modal !== null}>
            {isSubmitting ? <Loader2 className="!size-5 animate-spin" /> : 'שלח להדפסה'}
          </Button>
        </div>
      </div>

      {/* ── Loading modal ── */}
      {modal === 'loading' && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-8 bg-background/80 backdrop-blur-lg">
          <PaperPlane />
          <p className="text-foreground font-semibold text-xl">שולחים להדפסה...</p>
          <p className="text-muted-foreground text-sm text-center">התמונה שלך בדרך</p>
        </div>
      )}

      {/* ── Success modal ── */}
      {modal === 'success' && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5 px-8 bg-background/85 backdrop-blur-lg">
          <Champagne />
          <p className="text-foreground font-semibold text-2xl">נשלח!</p>
          <p className="text-muted-foreground text-sm text-center leading-relaxed">התמונה שלך בתור ההדפסה 🎉<br/>אספו בעמדת המגנטים כשתהיה מוכנה</p>
          <div className="px-4 py-2 rounded-full text-xs font-semibold text-center bg-brand/15 text-brand border border-brand/30">נעדכן אתכם כאן כשהמגנט מוכן ✨</div>
        </div>
      )}

      {/* ── Error toast ── */}
      {modal === 'error' && (
        <div className="absolute inset-x-4 top-14 z-[100] flex justify-center" role="alert">
          <div className="px-5 py-3 rounded-2xl text-sm font-semibold text-foreground bg-destructive/20 border border-destructive/40 backdrop-blur-md">
            שגיאה — נסו שוב
          </div>
        </div>
      )}
    </div>
  );
}
