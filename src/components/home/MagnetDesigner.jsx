import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, getTemplate } from '@/lib/polaroid/templates';
import { formatEventDate } from '@/lib/formatEventDate';
import SectionHeading from './SectionHeading';
import DesignerPreview from './DesignerPreview';

// Shown on the magnet (and as placeholders) until the visitor types their own.
const SAMPLE = { first: 'שירה', second: 'עומר', date: '2027-06-17' };
const PHOTO = '/Center_PhoneMoucup_hero.jpeg';

const field = 'h-12 rounded-xl border-border bg-secondary text-base text-foreground placeholder:text-foreground/35 focus-visible:ring-2 focus-visible:ring-brand/50 md:text-base';

const joinNames = (a, b) => [a.trim(), b.trim()].filter(Boolean).join(' & ');

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "עצבו את המגנט שלכם": names, a date and a template, drawn live by the real
 * renderer. onBook({ eventName, eventDate, templateId }) carries only what the
 * visitor typed (never the sample) into the booking wizard. formRef: the form
 * (Home keeps the floating WhatsApp button off its fields and button).
 */
export default function MagnetDesigner({ onBook, formRef }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [date, setDate] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const today = todayLocal();

  const typed = joinNames(first, second);
  const name = useDebouncedValue(typed || joinNames(SAMPLE.first, SAMPLE.second), 150);
  const shownDate = useDebouncedValue(date || SAMPLE.date, 150);
  const template = getTemplate(templateId);

  const book = (e) => {
    e.preventDefault();
    onBook({ eventName: typed, eventDate: date && date >= today ? date : '', templateId });
  };

  return (
    <section id="design" className="scroll-mt-20 border-t border-border py-24 md:py-32" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading number="03" label="עצבו את המגנט שלכם" title="המגנט שלכם, עוד לפני האירוע." className="mb-12 md:mb-16" />

          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <DesignerPreview
              templateId={templateId} name={name} date={shownDate} photo={PHOTO}
              label={`המגנט בעיצוב ${template.label}: ${name}, ${formatEventDate(shownDate)}`}
              className="mx-auto w-full max-w-60 md:max-w-sm"
            />

            <form ref={formRef} onSubmit={book} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label htmlFor="designer-first" className="text-sm font-medium text-foreground">שם ראשון</label>
                  <Input id="designer-first" value={first} onChange={(e) => setFirst(e.target.value)}
                    placeholder={SAMPLE.first} maxLength={20} autoComplete="off" className={field} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="designer-second" className="text-sm font-medium text-foreground">שם שני</label>
                  <Input id="designer-second" value={second} onChange={(e) => setSecond(e.target.value)}
                    placeholder={SAMPLE.second} maxLength={20} autoComplete="off" className={field} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="designer-date" className="text-sm font-medium text-foreground">תאריך האירוע</label>
                <Input id="designer-date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)}
                  className={field} />
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-foreground">עיצוב</legend>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_IDS.map((id) => (
                    <label key={id} className="cursor-pointer">
                      <input type="radio" name="designer-template" value={id} checked={templateId === id}
                        onChange={() => setTemplateId(id)} className="peer sr-only" />
                      <span className="flex h-10 items-center rounded-full border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:text-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                        {getTemplate(id).label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col items-center gap-3 md:items-start">
                <Button type="submit" size="lg" className="w-full max-w-72 px-10 md:w-auto">אהבתי – בואו נשריין</Button>
                <p className="text-sm text-muted-foreground">השמות, התאריך והעיצוב יחכו לכם בטופס השריון.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
