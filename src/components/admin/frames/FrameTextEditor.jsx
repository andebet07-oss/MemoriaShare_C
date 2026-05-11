import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import FramePngPreview from './FramePngPreview';
import ElementEditor   from './ElementEditor';
import memoriaService  from '@/components/memoriaService';

const TABS = [
  { key: 'icon',       label: 'אייקון'   },
  { key: 'event_name', label: 'שם אירוע' },
  { key: 'date',       label: 'תאריך'    },
];

const DEFAULT = {
  icon:       { emoji: '', x: 0.5,  y: 0.78  },
  event_name: { font: 'Heebo', size: 0.030, weight: '700', color: '#1a1a1a', align: 'center', y: 0.855 },
  date:       { font: 'Heebo', size: 0.020, weight: '400', color: '#888888', align: 'center', y: 0.915 },
};

export default function FrameTextEditor({ frame, onClose }) {
  const qc = useQueryClient();

  const [tab,    setTab]    = useState('event_name');
  const [cfg,    setCfg]    = useState(() => ({
    icon:       { ...DEFAULT.icon,       ...(frame.text_config?.icon       ?? {}) },
    event_name: { ...DEFAULT.event_name, ...(frame.text_config?.event_name ?? {}) },
    date:       { ...DEFAULT.date,       ...(frame.text_config?.date       ?? {}) },
  }));
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      await memoriaService.frameMeta.update(frame.frame_id, { text_config: cfg });
      qc.invalidateQueries({ queryKey: ['frames-library'] });
      onClose();
    } catch { setErr('שגיאה בשמירה'); }
    finally   { setSaving(false); }
  };

  return (
    <div className="col-span-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.25)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <p className="text-violet-400 text-[10px] font-bold tracking-[0.25em] uppercase">
          עריכת מסגרת · {frame.frame_id}
        </p>
        <button onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]" dir="rtl">

        {/* ── Preview panel ── */}
        <div className="p-5 border-b md:border-b-0 md:border-l flex flex-col items-center gap-3"
          style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
          <p className="text-[9px] text-muted-foreground/40 tracking-[0.25em] uppercase self-start">תצוגה מקדימה</p>
          <div className="w-full rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2a2a35, #1e1e28)', maxWidth: 200 }}>
            <FramePngPreview
              frame={{ ...frame, text_config: cfg }}
              eventName="חתונת שרה ודוד"
              eventDate="12 ביוני 2026"
              className="w-full h-auto"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))' }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground/25 text-center leading-relaxed">
            התצוגה מתעדכנת<br />לאחר כל שינוי
          </p>
        </div>

        {/* ── Controls panel ── */}
        <div className="flex flex-col min-h-0">

          {/* Tab strip */}
          <div className="flex border-b" style={{ borderColor: 'rgba(124,58,237,0.12)' }}>
            {TABS.map(t => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-3 text-xs font-semibold transition-all"
                  style={{
                    background:   active ? 'rgba(124,58,237,0.1)' : 'transparent',
                    borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
                    color:        active ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                  }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Element controls (scrollable) */}
          <div className="p-5 overflow-y-auto" style={{ maxHeight: 440 }}>
            <ElementEditor
              layer={tab}
              cfg={cfg[tab]}
              onChange={val => setCfg(prev => ({ ...prev, [tab]: val }))}
            />
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 border-t flex gap-2.5 items-center"
            style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
            {err && <p className="text-red-400 text-xs flex-1">{err}</p>}
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
