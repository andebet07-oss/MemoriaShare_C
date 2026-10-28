import { useEffect, useRef, useState } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import { useInView } from '@/hooks/useInView';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import { DESIGN, windowFractions } from '@/lib/polaroid/printSpec';

const WIN = windowFractions('portrait');
const pct = (f) => `${f * 100}%`;

/**
 * The designer's live magnet, drawn by the template renderer (the same code as
 * the print) — the only live rendering on the home page. Until the first render
 * it shows the photo in the frame's window, so the box never sits empty; drawing
 * starts shortly before the section scrolls into view. A new render crossfades
 * over the previous one (instant with "reduce motion").
 */
export default function DesignerPreview({ templateId, name, date, photo, label, behind, className = '' }) {
  const ref = useRef(null);
  const { width } = useElementSize(ref);
  const near = useInView(ref, { rootMargin: '600px 0px', once: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = width ? Math.round((width / DESIGN.portrait.w) * dpr * 100) / 100 : 0;
  const { url, failed } = useSampleMagnet({
    templateId, orientation: 'portrait', name, date, photo, scale: scale || 1, enabled: near && scale > 0,
  });
  // The last two renders: the new one fades in over the one before.
  const [layers, setLayers] = useState([]);
  useEffect(() => { if (url) setLayers((l) => [l[l.length - 1], url].filter(Boolean)); }, [url]);

  return (
    <div className={className}>
      <div className="relative">
        {/* Another template peeking behind, and soft indigo light (decorative) */}
        <div aria-hidden="true" className="absolute inset-[-25%] bg-glow-soft" />
        {behind && (
          <img src={behind} alt="" aria-hidden="true" loading="lazy" draggable={false}
            className="absolute -left-[16%] top-[4%] w-[78%] rounded-[2px] shadow-magnet [rotate:8deg]" />
        )}
        <div ref={ref} role="img" aria-label={label} className="relative aspect-[3/4] w-full overflow-hidden bg-foreground shadow-magnet [rotate:-3deg]">
          <img src={photo} alt="" draggable={false} className="absolute object-cover"
            style={{ left: pct(WIN.left), top: pct(WIN.top), width: pct(WIN.width), height: pct(WIN.height) }} />
          {layers.map((u, i) => (
            <img key={u} src={u} alt="" draggable={false}
              className={`absolute inset-0 size-full ${i === layers.length - 1 ? 'motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in' : ''}`} />
          ))}
        </div>
      </div>
      {failed && (
        <p role="status" className="mt-4 text-center text-sm text-muted-foreground">לא הצלחנו להציג את המגנט. נסו לרענן את העמוד.</p>
      )}
    </div>
  );
}
