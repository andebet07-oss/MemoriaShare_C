import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertCircle, Edit2, PlusCircle, Type } from 'lucide-react';
import { compositePngFrame } from '@/lib/compositePngFrame';
import { detectHoleBbox } from '@/lib/detectHoleBbox';
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

function guessCategory(filename) {
  const n = filename.toLowerCase();
  if (n.startsWith('wedding'))   return 'wedding';
  if (n.startsWith('bar'))       return 'bar-mitzvah';
  if (n.startsWith('bat'))       return 'bar-mitzvah';
  if (n.startsWith('birthday'))  return 'birthday';
  if (n.startsWith('brit'))      return 'brit';
  if (n.startsWith('corporate')) return 'corporate';
  return 'general';
}

const FONT_OPTIONS = [
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Great Vibes',      label: 'Great Vibes (כתב יד)' },
  { value: 'Heebo',            label: 'Heebo' },
  { value: 'Montserrat',       label: 'Montserrat' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
];

function defaultTextConfig(category) {
  const map = {
    'wedding':     { y: 0.925, font: 'Playfair Display',    size: 0.028, color: '#8B7355', weight: 'italic' },
    'bar-mitzvah': { y: 0.925, font: 'Heebo',               size: 0.030, color: '#1a3a6e', weight: 'bold' },
    'birthday':    { y: 0.925, font: 'Heebo',               size: 0.032, color: '#c04a7f', weight: 'bold' },
    'brit':        { y: 0.925, font: 'Playfair Display',    size: 0.026, color: '#4a7aad', weight: 'normal' },
    'corporate':   { y: 0.925, font: 'Montserrat',          size: 0.026, color: '#333333', weight: 'bold' },
  };
  return map[category] ?? { y: 0.925, font: 'Playfair Display', size: 0.028, color: '#888888', weight: 'normal' };
}

function guessStyle(filename) {
  const n = filename.toLowerCase();
  if (n.includes('minimal') || n.includes('luxury') || n.includes('gold') || n.includes('elegant')) return 'minimal_luxury';
  if (n.includes('editorial') || n.includes('black') || n.includes('white') || n.includes('modern')) return 'modern_editorial';
  return 'festive_chic';
}

// ─── HolePicker ──────────────────────────────────────────────────────────────

function HolePicker({ imageUrl, bbox, onChange }) {
  const containerRef = useRef(null);
  const dragging = useRef(null);
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
    if (!bbox) { dragging.current = 'new'; startPt.current = pt; onChange({ x: pt.x, y: pt.y, w: 0, h: 0 }); return; }
    const corners = [
      { id: 'resize-tl', x: bbox.x,           y: bbox.y },
      { id: 'resize-tr', x: bbox.x + bbox.w,  y: bbox.y },
      { id: 'resize-bl', x: bbox.x,           y: bbox.y + bbox.h },
      { id: 'resize-br', x: bbox.x + bbox.w,  y: bbox.y + bbox.h },
    ];
    const hit = corners.find(c => Math.hypot(pt.x - c.x, pt.y - c.y) < 0.035);
    if (hit) { dragging.current = hit.id; startPt.current = pt; startBox.current = { ...bbox }; return; }
    if (pt.x >= bbox.x && pt.x <= bbox.x + bbox.w && pt.y >= bbox.y && pt.y <= bbox.y + bbox.h) {
      dragging.current = 'move'; startPt.current = pt; startBox.current = { ...bbox }; return;
    }
    dragging.current = 'new'; startPt.current = pt; onChange({ x: pt.x, y: pt.y, w: 0, h: 0 });
  }, [bbox, pxToNorm, onChange]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const pt = pxToNorm(e.clientX, e.clientY);
    if (dragging.current === 'new') {
      onChange({ x: Math.min(pt.x, startPt.current.x), y: Math.min(pt.y, startPt.current.y), w: Math.abs(pt.x - startPt.current.x), h: Math.abs(pt.y - startPt.current.y) });
    } else if (dragging.current === 'move') {
      const dx = pt.x - startPt.current.x, dy = pt.y - startPt.current.y;
      onChange({ x: clamp(startBox.current.x + dx, 0, 1 - startBox.current.w), y: clamp(startBox.current.y + dy, 0, 1 - startBox.current.h), w: startBox.current.w, h: startBox.current.h });
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
      <img src={imageUrl} alt="frame" className="w-full block" draggable={false} />
      {bbox && bbox.w > 0 && bbox.h > 0 && (
        <div className="absolute border-2 border-indigo-400 pointer-events-none" style={{ left: `${bbox.x * 100}%`, top: `${bbox.y * 100}%`, width: `${bbox.w * 100}%`, height: `${bbox.h * 100}%` }}>
          <span className="absolute -top-5 left-0 text-[9px] font-mono text-indigo-300 whitespace-nowrap">
            {Math.round(bbox.x * 100)}%,{Math.round(bbox.y * 100)}% — {Math.round(bbox.w * 100)}×{Math.round(bbox.h * 100)}%
          </span>
          {[['tl','top-0 left-0'],['tr','top-0 right-0'],['bl','bottom-0 left-0'],['br','bottom-0 right-0']].map(([id, pos]) => (
            <div key={id} className={`absolute w-3 h-3 bg-indigo-400 border border-white -translate-x-1/2 -translate-y-1/2 ${pos}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ConfidenceBadge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }) {
  if (confidence === null) return <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-cool-700 text-muted-foreground/50">...</span>;
  if (confidence >= 0.80) return <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400">✓ זוהה</span>;
  if (confidence >= 0.55) return <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400">~ חלקי</span>;
  return <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400">! ידני</span>;
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function FrameUploadDialog({ onClose, onUploaded }) {
  const [rows,       setRows]       = useState([]);
  const [editId,     setEditId]     = useState(null); // id of row open in full HolePicker
  const [submitting, setSubmitting] = useState(false);
  const [globalErr,  setGlobalErr]  = useState('');

  const updateRow = (id, patch) => setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row));

  // ── File ingestion ──────────────────────────────────────────────────────────

  const processFiles = useCallback(async (files) => {
    const pngFiles = [...files].filter(f => f.type === 'image/png');
    if (!pngFiles.length) { setGlobalErr('יש לבחור קבצי PNG בלבד.'); return; }
    setGlobalErr('');

    const newRows = pngFiles.map(f => ({
      id:         `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file:       f,
      imgUrl:     URL.createObjectURL(f),
      bbox:       null,
      confidence: null,
      name:       '',
      slug:       slugify(f.name.replace(/\.png$/i, '')),
      style:      guessStyle(f.name),
      category:   guessCategory(f.name),
      aspect:      'portrait',
      notes:       '',
      text_config: defaultTextConfig(guessCategory(f.name)),
      status:      'detecting',
      errorMsg:   '',
    }));

    setRows(prev => [...prev, ...newRows]);

    for (const row of newRows) {
      try {
        const img = new Image();
        img.src = row.imgUrl;
        await new Promise(res => { img.onload = res; });
        const { bbox, confidence } = await detectHoleBbox(img);
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, bbox, confidence, status: 'ready' } : r));
      } catch {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, confidence: 0, status: 'ready' } : r));
      }
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png'; input.multiple = true;
    input.onchange = e => processFiles(e.target.files);
    input.click();
  };

  // Cleanup objectURLs on unmount
  const rowsRef = useRef([]);
  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => () => rowsRef.current.forEach(r => URL.revokeObjectURL(r.imgUrl)), []);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const validRows = rows.filter(r => r.status === 'ready' && r.bbox && r.bbox.w > 0.05 && r.bbox.h > 0.05);

  const handleSubmit = async () => {
    if (!validRows.length) return;
    setSubmitting(true);
    let uploaded = 0;

    for (const row of validRows) {
      updateRow(row.id, { status: 'uploading' });
      try {
        await memoriaService.frameMeta.uploadLibraryPng(row.file, {
          slug:        row.slug,
          name:        row.name.trim() || row.slug,
          style:       row.style,
          category:    row.category,
          aspect:      row.aspect,
          hole_bbox:   row.bbox,
          text_config: row.text_config ?? null,
        });
        updateRow(row.id, { status: 'done' });
        uploaded++;
      } catch (err) {
        updateRow(row.id, { status: 'error', errorMsg: err.message || 'שגיאה' });
      }
    }

    setSubmitting(false);
    if (uploaded > 0) {
      onUploaded?.();
      setTimeout(onClose, 1200);
    }
  };

  // ── Edit overlay (full HolePicker for one row) ──────────────────────────────

  const editRow = rows.find(r => r.id === editId);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cool-950 border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-violet-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">ספריית מסגרות</p>
            <h2 className="font-playfair text-xl text-foreground">
              {rows.length > 0 ? `העלאת ${rows.length} מסגרות` : 'העלאת מסגרות PNG'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cool-800 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Drop zone — shown when no files yet */}
          {rows.length === 0 ? (
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={openFilePicker}
              className="border-2 border-dashed border-border hover:border-violet-500/50 rounded-xl p-12 flex flex-col items-center gap-3 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                גרור קבצי PNG לכאן, או לחץ לבחירה<br />
                <span className="text-xs text-muted-foreground/50">ניתן לבחור כמה קבצים בבת אחת · PNG עם שכבת שקיפות (alpha)</span>
              </p>
            </div>
          ) : (
            <>
              {/* File rows */}
              <div className="space-y-3">
                {rows.map(row => (
                  <FileRow
                    key={row.id}
                    row={row}
                    onChange={patch => updateRow(row.id, patch)}
                    onRemove={() => setRows(r => r.filter(x => x.id !== row.id))}
                    onEdit={() => setEditId(row.id)}
                  />
                ))}
              </div>

              {/* Add more */}
              <button
                onClick={openFilePicker}
                className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                הוסף עוד קבצים
              </button>
            </>
          )}

          {globalErr && <p className="text-red-400 text-sm">{globalErr}</p>}
        </div>

        {/* Footer */}
        {rows.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={!validRows.length || submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: validRows.length ? '0 4px 16px rgba(124,58,237,0.35)' : 'none' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {submitting ? 'מעלה...' : `העלה ${validRows.length} מסגרות`}
            </button>
          </div>
        )}

        {/* HolePicker edit overlay */}
        {editRow && (
          <div className="absolute inset-0 bg-cool-950 z-10 flex flex-col overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <p className="text-sm text-foreground font-semibold">סמן את אזור התמונה (hole)</p>
              <button onClick={() => setEditId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cool-800 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <HolePicker
                imageUrl={editRow.imgUrl}
                bbox={editRow.bbox}
                onChange={bbox => updateRow(editRow.id, { bbox, confidence: 1.0 })}
              />
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
              <button
                onClick={() => setEditId(null)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
              >
                אישור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

function FileRow({ row, onChange, onRemove, onEdit }) {
  const [showText, setShowText] = useState(false);
  const isDetecting = row.status === 'detecting';
  const isDone      = row.status === 'done';
  const isError     = row.status === 'error';
  const isUploading = row.status === 'uploading';
  const needsManual = row.confidence !== null && row.confidence < 0.55 && !isDone;
  const tc          = row.text_config || {};
  const setTc       = patch => onChange({ text_config: { ...tc, ...patch } });

  return (
    <div className={[
      'flex gap-3 p-3 rounded-xl border transition-colors',
      isDone    ? 'border-emerald-500/30 bg-emerald-500/5'  :
      isError   ? 'border-red-500/30 bg-red-500/5'          :
                  'border-border bg-cool-900/40',
    ].join(' ')}>

      {/* Thumbnail with bbox overlay */}
      <div className="relative w-[52px] h-[78px] shrink-0 rounded-lg overflow-hidden border border-border bg-cool-800">
        <img src={row.imgUrl} alt="" className="w-full h-full object-cover" />
        {row.bbox && row.bbox.w > 0 && (
          <div className="absolute border border-indigo-400/70 pointer-events-none" style={{
            left: `${row.bbox.x * 100}%`, top: `${row.bbox.y * 100}%`,
            width: `${row.bbox.w * 100}%`, height: `${row.bbox.h * 100}%`,
          }} />
        )}
        {isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-3.5 h-3.5 text-violet-300 animate-spin" />
          </div>
        )}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/60">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ConfidenceBadge confidence={row.confidence} />
          {needsManual && (
            <button onClick={onEdit} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors">
              <Edit2 className="w-2.5 h-2.5" /> סמן ידנית
            </button>
          )}
          {row.bbox && !needsManual && !isDone && (
            <button onClick={onEdit} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground/50 hover:text-foreground transition-colors">
              <Edit2 className="w-2.5 h-2.5" /> ערוך
            </button>
          )}
        </div>

        {/* Name */}
        <input
          type="text"
          value={row.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder={row.slug || 'שם המסגרת (עברית)'}
          disabled={isDone || isUploading}
          className="w-full bg-cool-800/60 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-40"
        />

        {/* Category + Style */}
        <div className="flex gap-1.5">
          <select
            value={row.category}
            onChange={e => onChange({ category: e.target.value })}
            disabled={isDone || isUploading}
            className="flex-1 bg-cool-800/60 border border-border rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-40"
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={row.style}
            onChange={e => onChange({ style: e.target.value })}
            disabled={isDone || isUploading}
            className="flex-1 bg-cool-800/60 border border-border rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-40"
          >
            {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Text config toggle */}
        {!isDone && !isUploading && (
          <button
            onClick={() => setShowText(v => !v)}
            className="flex items-center gap-1 text-[9px] text-muted-foreground/50 hover:text-foreground transition-colors mt-0.5"
          >
            <Type className="w-2.5 h-2.5" />
            כיתוב שם האירוע {showText ? '▲' : '▼'}
          </button>
        )}

        {/* Text config panel */}
        {showText && !isDone && !isUploading && (
          <div className="mt-1.5 p-2 rounded-lg bg-cool-800/40 border border-border/50 space-y-1.5">
            <div className="flex gap-1.5">
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground/50 mb-0.5">פונט</p>
                <select
                  value={tc.font || 'Playfair Display'}
                  onChange={e => setTc({ font: e.target.value })}
                  className="w-full bg-cool-900/60 border border-border rounded px-1.5 py-1 text-[10px] text-foreground focus:outline-none"
                >
                  {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="w-20">
                <p className="text-[9px] text-muted-foreground/50 mb-0.5">עובי</p>
                <select
                  value={tc.weight || 'normal'}
                  onChange={e => setTc({ weight: e.target.value })}
                  className="w-full bg-cool-900/60 border border-border rounded px-1.5 py-1 text-[10px] text-foreground focus:outline-none"
                >
                  {[['normal','רגיל'],['italic','נטוי'],['bold','מודגש']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-1.5 items-end">
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground/50 mb-0.5">צבע</p>
                <div className="flex items-center gap-1">
                  <input type="color" value={tc.color || '#888888'} onChange={e => setTc({ color: e.target.value })} className="w-6 h-6 rounded border border-border bg-transparent cursor-pointer" />
                  <span className="text-[10px] font-mono text-muted-foreground">{tc.color || '#888888'}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground/50 mb-0.5">מיקום (y)</p>
                <input
                  type="range" min="0.80" max="0.98" step="0.005"
                  value={tc.y || 0.925}
                  onChange={e => setTc({ y: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>
              <div className="w-14">
                <p className="text-[9px] text-muted-foreground/50 mb-0.5">גודל</p>
                <input
                  type="range" min="0.018" max="0.045" step="0.001"
                  value={tc.size || 0.028}
                  onChange={e => setTc({ size: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {isError && <p className="text-[10px] text-red-400">{row.errorMsg}</p>}
      </div>

      {/* Remove button */}
      {!isDone && !isUploading && (
        <button onClick={onRemove} className="self-start mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-cool-700 transition-colors text-muted-foreground/40 hover:text-foreground shrink-0">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
