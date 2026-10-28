import { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DESIGN, windowFractions } from '@/lib/polaroid/printSpec';
import { usePolaroidOverlay } from '@/hooks/usePolaroidOverlay';

const pct = (n) => `${n * 100}%`;

/**
 * Live WYSIWYG viewfinder: the camera feed in the template's photo window,
 * under the template frame (renderOverlay — the same renderer as the print).
 * The video fills the window with object-fit: cover, centred — exactly the
 * crop the composite takes from the captured frame.
 *
 * The magnet is fitted inside the area left by the camera chrome (`inset`,
 * CSS px per side). The <video> element stays mounted across orientation
 * changes so the stream is never re-attached.
 */
export default function PolaroidViewfinder({ spec, orientation, inset, videoRef, isFront, filter, loading }) {
  const areaRef = useRef(null);
  const [area, setArea] = useState(null); // { w, h } of the free area

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setArea({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: dw, h: dh } = DESIGN[orientation];
  const boxW = area ? Math.floor(Math.min(area.w, (area.h * dw) / dh)) : 0;
  const boxH = Math.round((boxW * dh) / dw);
  const overlay = usePolaroidOverlay(spec, orientation, boxW);
  const win = windowFractions(orientation);
  const overlayReady = overlay?.orientation === orientation;

  return (
    <div ref={areaRef} className="absolute flex items-center justify-center"
      style={{ top: inset.top, right: inset.right, bottom: inset.bottom, left: inset.left }}>
      <div className="relative shadow-2xl bg-foreground" style={{ width: boxW, height: boxH }}>
        <div className="absolute overflow-hidden bg-cool-950"
          style={{ left: pct(win.left), top: pct(win.top), width: pct(win.width), height: pct(win.height) }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-cool-950">
              <Loader2 className="w-7 h-7 text-foreground/30 animate-spin" />
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: isFront ? 'scaleX(-1)' : 'none', filter }} />
        </div>
        {overlayReady && (
          <img src={overlay.url} alt="" aria-hidden="true" draggable={false}
            className="absolute inset-0 w-full h-full pointer-events-none" />
        )}
      </div>
    </div>
  );
}
