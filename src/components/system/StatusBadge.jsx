import { PRINT_STATUS, LEAD_STATUS, TONE } from '@/components/system/statusStyles';

/** Status pill. `kind` picks the status table: print jobs (default) or leads. */
export default function StatusBadge({ status, kind = 'print', icon: Icon, children, className = '' }) {
  const cfg = (kind === 'lead' ? LEAD_STATUS : PRINT_STATUS)[status] ?? { label: status, tone: 'muted' };
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-semibold ${TONE[cfg.tone].pill} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children ?? cfg.label}
    </span>
  );
}
