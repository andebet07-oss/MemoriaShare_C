import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, getTemplate } from '@/lib/polaroid/templates';
import { formatEventDate } from '@/lib/formatEventDate';
import Reveal from './Reveal';
import DesignerPreview from './DesignerPreview';
import TemplateThumbs from './TemplateThumbs';
import { PHOTOS, DESIGNER_PHOTOS, DESIGNER_SAMPLE, magnetSrc } from './samplePhotos';

// Shown on the magnet (and as placeholders) until the visitor types their own.
const [SAMPLE_FIRST, SAMPLE_SECOND] = DESIGNER_SAMPLE.name.split(' & ');

// Underlined fields: no boxes. Focus thickens the line in indigo.
const field = 'h-auto rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 pb-2.5 pt-1 text-xl text-foreground shadow-none placeholder:text-foreground/35 focus-visible:border-brand focus-visible:shadow-[inset_0_-1px_0_hsl(var(--brand))] focus-visible:ring-0 md:text-2xl';
const labelCls = 'text-sm font-medium text-muted-foreground';

const joinNames = (a, b) => [a.trim(), b.trim()].filter(Boolean).join(' & ');

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "עצבו את המגנט שלכם": names, a date and a template, drawn live by the real
 * renderer, each template with its own sample photo. onBook({ eventName,
 * eventDate, templateId }) carries only what the visitor typed (never the
 * sample) into the booking wizard. formRef: the form (Home keeps the bottom
 * bar off it).
 */
export default function MagnetDesigner({ onBook, formRef }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [date, setDate] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const today = todayLocal();

  const typed = joinNames(first, second);
  const name = useDebouncedValue(typed || DESIGNER_SAMPLE.name, 150);
  const shownDate = useDebouncedValue(date || DESIGNER_SAMPLE.date, 150);
  const template = getTemplate(templateId);
  const next = TEMPLATE_IDS[(TEMPLATE_IDS.indexOf(templateId) + 1) % TEMPLATE_IDS.length];

  const book = (e) => {
    e.preventDefault();
    onBook({ eventName: typed, eventDate: date && date >= today ? date : '', templateId });
  };

  return (
    <section id="design" className="scroll-mt-20 overflow-x-clip bg-page py-24 md:py-36" dir="rtl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 md:grid-cols-2 md:gap-x-16 md:gap-y-12 md:px-12">
        <Reveal className="md:col-start-1 md:row-start-1">
          <h2 className="text-balance text-[2.25rem] font-bold leading-[1.1] text-foreground md:text-[clamp(3rem,5vw,4.5rem)] md:leading-[1.05]">עצבו את המגנט שלכם.</h2>
          <p className="mt-4 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground md:mt-5 md:text-xl">כתבו שמות ותאריך, בחרו עיצוב, והמגנט מתעדכן מול העיניים.</p>
        </Reveal>

        <Reveal delay={120} className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
          <DesignerPreview
            templateId={templateId} name={name} date={shownDate} photo={PHOTOS[DESIGNER_PHOTOS[templateId]]}
            behind={magnetSrc(`tpl-${next}`)}
            label={`המגנט בעיצוב ${template.label}: ${name}, ${formatEventDate(shownDate)}`}
            className="mx-auto w-full max-w-60 md:max-w-sm"
          />
        </Reveal>

        <form ref={formRef} onSubmit={book} className="flex min-w-0 flex-col gap-8 md:col-start-1 md:row-start-2">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="designer-first" className={labelCls}>שם ראשון</label>
              <Input id="designer-first" value={first} onChange={(e) => setFirst(e.target.value)}
                placeholder={SAMPLE_FIRST} maxLength={20} autoComplete="off" className={field} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="designer-second" className={labelCls}>שם שני</label>
              <Input id="designer-second" value={second} onChange={(e) => setSecond(e.target.value)}
                placeholder={SAMPLE_SECOND} maxLength={20} autoComplete="off" className={field} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="designer-date" className={labelCls}>תאריך האירוע</label>
            <Input id="designer-date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>

          <TemplateThumbs value={templateId} onChange={setTemplateId} />

          <div className="flex flex-col items-stretch gap-3 md:items-start">
            <Button type="submit" size="lg" className="w-full px-10 md:w-auto">אהבתי – בואו נשריין</Button>
            <p className="text-sm text-muted-foreground">השמות, התאריך והעיצוב יחכו לכם בטופס השריון.</p>
          </div>
        </form>
      </div>
    </section>
  );
}
