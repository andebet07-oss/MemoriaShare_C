import { useRef, useCallback } from 'react';

// White area of the polaroid: y starts at 70.71% of frame height
const Y_START = 0.7071;
const Y_END   = 0.97;
const X_START = 0.06;
const X_END   = 0.94;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/**
 * Drag pad for positioning a frame element within the white area.
 * iconMode=true  → XY drag (for icons)
 * iconMode=false → Y-only drag (for text, X controlled by alignment)
 *
 * x, y are normalised frame coordinates (0–1 relative to full frame size).
 */
export default function PositionPad({ x = 0.5, y = 0.85, onChange, iconMode = false }) {
  const padRef  = useRef(null);
  const isDragging = useRef(false);

  const toFrameCoords = useCallback((clientX, clientY) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const relX = clamp((clientX - rect.left)  / rect.width,  0, 1);
    const relY = clamp((clientY - rect.top)   / rect.height, 0, 1);
    return {
      x: iconMode ? clamp(X_START + relX * (X_END - X_START), X_START, X_END) : x,
      y: clamp(Y_START + relY * (Y_END - Y_START), Y_START, Y_END),
    };
  }, [iconMode, x]);

  const onDown  = useCallback((cx, cy) => { isDragging.current = true;  const c = toFrameCoords(cx, cy); if (c) onChange(c); }, [toFrameCoords, onChange]);
  const onMove  = useCallback((cx, cy) => { if (!isDragging.current) return; const c = toFrameCoords(cx, cy); if (c) onChange(c); }, [toFrameCoords, onChange]);
  const onUp    = useCallback(()  => { isDragging.current = false; }, []);

  // Dot position as percentage within the pad
  const dotX = iconMode ? ((x - X_START) / (X_END - X_START)) * 100 : 50;
  const dotY = ((y - Y_START) / (Y_END - Y_START)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] text-muted-foreground/40 tracking-widest uppercase">
        {iconMode ? 'גרור לשינוי מיקום' : 'גרור לשינוי גובה'}
      </p>
      <div
        ref={padRef}
        className="relative w-full rounded-xl cursor-crosshair select-none"
        style={{ height: iconMode ? 88 : 48, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        onMouseDown={e => onDown(e.clientX, e.clientY)}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={e =>  { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={onUp}
      >
        {/* Guide lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
          {iconMode && <div className="absolute top-0 bottom-0 w-px bg-white left-1/2" />}
          <div className="absolute left-0 right-0 h-px bg-white top-1/2" />
        </div>

        {/* Position dot */}
        <div
          className="absolute w-4 h-4 rounded-full bg-violet-400 border-2 border-white shadow-lg pointer-events-none transition-none"
          style={{
            left:      `${clamp(dotX, 0, 100)}%`,
            top:       `${clamp(dotY, 0, 100)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  );
}
