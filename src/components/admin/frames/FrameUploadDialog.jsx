import { useState, useEffect } from 'react';
import { X, Check, Loader2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import memoriaService from '@/components/memoriaService';
import { loadFrameImage, punchHoleToBlob } from '@/lib/punchHole';
import { CATEGORY_LABELS } from '@/lib/framesMeta';
import FrameHoleEditor from './FrameHoleEditor';

const CATEGORIES = ['wedding', 'bar-mitzvah', 'birthday', 'brit', 'corporate', 'general'];
const DEFAULT_BBOX = { x: 0.06, y: 0.07, w: 0.88, h: 0.74 };
const slugify = (cat) => `${cat}-${Date.now().toString(36)}`;

/**
 * Modal to add a new frame template OR re-define an existing frame's photo
 * window. Punches the window transparent on save so the guest photo fits cleanly.
 * Props: frame? (edit mode when provided), onClose.
 */
export default function FrameUploadDialog({ frame = null, onClose }) {
  const qc = useQueryClient();
  const editMode = !!frame;

  const [imageSrc, setImageSrc] = useState(frame?.image_url ?? null);
  const [bbox, setBbox] = useState(frame?.hole_bbox ?? DEFAULT_BBOX);
  const [displayName, setDisplayName] = useState(frame?.display_name ?? '');
  const [category, setCategory] = useState(frame?.category ?? 'wedding');
  const [aspect, setAspect] = useState(frame?.aspect ?? 'landscape');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, saving]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageSrc(URL.createObjectURL(f));
    setBbox(DEFAULT_BBOX);
    setErr('');
  };

  const save = async () => {
    if (!imageSrc) { setErr('בחרו קובץ מסגרת'); return; }
    if (!displayName.trim()) { setErr('הזינו שם למסגרת'); return; }
    setSaving(true); setErr('');
    try {
      if (editMode) {
        const imgEl = await loadFrameImage(frame.image_url);
        const blob = await punchHoleToBlob(imgEl, bbox, frame.hole_bbox); // heal old window
        const file = new File([blob], `${frame.frame_id}.png`, { type: 'image/png' });
        await memoriaService.frameMeta.updateImage(frame.frame_id, file, frame.style || 'photo_print', {
          hole_bbox: bbox, aspect, category, display_name: displayName.trim(),
        });
      } else {
        const slug = slugify(category);
        const imgEl = await loadFrameImage(imageSrc);
        const blob = await punchHoleToBlob(imgEl, bbox);
        const file = new File([blob], `${slug}.png`, { type: 'image/png' });
        await memoriaService.frameMeta.uploadLibraryPng(file, {
          slug, name: displayName.trim(), style: 'photo_print', category, aspect,
          hole_bbox: bbox, text_config: { preserve_strip: true },
        });
        await memoriaService.frameMeta.update(slug, { display_name: displayName.trim() });
      }
      qc.invalidateQueries({ queryKey: ['frames-library'] });
      onClose();
    } catch {
      setErr('שגיאה בשמירה');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,8,12,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={() => !saving && onClose()} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg,#1c1c24,#15151c)', border: '1px solid rgba(124,58,237,0.3)' }}
        onClick={(e) => e.stopPropagation()} dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div>
            <p className="text-violet-400 text-[10px] font-bold tracking-[0.25em] uppercase">
              {editMode ? 'חלון תמונה' : 'מסגרת חדשה'}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {editMode ? (frame.display_name || frame.frame_id) : 'העלאה והגדרת חלון מדויק'}
            </p>
          </div>
          <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10" aria-label="סגור">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* File picker (new mode) */}
          {!editMode && (
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-white/60 text-sm cursor-pointer hover:border-violet-400/40 hover:text-white/80 transition-colors">
              <Upload className="w-4 h-4" />
              {imageSrc ? 'החלפת קובץ' : 'בחרו תמונת מסגרת (PNG/JPG)'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickFile} />
            </label>
          )}

          {/* Hole editor */}
          {imageSrc && (
            <FrameHoleEditor imageSrc={imageSrc} bbox={bbox} onChange={setBbox} textConfig={frame?.text_config ?? null} />
          )}

          {/* Metadata */}
          {imageSrc && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 sm:col-span-1">
                <span className="text-[10px] text-muted-foreground/50">שם המסגרת</span>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="לדוגמה: לב קלאסי"
                  className="text-sm text-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-violet-400/50 focus:outline-none" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground/50">קטגוריה</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="text-sm text-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-violet-400/50 focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-cool-900">{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground/50">יחס</span>
                <div className="flex gap-1.5">
                  {[['landscape', 'לרוחב'], ['portrait', 'לאורך']].map(([a, label]) => (
                    <button key={a} type="button" onClick={() => setAspect(a)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${aspect === a ? 'bg-violet-500/25 border-violet-400/40 text-violet-200' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t flex gap-2.5 items-center shrink-0" style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
          {err && <p className="text-red-400 text-xs flex-1">{err}</p>}
          <button onClick={save} disabled={saving || !imageSrc}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editMode ? 'שמור חלון' : 'הוסף מסגרת'}
          </button>
          <button onClick={() => !saving && onClose()} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground border border-border transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
