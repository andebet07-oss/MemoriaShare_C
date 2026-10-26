/** The one card: hairline border on the card surface. `interactive` adds hover/press feedback. */
export default function Card({ as: Tag = 'div', interactive = false, className = '', ...props }) {
  const base = 'rounded-2xl border border-border bg-card p-4 md:p-5';
  const motion = interactive ? ' text-right transition-colors hover:border-foreground/20 active:scale-[0.99]' : '';
  return <Tag className={`${base}${motion} ${className}`} {...props} />;
}
