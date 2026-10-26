import Card from '@/components/system/Card';

/** KPI tile: icon, big tabular number, label and optional caption. */
export default function StatTile({ icon: Icon, label, value, sub, onClick }) {
  return (
    <Card as={onClick ? 'button' : 'div'} interactive={!!onClick} onClick={onClick} className="flex flex-col items-start gap-1">
      {Icon && (
        <span className="w-9 h-9 mb-2 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Icon className="w-[18px] h-[18px]" />
        </span>
      )}
      <span className="text-3xl font-semibold tabular-nums leading-none text-foreground">{value ?? '—'}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Card>
  );
}
