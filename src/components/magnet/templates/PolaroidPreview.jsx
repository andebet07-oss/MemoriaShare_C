import { useRef, useState, useEffect } from 'react';
import { DESIGN } from '@/lib/polaroid/printSpec';
import { renderComposite } from '@/lib/polaroid/renderPolaroid';

/**
 * A rendered magnet preview — the real renderer with a neutral stand-in photo,
 * so names, date, fonts and options look exactly as they will print.
 * Sized by its container (give it a width via className); renders at that
 * width × device pixel ratio.
 * spec: { templateId, options, name, date }
 */
export default function PolaroidPreview({ spec, orientation = 'portrait', className = '', label }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [url, setUrl] = useState(null);
  const dw = DESIGN[orientation].w;
  const optionsKey = JSON.stringify(spec.options);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return undefined;
    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderComposite({ ...spec, orientation }, (width / dw) * dpr)
      .then((canvas) => { if (!cancelled) setUrl(canvas.toDataURL('image/png')); })
      .catch((err) => console.warn('[PolaroidPreview] render failed:', err?.message));
    return () => { cancelled = true; };
  }, [spec.templateId, optionsKey, spec.name, spec.date, orientation, width, dw]);

  return (
    <div ref={boxRef} role="img" aria-label={label}
      className={`relative bg-foreground shadow-lg ${orientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-[3/4]'} ${className}`}>
      {url && <img src={url} alt="" draggable={false} className="absolute inset-0 w-full h-full" />}
    </div>
  );
}
