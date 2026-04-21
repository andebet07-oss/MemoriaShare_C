import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { compositePngFrame } from '@/lib/compositePngFrame';
import memoriaService from '@/components/memoriaService';

const STYLE_OPTIONS = [
  { value: 'minimal_luxury',   label: 'Minimal Luxury' },
  { value: 'modern_editorial', label: 'Modern Editorial' },
  { value: 'festive_chic',     label: 'Festive Chic' },
];

const CATEGORY_OPTIONS = [
  { value: 'wedding',      label: 'חתונה' },
  { value: 'bar-mitzvah',  label: 'בר/בת מצווה' },
  { value: 'birthday',     label: 'יום הולדת' },
  { value: 'brit',         label: 'ברית' },
  { value: 'corporate',    label: 'קורפורייט' },
  { value: 'general',      label: 'כללי' },
];

const ASPECT_OPTIONS = [
  { value: 'portrait', label: 'פורטרט (2:3)' },
  { value: 'square',   label: 'ריבועי (1:1)' },
  { value: 'strip',    label: 'סטריפ (2x6)' },
];

function slugify(str) {
  return str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 48);
}

/** Interactive drag-rectangle overlay for hole bbox selection */
function HolePicker({ imageUrl, naturalW, naturalH, bbox, onChange }) {
  const containerRef = useRef(null);
  const dragging = useRef(null); // 'new' | 'move' | 'resize-{corner}'
  const startPt  = useRef(null);
  const startBox = useRef(null);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const pxToNorm = useCallback((px, py) => {
    const rect = containerRef.current.getBoundingClientRect();
    return { x: clamp((px - rect.left) / rect.width, 0, 1), y: clamp((py - rect.top) / rect.height, 0, 1) };
  }, []);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const pt = pxToNorm(e.clientX, e.clientY);
    if (!bbox) {
      dragging.current = 'new';
      startPt.current = pt;
      onChange({ x: pt.x, y: pt.y, w: 0, h: 0 });
      return;
    }
    // Check if near a corner (resize)
    const corners = [
      { id: 'resize-tl', x: bbox.x,           y: bbox.y },
      { id: 'resize-tr', x: bbox.x + bbox.w,  y: bbox.y },
      { id: 'resize-bl', x: bbox.x,           y: bbox.y + bbox.h },
      { id: 'resize-br', x: bbox.x + bbox.w,  y: bbox.y + bbox.h },
    ];
    const hit = corners.find(c => Math.hypot(pt.x - c.x, pt.y - c.y) < 0.035);
    if (hit) {
      dragging.current = hit.id;
      startPt.current = pt;
      startBox.current = { ...bbox };
      return;
    }
    // Check if inside box (move)
    if (pt.x >= bbox.x && pt.x <= bbox.x + bbox.w && pt.y >= bbox.y && pt.y <= bbox.y + bbox.h) {
      dragging.current = 'move';
      startPt.current = pt;
      startBox.current = { ...bbox };
      return;
    }
    // Start a new box
    dragging.current = 'new';
    startPt.current = pt;
    onChange({ x: pt.x, y: pt.y, w: 0, h: 0 });
  }, [bbox, pxToNorm, onChange]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const pt = pxToNorm(e.clientX, e.clientY);
    if (dragging.current === 'new') {
      const x = Math.min(pt.x, startPt.current.x);
      const y = Math.min(pt.y, startPt.current.y);
      const w = Math.abs(pt.x - startPt.current.x);
      const h = Math.abs(pt.y - startPt.current.y);
      onChange({ x, y, w, h });
    } else if (dragging.current === 'move') {
      const dx = pt.x - startPt.current.x, dy = pt.y - startPt.current.y;
      onChange({
        x: clamp(startBox.current.x + dx, 0, 1 - startBox.current.w),
        y: clamp(startBox.current.y + dy, 0, 1 - startBox.current.h),
        w: startBox.current.w, h: startBox.current.h,
      });
    } else if (dragging.current === 'resize-br') {
      onChange({ ...startBox.current, w: clamp(pt.x - startBox.current.x, 0.05, 1 - startBox.current.x), h: clamp(pt.y - startBox.current.y, 0.05, 1 - startBox.current.y) });
    } else if (dragging.current === 'resize-tl') {
      const nx = clamp(pt.x, 0, startBox.current.x + startBox.current.w - 0.05);
      const ny = clamp(pt.y, 0, startBox.current.y + startBox.current.h - 0.05);
      onChange({ x: nx, y: ny, w: startBox.current.x + startBox.current.w - nx, h: startBox.current.y + startBox.current.h - ny });
    } else if (dragging.current === 'resize-tr') {
      const ny = clamp(pt.y, 0, startBox.current.y + startBox.current.h - 0.05);
      onChange({ ...startBox.current, y: ny, w: clamp(pt.x - startBox.current.x, 0.05, 1 - startBox.current.x), h: startBox.current.y + startBox.current.h - ny });
    } else if (dragging.current === 'resize-bl') {
      const nx = clamp(pt.x, 0, startBox.current.x + startBox.current.w - 0.05);
      onChange({ ...startBox.current, x: nx, w: startBox.current.x + startBox.current.w - nx, h: clamp(pt.y - startBox.current.y, 0.05, 1 - startBox.current.y) });
    }
  }, [pxToNorm, onChange]);

  const onMouseUp = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className="relative select-none cursor-crosshair" onMouseDown={onMouseDown}>
      <img src={imageUrl} alt="frame preview" className="w-full block" draggable={false} />
      {bbox && bbox.w > 0 && bbox.h > 0 && (
        <>
          {/* Darken everything outside the hole */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.55) ${bbox.y * 100}%, transparent ${bbox.y * 100}%)`,
          }} />
          {/* Hole outline */}
          <div className="absolute border-2 border-indigo-400 pointer-events-none" style={{
            left: `${bbox.x * 100}%`, top: `${bbox.y * 100}%`,
            width: `${bbox.w * 100}%`, height: `${bbox.h * 100}%`,
          }}>
            <span className="absolute -top-5 left-0 text-[9px] font-mono text-indigo-300 whitespace-nowrap">
              {Math.round(bbox.x * 100)}%,{Math.round(bbox.y * 100)}% — {Math.round(bbox.w * 100)}×{Math.round(bbox.h * 100)}%
            </span>
            {/* Corner handles */}
            {[['tl','top-0 left-0'], ['tr','top-0 right-0'], ['bl','bottom-0 left-0'], ['br','bottom-0 right-0']].map(([id, pos]) => (
              <div key={id} className={`absolute w-3 h-3 bg-indigo-400 border border-white -translate-x-1/2 -translate-y-1/2 ${pos} cursor-nwse-resize`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FrameUploadDialog({ onClose, onUploaded }) {
  const [file,     setFile]     = useState(null);
  const [imgUrl,   setImgUrl]   = useState(null);
  const [imgDims,  setImgDims]  = useState(null);
  const [bbox,     setBbox]     = useState(null);
  const [name,     setName]     = useState('');
  const [slug,     setSlug]     = useState('');
  const [style,    setStyle]    = useState('minimal_luxury');
  const [category, setCategory] = useState('wedding');
  const [aspect,   setAspect]   = useState('portrait');
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const dropRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || f.type !== 'image/png') { setError('יש להעלות קובץ PNG בלבד.'); return; }
    setError('');
    setFile(f);
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setBbox(null);
    setPreview(null);
    setName(prev => prev || f.name.replace(/\.png$/i, '').replace(/[-_]/g, ' '));
    setSlug(prev => prev || slugify(f.name.replace(/\.png$/i, '')));
    const img = new Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // Live composite preview
  useEffect(() => {
    if (!imgUrl || !bbox || bbox.w < 0.05 || bbox.h < 0.05) { setPreview(null); return; }
    let cancelled = false;
    async function render() {
      try {
        const dims = imgDims || { w: 600, h: 900 };
        const hw = Math.round(bbox.w * dims.w);
        const hh = Math.round(bbox.h * dims.h);
        const sampleC = document.createElement('canvas');
        sampleC.width = hw; sampleC.height = hh;
        const sCtx = sampleC.getContext('2d');
        sCtx.fillStyle = '#b0a0a0';
        sCtx.fillRect(0, 0, hw, hh);
        const si = new Image(); si.src = sampleC.toDataURL();
        await new Promise(r => { si.onload = r; });
        if (cancelled) return;
        // Load PNG from objectURL directly
        const frameImg = new Image(); frameImg.crossOrigin = 'anonymous'; frameImg.src = imgUrl;
        await new Promise((res, rej) => { frameImg.onload = res; frameImg.onerror = rej; });
        if (cancelled) return;
        const c = await compositePngFrame(si, { image_url: imgUrl, hole_bbox: bbox });
        if (!cancelled) setPreview(c.toDataURL('image/jpeg', 0.8));
      } catch { /* ignore preview errors */ }
    }
    render();
    return () => { cancelled = true; };
  }, [imgUrl, bbox, imgDims]);

  const canSubmit = file && bbox && bbox.w > 0.05 && bbox.h > 0.05 && name.trim() && slug.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const { image_url, row } = await memoriaService.frameMeta.uploadLibraryPng(file, {
        slug: slugify(slug),
        name: name.trim(),
        style,
        category,
        aspect,
        hole_bbox: bbox,
      });
      onUploaded?.({ ...row, image_url, hole_bbox: bbox, name: name.trim(), category, isPng: true });
      onClose();
    } catch (err) {
      setError('שגיאה בהעלאה: ' + (err.message || 'נסה שוב'));
    } finally {
      setLoading(false);
    }
  };

  // Cleanup objectURL
  useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl); }, [imgUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cool-950 border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">ספריית מסגרות</p>
            <h2 className="font-playfair text-xl text-foreground">העלאת מסגרת PNG</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cool-800 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Drop zone */}
          {!imgUrl ? (
            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-border hover:border-violet-500/50 rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer"
              onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/png'; i.onchange=e=>handleFile(e.target.files[0]); i.click(); }}
            >
              <Upload className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                גרור PNG לכאן או לחץ לבחירה<br />
                <span className="text-xs text-muted-foreground/50">PNG עם שכבת שקיפות (alpha), 2400×3600px מומלץ</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Hole picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold">סמן את אזור התמונה (hole)</p>
                <div className="rounded-xl overflow-hidden border border-border">
                  <HolePicker
                    imageUrl={imgUrl}
                    naturalW={imgDims?.w ?? 600}
                    naturalH={imgDims?.h ?? 900}
                    bbox={bbox}
                    onChange={setBbox}
                  />
                </div>
                <button
                  onClick={() => { setFile(null); setImgUrl(null); setBbox(null); setPreview(null); }}
                  className="mt-2 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  החלף קובץ
                </button>
              </div>

              {/* Composite preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold">תצוגה מקדימה</p>
                <div className="rounded-xl overflow-hidden border border-border bg-cool-900/50 aspect-[2/3] flex items-center justify-center">
                  {preview
                    ? <img src={preview} alt="preview" className="w-full h-full object-contain" />
                    : <p className="text-xs text-muted-foreground/40 text-center px-4">
                        {bbox ? 'טוען...' : 'סמן את אזור התמונה כדי לראות תצוגה מקדימה'}
                      </p>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Metadata form */}
          {imgUrl && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">שם המסגרת (עברית)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="לדוגמה: זהב ופרחים"
                  className="w-full bg-cool-900/80 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">מזהה (slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(slugify(e.target.value))}
                  placeholder="wedding-gold-floral-01"
                  className="w-full bg-cool-900/80 border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">קטגוריה</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-cool-900/80 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500">
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">סגנון</label>
                <select value={style} onChange={e => setStyle(e.target.value)}
                  className="w-full bg-cool-900/80 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500">
                  {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">פורמט</label>
                <select value={aspect} onChange={e => setAspect(e.target.value)}
                  className="w-full bg-cool-900/80 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500">
                  {ASPECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: canSubmit ? '0 4px 16px rgba(124,58,237,0.35)' : 'none' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'מעלה...' : 'העלה מסגרת'}
          </button>
        </div>
      </div>
    </div>
  );
}
