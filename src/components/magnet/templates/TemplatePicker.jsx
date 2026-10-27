import { TEMPLATE_IDS, getTemplate, resolveOptions } from '@/lib/polaroid/templates';
import PolaroidPreview from './PolaroidPreview';
import TemplateOptions from './TemplateOptions';

const SAMPLE_NAME = 'שרה & דניאל';

/**
 * Template picker for a magnet event: every template in portrait and
 * landscape, rendered with the event's real names and date, and the selected
 * template's options. Used by CreateMagnetEvent and the event dashboard.
 *
 * value:    { templateId, options }   (options resolved: defaults filled in)
 * onChange: ({ templateId, options }) => void
 */
export default function TemplatePicker({ value, onChange, name, date, large = false }) {
  const selected = getTemplate(value.templateId);
  const options = resolveOptions(selected, value.options);
  const specFor = (id, opts) => ({ templateId: id, options: opts, name: name?.trim() || SAMPLE_NAME, date });

  const select = (id) => {
    if (id === selected.id) return;
    onChange({ templateId: id, options: resolveOptions(getTemplate(id), {}) });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* The selected template, large enough to read */}
      <div className="flex items-end justify-center gap-4">
        <PolaroidPreview spec={specFor(selected.id, options)} orientation="portrait"
          className={large ? 'w-[180px]' : 'w-[132px]'} label={`${selected.label} לאורך`} />
        <PolaroidPreview spec={specFor(selected.id, options)} orientation="landscape"
          className={large ? 'w-[240px]' : 'w-[176px]'} label={`${selected.label} לרוחב`} />
      </div>

      <TemplateOptions template={selected} values={options}
        onChange={(opts) => onChange({ templateId: selected.id, options: opts })} />

      {/* All templates */}
      <div className={`grid grid-cols-2 gap-3 ${large ? 'md:grid-cols-3' : ''}`} role="radiogroup" aria-label="תבנית המגנט">
        {TEMPLATE_IDS.map((id) => {
          const t = getTemplate(id);
          const isSelected = id === selected.id;
          const opts = isSelected ? options : resolveOptions(t, {});
          return (
            <button key={id} type="button" role="radio" aria-checked={isSelected} onClick={() => select(id)}
              className={`flex flex-col gap-2 p-2.5 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                isSelected ? 'bg-brand/10 border-brand/40' : 'bg-card border-border hover:border-foreground/20'
              }`}>
              <div className="flex items-end justify-center gap-2" aria-hidden="true">
                <PolaroidPreview spec={specFor(id, opts)} orientation="portrait" className="w-[42%]" />
                <PolaroidPreview spec={specFor(id, opts)} orientation="landscape" className="w-[56%]" />
              </div>
              <span className={`text-sm font-semibold ${isSelected ? 'text-brand' : 'text-muted-foreground'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
