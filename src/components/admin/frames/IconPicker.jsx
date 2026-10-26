import { useState } from 'react';

const ICONS = {
  'חתונה':     ['💍','🥂','💒','👰','🤵','💐','🕊️','✨','❤️','💎','🌹','🎊','🥰','💑','🫶','💏','🌸','🫧'],
  'ב.מצווה':   ['✡️','📖','🕍','🕎','⭐','🌟','🎉','📜','🕯️','🍷','🎓','📿','🌟','💫','🏺','🎶'],
  'יום הולדת': ['🎂','🎉','🎈','🎁','🎊','🥳','🍰','🌟','✨','🎀','🧁','🪅','🎆','🎇','🎏','🫶'],
  'ברית/לידה': ['👶','🍼','⭐','💙','🌟','🩵','🧸','🌈','🍭','🌷','💛','🌻','🐣','🦒','🌼','🎀'],
  'טבע':       ['🌸','🌿','🦋','🌙','☀️','🍃','🌷','🌺','🪷','🌼','🌊','🏔️','🌈','🍂','🌾','🪸'],
  'כוכבים':    ['⭐','🌟','💫','✨','🌠','💥','🔥','🌙','☀️','🪐','🌌','🎇','💎','🔮','⚡','🌀'],
};

export default function IconPicker({ value, onChange }) {
  const [cat, setCat] = useState(Object.keys(ICONS)[0]);

  return (
    <div className="flex flex-col gap-2">
      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(ICONS).map(c => {
          const active = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)}
              className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
              style={{
                background: active ? 'hsl(var(--brand) / 0.28)' : 'hsl(var(--secondary))',
                border: active ? '1px solid hsl(var(--brand) / 0.4)' : '1px solid hsl(var(--border))',
                color: active ? 'hsl(var(--brand))' : 'hsl(var(--muted-foreground))',
              }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1.5">
        {/* None */}
        <button onClick={() => onChange('')}
          className="w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all"
          style={{
            background: value === '' ? 'hsl(var(--brand) / 0.28)' : 'hsl(var(--secondary))',
            border: value === '' ? '1px solid hsl(var(--brand) / 0.4)' : '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}>
          ללא
        </button>

        {ICONS[cat].map(icon => (
          <button key={icon} onClick={() => onChange(icon)}
            className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: value === icon ? 'hsl(var(--brand) / 0.28)' : 'hsl(var(--secondary))',
              border: value === icon ? '1px solid hsl(var(--brand) / 0.4)' : '1px solid hsl(var(--border))',
            }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
