import SectionLabel from '@/components/system/SectionLabel';

/** A home section's label ("01 · למה Memoria") and H2 title. */
export default function SectionHeading({ number, label, title, className = '' }) {
  return (
    <div className={className}>
      <SectionLabel className="mb-4">
        {number && <><bdi className="tabular-nums">{number}</bdi> · </>}{label}
      </SectionLabel>
      <h2 className="text-balance text-3xl font-bold leading-tight text-foreground md:text-5xl">{title}</h2>
    </div>
  );
}
