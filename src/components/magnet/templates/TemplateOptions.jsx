import { Check } from 'lucide-react';

const chip = (active) => `flex items-center gap-2 h-9 px-3 rounded-full border text-sm font-semibold transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
  active ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
}`;

/**
 * The selected template's options: colour choices as swatch chips, toggles as
 * shown / hidden chips. `values` are already resolved (defaults filled in).
 */
export default function TemplateOptions({ template, values, onChange }) {
  const entries = Object.entries(template.options);
  if (!entries.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {entries.map(([key, def]) => (
        <div key={key} className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{def.label}</p>
          <div className="flex flex-wrap gap-2">
            {def.type === 'toggle'
              ? [[true, 'מוצג'], [false, 'מוסתר']].map(([v, label]) => (
                  <button key={label} type="button" aria-pressed={values[key] === v}
                    onClick={() => onChange({ ...values, [key]: v })} className={chip(values[key] === v)}>
                    {values[key] === v && <Check className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                ))
              : Object.entries(def.choices).map(([v, choice]) => (
                  <button key={v} type="button" aria-pressed={values[key] === v}
                    onClick={() => onChange({ ...values, [key]: v })} className={chip(values[key] === v)}>
                    {/* The printed colour itself (printed-design colour, not a UI token). */}
                    <span className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: choice.value }} />
                    {choice.label}
                  </button>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
