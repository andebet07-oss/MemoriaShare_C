/**
 * Heading typography for the lead wizard. Heebo, not Playfair Display:
 * Playfair has no Hebrew glyphs, so Hebrew headings fell back to a system serif
 * while punctuation ("?") stayed in Playfair. No letter-spacing: tracking is for
 * Latin caps only.
 */
export const LEAD_HEADING_FONT = 'font-heebo font-semibold';

/** Question + subtitle shown at the top of every wizard step. */
export default function StepHeader({ title, subtitle }) {
  return (
    <div className="text-center space-y-1">
      <h2 className={`${LEAD_HEADING_FONT} text-xl text-foreground`}>{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
