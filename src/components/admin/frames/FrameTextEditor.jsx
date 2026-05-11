import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import FramePngPreview from './FramePngPreview';
import memoriaService from '@/components/memoriaService';

const FONTS = [
  { value: 'Heebo',            label: 'Heebo'    },
  { value: 'Playfair Display', label: 'Playfair' },
];

const COLORS = ['#1a1a1a', '#444444', '#888888', '#7c3aed', '#b8860b', '#ffffff'];

const ICON_PICKS = ['', '💍', '🎂', '🥂', '✡️', '🌸', '🎉', '🕊️', '⭐', '🌿'];

const DEFAULT_CFG = {
  icon:       { emoji: '', y: 0.78 },
  event_name: { font: 'Heebo', size: 0.030, weight: '700', color: '#1a1a1a', align: 'center', y: 0.855 },
  date:       { font: 'Heebo', size: 0.020, weight: '400', color: '#888888', align: 'center', y: 0.915 },
};

function Section({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase mb-2">{label}</p>
      {children}
    </div>
  );
}

function TextLayerControls({ cfg, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Font */}
      <div className="flex gap-1.5">
        {FONTS.map(f => {
          const active = cfg.font === f.value;
          return (
            <button key={f.value} onClick={() => onChange('font', f.value)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                fontFamily: f.value,
                background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
              }}>
              {f.label}
            </button>
          );
        })}
      </div>
      {/* Weight */}
      <div className="flex gap-1.5">
        {[['400', 'רגיל'], ['700', 'מודגש']].map(([w, l]) => {
          const active = cfg.weight === w;
          return (
            <button key={w} onClick={() => onChange('weight', w)}
              className="flex-1 py-1.5 rounded-lg text-xs transition-all"
              style={{
                fontWeight: w,
                background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
              }}>
              {l}
            </button>
          );
        })}
      </div>
      {/* Color swatches */}
      <div className="flex items-center gap-2 flex-wrap">
        {COLORS.map(c => (
          <button key={c} onClick={() => onChange('color', c)}
            className="w-6 h-6 rounded-full transition-all"
            style={{
              background: c,
              border: cfg.color === c ? '2px solid #7c3aed' : '2px solid rgba(255,255,255,0.1)',
              outline: cfg.color === c ? '2px solid rgba(124,58,237,0.4)' : 'none',
              outlineOffset: '2px',
              boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
            }} />
        ))}
        {/* Free-pick */}
        <label className="w-6 h-6 rounded-full cursor-pointer relative flex items-center justify-center overflow-hidden"
          style={{ border: '1px dashed rgba(255,255,255,0.2)' }} title="צבע חופשי">
          <input type="color" value={cfg.color}
            onChange={e => onChange('color', e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          <span className="text-[9px] text-muted-foreground/50 pointer-events-none">+</span>
        </label>
      </div>
    </div>
  );
}

export default function FrameTextEditor({ frame, onClose }) {
  const qc = useQueryClient();

  const [cfg, setCfg] = useState(() => ({
    icon:       { ...DEFAULT_CFG.icon,       ...(frame.text_config?.icon       ?? {}) },
    event_name: { ...DEFAULT_CFG.event_name, ...(frame.text_config?.event_name ?? {}) },
    date:       { ...DEFAULT_CFG.date,       ...(frame.text_config?.date       ?? {}) },
  }));
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const setLayer = (layer, key, val) =>
    setCfg(prev => ({ ...prev, [layer]: { ...prev[layer], [key]: val } }));

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await memoriaService.frameMeta.update(frame.frame_id, { text_config: cfg });
      qc.invalidateQueries({ queryKey: ['frames-library'] });
      onClose();
    } catch {
      setErr('שגיאה בשמירה — נסה שנית');
    } finally {
      setSaving(false);
    }
  };

  const previewFrame = { ...frame, text_config: cfg };

  return (
    <div className="col-span-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.25)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.25em] uppercase">
          עריכה · {frame.frame_id}
        </p>
        <button onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5" dir="rtl">

        {/* Live preview */}
        <div className="flex items-center justify-center rounded-xl overflow-hidden"
          style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg, #2a2a35, #1e1e28)' }}>
          <FramePngPreview
            frame={previewFrame}
            eventName="חתונת שרה ודוד"
            eventDate="12 ביוני 2026"
            className="w-[82%] h-auto"
            style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))' }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">

          <Section label="אייקון">
            <div className="flex flex-wrap gap-1.5">
              {ICON_PICKS.map(e => {
                const active = cfg.icon.emoji === e;
                return (
                  <button key={e || '__none__'} onClick={() => setLayer('icon', 'emoji', e)}
                    className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                    style={{
                      background: active ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.04)',
                      border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    {e || <span className="text-[9px] text-muted-foreground/40">ללא</span>}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="שם האירוע">
            <TextLayerControls cfg={cfg.event_name} onChange={(k, v) => setLayer('event_name', k, v)} />
          </Section>

          <Section label="תאריך">
            <TextLayerControls cfg={cfg.date} onChange={(k, v) => setLayer('date', k, v)} />
          </Section>

          {err && <p className="text-red-400 text-xs">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              שמור
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground border border-border transition-colors">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
