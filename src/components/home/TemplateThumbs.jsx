import { TEMPLATE_IDS, getTemplate } from '@/lib/polaroid/templates';
import { magnetSrc } from './samplePhotos';

/**
 * The designer's template choice: each template as a real magnet (pre-rendered,
 * a different photo each, so they are easy to tell apart), with its name.
 * Native radios: arrow keys move between them. A sideways row on phones.
 */
export default function TemplateThumbs({ value, onChange }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-medium text-muted-foreground">עיצוב</legend>
      <div className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-3 pt-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-7 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {TEMPLATE_IDS.map((id) => (
          <label key={id} className="group relative w-[112px] shrink-0 cursor-pointer snap-start md:w-auto">
            <input type="radio" name="designer-template" value={id} checked={value === id}
              onChange={() => onChange(id)} className="peer sr-only" />
            <img src={magnetSrc(`tpl-${id}`)} alt="" loading="lazy" decoding="async" draggable={false}
              className="block aspect-[3/4] w-full rounded-[2px] shadow-magnet transition-transform duration-200 group-hover:-translate-y-1 peer-checked:-translate-y-1.5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-4 peer-focus-visible:ring-offset-page motion-reduce:transition-none" />
            <span className="mt-3 block w-fit border-b-2 border-transparent pb-1 text-sm text-muted-foreground transition-colors peer-checked:border-brand peer-checked:font-semibold peer-checked:text-foreground md:text-[15px]">
              {getTemplate(id).label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
