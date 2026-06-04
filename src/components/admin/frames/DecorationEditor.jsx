import { useRef, useCallback } from 'react';

// Hole bottom (photo area ends here) for the portrait frames — used to hint
// where the photo vs the white strip is on the drag pad.
const HOLE_BOTTOM = 0.854;

const LABELS = {
  'arrow-left':  'חץ שמאל',
  'arrow-right': 'חץ ימין',
  'rings':       'טבעות',
  'couple':      'זוג מאויר',
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/**
 * Full-frame XY drag pad. The decoration image itself is the draggable element,
 * positioned by its normalised centre (x, y) over a frame-shaped area, so the
 * admin can place artwork anywhere — strip or over the photo.
 */
function DecoPad({ deco, onChange }) {
  const ref = useRef(null);
  const dragging = useRef(false);

  const apply = useCallback((cx, cy) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = clamp((cx - r.left) / r.width, 0, 1);
    const y = clamp((cy - r.top) / r.height, 0, 1);
    onChange({ ...deco, x: +x.toFixed(3), y: +y.toFixed(3) });
  }, [deco, onChange]);

  const down = (cx, cy) => { dragging.current = true; apply(cx, cy); };
  const move = (cx, cy) => { if (dragging.current) apply(cx, cy); };
  const up   = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      className="relative mx-auto rounded-lg select-none cursor-move overflow-hidden"
      style={{ aspectRatio: '876 / 1266', width: 132, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)' }}
      onMouseDown={e => down(e.clientX, e.clientY)}
      onMouseMove={e => move(e.clientX, e.clientY)}
      onMouseUp={up}
      onMouseLeave={up}
      onTouchStart={e => { e.preventDefault(); down(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchMove={e =>  { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={up}
    >
      {/* Photo area (top) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${HOLE_BOTTOM * 100}%`, background: 'rgba(124,134,225,0.06)' }} />
      {/* Strip divider */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${HOLE_BOTTOM * 100}%`, height: 1, background: 'rgba(255,255,255,0.14)' }} />

      {/* Draggable decoration */}
      <img
        src={deco.url} alt="" aria-hidden="true"
        style={{
          position: 'absolute',
          left:  `${(deco.x ?? 0.5) * 100}%`,
          top:   `${(deco.y ?? 0.9) * 100}%`,
          width: `${(deco.w ?? 0.15) * 100}%`,
          height: 'auto',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }}
      />
    </div>
  );
}

/**
 * Editor for movable/resizable built-in decoration layers.
 * decorations: [{ id, url, x, y, w }] — x,y normalised centre, w normalised width.
 */
export default function DecorationEditor({ decorations = [], onChange }) {
  const update = (i, d) => onChange(decorations.map((x, idx) => (idx === i ? d : x)));

  if (!decorations.length) {
    return <p className="text-xs text-muted-foreground/50 text-center py-6">למסגרת זו אין קישוטים מובנים.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {decorations.map((d, i) => (
        <div key={d.id || i} className="flex flex-col gap-3 pb-5 border-b border-white/[0.06] last:border-0 last:pb-0">
          <p className="text-[11px] font-semibold text-violet-300/80">{LABELS[d.id] || d.id}</p>

          <DecoPad deco={d} onChange={(nd) => update(i, nd)} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-bold text-violet-400/70 tracking-[0.2em] uppercase">גודל</p>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{Math.round((d.w ?? 0.15) * 100)}%</span>
            </div>
            <input
              type="range" min={0.04} max={0.45} step={0.005}
              value={d.w ?? 0.15}
              onChange={e => update(i, { ...d, w: +e.target.value })}
              className="w-full accent-violet-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
