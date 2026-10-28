import { useRef } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import { useInView } from '@/hooks/useInView';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import { DESIGN, windowFractions } from '@/lib/polaroid/printSpec';

const WIN = windowFractions('portrait');
const pct = (f) => `${f * 100}%`;

/**
 * The designer's live magnet, drawn by the template renderer (the same code as
 * the print). Until the first render is ready it shows the sample photo in the
 * frame's window, so the box never sits empty; drawing starts shortly before
 * the section scrolls into view.
 */
export default function DesignerPreview({ templateId, name, date, photo, label, className = '' }) {
  const ref = useRef(null);
  const { width } = useElementSize(ref);
  const near = useInView(ref, { rootMargin: '600px 0px', once: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = width ? Math.round((width / DESIGN.portrait.w) * dpr * 100) / 100 : 0;
  const { url, failed } = useSampleMagnet({
    templateId, orientation: 'portrait', name, date, photo, scale: scale || 1, enabled: near && scale > 0,
  });

  return (
    <div className={className}>
      <div ref={ref} role="img" aria-label={label} className="relative aspect-[3/4] w-full overflow-hidden bg-foreground shadow-2xl">
        <img src={photo} alt="" draggable={false} className="absolute object-cover"
          style={{ left: pct(WIN.left), top: pct(WIN.top), width: pct(WIN.width), height: pct(WIN.height) }} />
        {url && <img src={url} alt="" draggable={false} className="absolute inset-0 size-full duration-300 animate-in fade-in" />}
      </div>
      {failed && (
        <p role="status" className="mt-3 text-center text-sm text-muted-foreground">לא הצלחנו להציג את המגנט. נסו לרענן את העמוד.</p>
      )}
    </div>
  );
}
