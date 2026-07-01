import { useState, useEffect, useRef, useCallback } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { detectHoleBbox } from '@/lib/detectHoleBbox';
import { loadFrameImage, punchHoleToDataUrl } from '@/lib/punchHole';
import FramePngPreview from './FramePngPreview';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const MIN = 0.05; // min window size (normalised)

// 8 resize handles: [id, cx, cy, edges] — cx/cy = position within rect (0..1),
// edges = which rectangle edges this handle moves.
const HANDLES = [
  ['nw', 0, 0, ['l', 't']], ['n', 0.5, 0, ['t']], ['ne', 1, 0, ['r', 't']],
  ['w', 0, 0.5, ['l']],                            ['e', 1, 0.5, ['r']],
  ['sw', 0, 1, ['l', 'b']], ['s', 0.5, 1, ['b']], ['se', 1, 1, ['r', 'b']],
];
const CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };

const edges = (b) => ({ l: b.x, t: b.y, r: b.x + b.w, b: b.y + b.h });
const fromEdges = (e) => {
  const l = Math.min(e.l, e.r), r = Math.max(e.l, e.r);
  const t = Math.min(e.t, e.b), bo = Math.max(e.t, e.b);
  return { x: l, y: t, w: Math.max(MIN, r - l), h: Math.max(MIN, bo - t) };
};

/**
 * Controlled visual editor for a frame's photo window (hole_bbox).
 * Drag the body to move, drag handles to resize; live preview shows a sample
 * photo cover-fit into the (transparent-punched) window — WYSIWYG for guests.
 *
 * Props: imageSrc, bbox {x,y,w,h}, onChange(bbox), textConfig?
 */
export default function FrameHoleEditor({ imageSrc, bbox, onChange, textConfig = null }) {
  const boxRef = useRef(null);
  const [imgEl, setImgEl] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [punchedUrl, setPunchedUrl] = useState(null);
  const drag = useRef(null); // { mode, edgeKeys, startX, startY, start }

  // Load the frame image once (for punch, detect, natural aspect).
  useEffect(() => {
    let cancelled = false;
    loadFrameImage(imageSrc).then((el) => { if (!cancelled) setImgEl(el); }).catch(() => {});
    return () => { cancelled = true; };
  }, [imageSrc]);

  // Debounced punched-PNG preview (keeps dragging smooth).
  useEffect(() => {
    if (!imgEl) return;
    const id = setTimeout(() => setPunchedUrl(punchHoleToDataUrl(imgEl, bbox)), 120);
    return () => clearTimeout(id);
  }, [imgEl, bbox]);

  const onPointerMove = useCallback((e) => {
    const d = drag.current; const rect = boxRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    if (d.mode === 'move') {
      onChange({ ...d.start, x: clamp01(Math.min(d.start.x + dx, 1 - d.start.w)), y: clamp01(Math.min(d.start.y + dy, 1 - d.start.h)) });
    } else {
      const e0 = edges(d.start);
      if (d.edgeKeys.includes('l')) e0.l = clamp01(d.start.x + dx);
      if (d.edgeKeys.includes('r')) e0.r = clamp01(d.start.x + d.start.w + dx);
      if (d.edgeKeys.includes('t')) e0.t = clamp01(d.start.y + dy);
      if (d.edgeKeys.includes('b')) e0.b = clamp01(d.start.y + d.start.h + dy);
      onChange(fromEdges(e0));
    }
  }, [onChange]);

  const endDrag = useCallback(() => {
    drag.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [onPointerMove]);

  const startDrag = (e, mode, edgeKeys) => {
    e.preventDefault(); e.stopPropagation();
    drag.current = { mode, edgeKeys, startX: e.clientX, startY: e.clientY, start: bbox };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  };

  const autoDetect = async () => {
    if (!imgEl) return;
    setDetecting(true);
    try {
      const { bbox: b, confidence } = await detectHoleBbox(imgEl);
      if (b && confidence >= 0.5) onChange(b);
    } catch { /* keep manual */ }
    finally { setDetecting(false); }
  };

  const setNum = (key, pct) => {
    const v = clamp01((parseFloat(pct) || 0) / 100);
    onChange({ ...bbox, [key]: key === 'w' || key === 'h' ? Math.max(MIN, v) : v });
  };

  const pctStyle = { left: `${bbox.x * 100}%`, top: `${bbox.y * 100}%`, width: `${bbox.w * 100}%`, height: `${bbox.h * 100}%` };

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Interactive frame + window rectangle */}
        <div className="flex flex-col gap-2">
          <p className="text-[9px] text-muted-foreground/40 tracking-[0.25em] uppercase">גררו את חלון התמונה</p>
          <div ref={boxRef} className="relative w-full rounded-lg overflow-hidden select-none bg-cool-800/60"
            style={{ touchAction: 'none' }}>
            {imgEl
              ? <img src={imageSrc} alt="מסגרת" className="w-full block pointer-events-none" draggable={false} />
              : <div className="aspect-[4/3] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>}
            {imgEl && (
              <div className="absolute cursor-move" style={{ ...pctStyle, boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)', outline: '2px dashed #a78bfa' }}
                onPointerDown={(e) => startDrag(e, 'move')}>
                {HANDLES.map(([id, cx, cy, ek]) => (
                  <span key={id} onPointerDown={(e) => startDrag(e, 'resize', ek)}
                    className="absolute w-3 h-3 rounded-full bg-violet-400 border-2 border-white"
                    style={{ left: `${cx * 100}%`, top: `${cy * 100}%`, transform: 'translate(-50%,-50%)', cursor: CURSORS[id] }} />
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={autoDetect} disabled={detecting || !imgEl}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold transition-colors disabled:opacity-40">
            {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            זיהוי אוטומטי של החלון
          </button>
          {/* Numeric nudge */}
          <div className="grid grid-cols-4 gap-1.5">
            {[['x', 'X'], ['y', 'Y'], ['w', 'רוחב'], ['h', 'גובה']].map(([k, label]) => (
              <label key={k} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-muted-foreground/40 text-center">{label}</span>
                <input type="number" min="0" max="100" step="0.1" value={(bbox[k] * 100).toFixed(1)}
                  onChange={(e) => setNum(k, e.target.value)}
                  className="w-full text-center text-[11px] text-white bg-white/5 border border-white/10 rounded-md py-1 focus:border-violet-400/50 focus:outline-none" />
              </label>
            ))}
          </div>
        </div>

        {/* Live WYSIWYG preview */}
        <div className="flex flex-col gap-2">
          <p className="text-[9px] text-muted-foreground/40 tracking-[0.25em] uppercase">תצוגה מקדימה</p>
          <div className="w-full rounded-lg overflow-hidden bg-cool-800/60 flex items-center justify-center min-h-[120px]">
            {punchedUrl
              ? <FramePngPreview frame={{ image_url: punchedUrl, hole_bbox: bbox, text_config: textConfig }} className="w-full h-auto" />
              : <Loader2 className="w-6 h-6 text-white/30 animate-spin" />}
          </div>
          <p className="text-[9px] text-muted-foreground/25 text-center leading-relaxed">התמונה נכנסת בדיוק לחלון שסימנתם</p>
        </div>
      </div>
    </div>
  );
}
