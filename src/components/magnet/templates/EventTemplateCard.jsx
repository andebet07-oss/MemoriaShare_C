import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { eventTemplateId, getTemplate, resolveOptions } from '@/lib/polaroid/templates';
import Card from '@/components/system/Card';
import SectionLabel from '@/components/system/SectionLabel';
import TemplatePicker from './TemplatePicker';

const fromEvent = (event) => {
  const templateId = eventTemplateId(event);
  return { templateId, options: resolveOptions(getTemplate(templateId), event?.template_options) };
};

/**
 * The event dashboard's "magnet design" card: pick the template and its
 * options; each change is saved right away. Magnets already sent keep the
 * design they were printed with — the stored composite is never re-framed.
 */
export default function EventTemplateCard({ event }) {
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState(() => fromEvent(event));
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  const save = async (next) => {
    const previous = template;
    setTemplate(next);
    setStatus('saving');
    try {
      await memoriaService.events.update(event.id, { template_id: next.templateId, template_options: next.options });
      queryClient.invalidateQueries({ queryKey: ['magnet-event', event.id] });
      setStatus('saved');
    } catch (err) {
      console.error('[EventTemplateCard] save failed:', err?.message);
      setTemplate(previous);
      setStatus('error');
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel as="h2">עיצוב המגנט</SectionLabel>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-h-4" aria-live="polite">
          {status === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> שומר...</>}
          {status === 'saved' && <><Check className="w-3.5 h-3.5 text-status-ready" /> נשמר</>}
          {status === 'error' && <span className="text-destructive">השמירה נכשלה — נסו שוב</span>}
        </span>
      </div>
      <TemplatePicker value={template} onChange={save} name={event.name} date={event.date} large />
      <p className="text-xs text-muted-foreground">מגנטים שכבר נשלחו נשארים בעיצוב שבו צולמו.</p>
    </Card>
  );
}
