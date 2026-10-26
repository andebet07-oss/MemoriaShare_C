import SectionLabel from '@/components/system/SectionLabel';

/** Page header: label + title (+ subtitle), optional action at the inline end. */
export default function PageHeader({ label, title, subtitle, action, className = '' }) {
  return (
    <header className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 ${className}`}>
      <div className="min-w-0">
        {label && <SectionLabel className="mb-1.5">{label}</SectionLabel>}
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
