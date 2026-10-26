// The one definition of status colours (CLAUDE.md §0.6). Print-job statuses own
// the four status tokens; lead stages map onto them (new → brand accent).
export const PRINT_STATUS = {
  pending:  { label: 'ממתין',   tone: 'pending' },
  printing: { label: 'בהדפסה',  tone: 'printing' },
  ready:    { label: 'מוכן',    tone: 'ready' },
  rejected: { label: 'נדחה',    tone: 'rejected' },
};

export const LEAD_STATUS = {
  new:       { label: 'חדש',       tone: 'brand' },
  contacted: { label: 'יצרנו קשר', tone: 'pending' },
  converted: { label: 'הומר',      tone: 'ready' },
  closed:    { label: 'סגור',      tone: 'muted' },
};

// Full class strings so Tailwind can see them.
export const TONE = {
  brand:    { text: 'text-brand',           dot: 'bg-brand',           pill: 'bg-brand/15 border-brand/30 text-brand' },
  pending:  { text: 'text-status-pending',  dot: 'bg-status-pending',  pill: 'bg-status-pending/15 border-status-pending/30 text-status-pending' },
  printing: { text: 'text-status-printing', dot: 'bg-status-printing', pill: 'bg-status-printing/15 border-status-printing/30 text-status-printing' },
  ready:    { text: 'text-status-ready',    dot: 'bg-status-ready',    pill: 'bg-status-ready/15 border-status-ready/30 text-status-ready' },
  rejected: { text: 'text-status-rejected', dot: 'bg-status-rejected', pill: 'bg-status-rejected/15 border-status-rejected/30 text-status-rejected' },
  muted:    { text: 'text-muted-foreground', dot: 'bg-muted-foreground', pill: 'bg-secondary border-border text-muted-foreground' },
};
