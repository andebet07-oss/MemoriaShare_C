import IconPicker from './IconPicker';
import PositionPad from './PositionPad';

// ── Google Fonts — Hebrew-compatible ────────────────────────────────────────
const FONTS = [
  { value: 'Heebo',            sample: 'שרה ודוד',   note: 'ברירת מחדל'  },
  { value: 'Frank Ruhl Libre', sample: 'שרה ודוד',   note: 'קלאסי'        },
  { value: 'Assistant',        sample: 'שרה ודוד',   note: 'נקי'          },
  { value: 'Secular One',      sample: 'שרה ודוד',   note: 'דיספליי'      },
  { value: 'Rubik',            sample: 'שרה ודוד',   note: 'עגול'         },
  { value: 'Noto Sans Hebrew', sample: 'שרה ודוד',   note: 'אוניברסלי'    },
  { value: 'Playfair Display', sample: 'Sara & David', note: 'לטינית'     },
];

const PRELOADED = new Set(['Heebo', 'Playfair Display']);

function loadFont(name) {
  if (PRELOADED.has(name)) return;
  const id = `gf-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = Object.assign(document.createElement('link'), {
    id, rel: 'stylesheet',
    href: `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, '+')}:wght@300;400;600;700&display=swap`,
  });
  document.head.appendChild(link);
}

const COLORS = ['#111111','#444444','#777777','#aaaaaa','#ffffff','#7c3aed','#2563eb','#059669','#d97706','#dc2626'];

const SIZES = [
  { label: 'XS', v: 0.016 }, { label: 'S', v: 0.022 }, { label: 'M', v: 0.030 },
  { label: 'L',  v: 0.040 }, { label: 'XL', v: 0.052 },
];

// ── Sub-components ───────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p className="text-[9px] font-bold text-violet-400/70 tracking-[0.2em] uppercase mb-1.5">{children}</p>
  );
}

function Pill({ active, onClick, children, style }) {
  return (
    <button onClick={onClick}
      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
        border:     active ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
        color:      active ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
        ...style,
      }}>
      {children}
    </button>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function ElementEditor({ layer, cfg, onChange }) {
  const set = (k, v) => onChange({ ...cfg, [k]: v });

  // ── Icon layer ─────────────────────────────────────────────────────────────
  if (layer === 'icon') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Label>בחר אייקון</Label>
          <IconPicker value={cfg.emoji ?? ''} onChange={v => set('emoji', v)} />
        </div>
        {cfg.emoji && (
          <PositionPad
            x={cfg.x ?? 0.5} y={cfg.y ?? 0.78}
            onChange={({ x, y }) => onChange({ ...cfg, x, y })}
            iconMode
          />
        )}
      </div>
    );
  }

  // ── Text layers (event_name / date) ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Font grid */}
      <div>
        <Label>פונט</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {FONTS.map(f => {
            const active = cfg.font === f.value;
            return (
              <button key={f.value}
                onClick={() => { loadFont(f.value); set('font', f.value); }}
                className="flex flex-col items-start px-3 py-2 rounded-xl transition-all text-right"
                style={{
                  background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                  border:     active ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                <span style={{ fontFamily: `'${f.value}', sans-serif`, fontSize: 15, color: active ? '#e8e4ff' : 'rgba(255,255,255,0.7)', direction: 'rtl' }}>
                  {f.sample}
                </span>
                <span className="text-[9px] mt-0.5" style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.25)' }}>
                  {f.note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight */}
      <div>
        <Label>עובי</Label>
        <div className="flex gap-1.5">
          {[['300','דק'], ['400','רגיל'], ['600','בינוני'], ['700','מודגש']].map(([w, l]) => (
            <Pill key={w} active={cfg.weight === w} onClick={() => set('weight', w)}>{l}</Pill>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <Label>גודל</Label>
        <div className="flex gap-1.5">
          {SIZES.map(s => (
            <Pill key={s.v} active={cfg.size === s.v} onClick={() => set('size', s.v)}>{s.label}</Pill>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <Label>צבע</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => set('color', c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                background: c,
                border:      cfg.color === c ? '2px solid #7c3aed' : '2px solid rgba(255,255,255,0.12)',
                outline:     cfg.color === c ? '2px solid rgba(124,58,237,0.5)' : 'none',
                outlineOffset: '2px',
                boxShadow:   c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
              }} />
          ))}
          <label className="w-7 h-7 rounded-full cursor-pointer relative flex items-center justify-center overflow-hidden"
            style={{ border: '1px dashed rgba(255,255,255,0.2)' }} title="צבע חופשי">
            <input type="color" value={cfg.color || '#333333'} onChange={e => set('color', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <span className="text-[10px] text-muted-foreground/50 pointer-events-none">+</span>
          </label>
        </div>
      </div>

      {/* Y Position */}
      <PositionPad
        x={0.5} y={cfg.y ?? 0.88}
        onChange={({ y }) => set('y', y)}
        iconMode={false}
      />

      {/* Alignment */}
      <div>
        <Label>יישור</Label>
        <div className="flex gap-1.5">
          {[['right','ימין'], ['center','מרכז'], ['left','שמאל']].map(([v, l]) => (
            <Pill key={v} active={cfg.align === v} onClick={() => set('align', v)}>{l}</Pill>
          ))}
        </div>
      </div>

    </div>
  );
}
