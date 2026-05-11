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
              className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
              style={{
                background: active ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
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
          className="w-9 h-9 rounded-xl text-[9px] font-semibold flex items-center justify-center transition-all"
          style={{
            background: value === '' ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.04)',
            border: value === '' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.35)',
          }}>
          ללא
        </button>

        {ICONS[cat].map(icon => (
          <button key={icon} onClick={() => onChange(icon)}
            className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: value === icon ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.04)',
              border: value === icon ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
            }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
