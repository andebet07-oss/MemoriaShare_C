import { describe, it, expect } from 'vitest';
import { parseLeadDetails, leadTemplateMeta } from '@/components/admin/overview/LeadCard';

describe('parseLeadDetails', () => {
  it('reads the template the visitor picked on the home page', () => {
    const d = parseLeadDetails('נועה & דניאל · גן אירועים · עד 150 אורחים · template:C');
    expect(d).toMatchObject({ eventName: 'נועה & דניאל', location: 'גן אירועים', guestCount: 'עד 150 אורחים', templateId: 'C' });
    expect(leadTemplateMeta(d.templateId).text).toBe('עיצוב לב אדום');
  });

  it('keeps the cover and ignores an unknown template', () => {
    const d = parseLeadDetails('א & ב · מקום · עד 100 אורחים · cover:https://x/y.jpg · template:Z');
    expect(d.coverImageUrl).toBe('https://x/y.jpg');
    expect(d.templateId).toBe('');
    expect(leadTemplateMeta(d.templateId)).toBeNull();
  });

  it('reads older leads without a template', () => {
    expect(parseLeadDetails('א · ב · ג').templateId).toBe('');
  });
});
