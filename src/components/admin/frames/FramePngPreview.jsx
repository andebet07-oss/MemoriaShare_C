import { useRef, useEffect, useState } from 'react';
import { compositePngFrame } from '@/lib/compositePngFrame';

function makeSamplePhoto(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#b4a89a');
  grad.addColorStop(1, '#7a6e65');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.35, w * 0.15, w * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.65, w * 0.22, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

/**
 * Renders a PNG frame with a sample photo composite.
 * Props:
 *   frame      — { image_url, hole_bbox, text_config? }
 *   eventName  — preview event name string (optional)
 *   eventDate  — preview date string (optional)
 *   className  — extra Tailwind classes
 *   style      — inline style on wrapper
 */
export default function FramePngPreview({ frame, eventName, eventDate, className = '', style }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setSrc(null);
    setError(false);

    async function render() {
      try {
        const fw = 600, fh = 900;
        const hb = frame.hole_bbox;
        const hw = hb.w <= 1 ? Math.round(hb.w * fw) : hb.w;
        const hh = hb.h <= 1 ? Math.round(hb.h * fh) : hb.h;
        const sampleCanvas = makeSamplePhoto(hw, hh);

        const sampleImg = new Image();
        sampleImg.src = sampleCanvas.toDataURL();
        await new Promise((res) => { sampleImg.onload = res; });

        if (cancelled.current) return;
        const result = await compositePngFrame(sampleImg, frame, {
          maxWidth: 600, maxHeight: 900,
          eventName: eventName ?? 'שרה ודוד',
          eventDate: eventDate ?? '12.06.2026',
        });
        if (!cancelled.current) setSrc(result.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.error('[FramePngPreview] composite failed:', err?.message);
        if (!cancelled.current) setError(true);
      }
    }

    render();
    return () => { cancelled.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.image_url, frame.hole_bbox, JSON.stringify(frame.text_config), eventName, eventDate]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-cool-800/60 text-muted-foreground/40 text-xs ${className}`} style={style}>
        תצוגה מקדימית לא זמינה
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-cool-800/40 ${className}`} style={style}>
        <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="תצוגת מסגרת"
      className={`object-contain ${className}`}
      style={style}
    />
  );
}
