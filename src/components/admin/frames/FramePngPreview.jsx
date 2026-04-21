import { useRef, useEffect, useState } from 'react';
import { compositePngFrame } from '@/lib/compositePngFrame';

// Sample photo used when no real photo is available — a solid warm-gray rect
function makeSamplePhoto(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#b4a89a');
  grad.addColorStop(1, '#7a6e65');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Silhouette hint
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
 * Accepts the same `frame` shape as MagnetReview: { image_url, hole_bbox }.
 *
 * Props:
 *   frame       — { image_url: string, hole_bbox: {x,y,w,h} (normalised 0-1) }
 *   className   — extra Tailwind classes on the <img> wrapper
 *   style       — inline style on the wrapper
 */
export default function FramePngPreview({ frame, className = '', style }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setSrc(null);
    setError(false);

    async function render() {
      try {
        // Build a sample photo image element
        const fw = 600, fh = 900; // approximate target; compositePngFrame uses actual PNG dimensions
        const hb = frame.hole_bbox;
        const hw = hb.w <= 1 ? Math.round(hb.w * fw) : hb.w;
        const hh = hb.h <= 1 ? Math.round(hb.h * fh) : hb.h;
        const sampleCanvas = makeSamplePhoto(hw, hh);

        const sampleImg = new Image();
        sampleImg.src = sampleCanvas.toDataURL();
        await new Promise((res) => { sampleImg.onload = res; });

        if (cancelled.current) return;
        const result = await compositePngFrame(sampleImg, frame, { maxWidth: 600, maxHeight: 900, eventName: 'חתונת שרה ודוד' });
        if (!cancelled.current) setSrc(result.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.error('[FramePngPreview] composite failed:', err?.message);
        if (!cancelled.current) setError(true);
      }
    }

    render();
    return () => { cancelled.current = true; };
  }, [frame.image_url, frame.hole_bbox]); // eslint-disable-line

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-cool-800/60 text-muted-foreground/40 text-xs ${className}`} style={style}>
        תצוגה מקדימה לא זמינה
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
      className={`object-cover ${className}`}
      style={style}
    />
  );
}
