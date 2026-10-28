import { Plus, Phone, CalendarDays, MapPin, Users, Palette } from 'lucide-react';
import { TEMPLATES } from '@/lib/polaroid/templates';
import Card from '@/components/system/Card';
import { Button } from '@/components/ui/button';

export function parseLeadDetails(details = '') {
  const parts = details.split(' · ');
  const coverPart = parts.find(p => p.startsWith('cover:'));
  // Set when the visitor came from the home page designer.
  const templatePart = parts.find(p => p.startsWith('template:'));
  const templateId = templatePart?.replace('template:', '').trim();
  return {
    eventName:     parts[0]?.trim() || '',
    location:      parts[1]?.trim() || '',
    guestCount:    parts[2]?.trim() || '',
    coverImageUrl: coverPart ? coverPart.replace('cover:', '') : '',
    templateId:    TEMPLATES[templateId] ? templateId : '',
  };
}

/** The template the visitor picked, as a meta line ("עיצוב רך"), or null. */
export function leadTemplateMeta(templateId) {
  return templateId ? { Icon: Palette, text: `עיצוב ${TEMPLATES[templateId].label}` } : null;
}

/** Actionable lead card on the overview: details, phone, "create event". */
export default function LeadCard({ lead, onCreateEvent }) {
  const { eventName, location, guestCount, templateId } = parseLeadDetails(lead.details);
  const formattedDate = lead.event_date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date(lead.event_date + 'T00:00:00'))
    : null;
  const meta = [
    formattedDate && { Icon: CalendarDays, text: formattedDate },
    location && { Icon: MapPin, text: location },
    guestCount && { Icon: Users, text: guestCount },
    leadTemplateMeta(templateId),
  ].filter(Boolean);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground truncate">{eventName || lead.full_name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{lead.full_name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {meta.map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />{text}
              </span>
            ))}
          </div>
        </div>
        <a href={`tel:${lead.phone}`} className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80 transition-colors">
          <Phone className="w-4 h-4" />
          <span dir="ltr" className="tabular-nums">{lead.phone}</span>
        </a>
      </div>
      <Button onClick={() => onCreateEvent(lead)} className="w-full">
        <Plus />
        צור אירוע מגנטים
      </Button>
    </Card>
  );
}
