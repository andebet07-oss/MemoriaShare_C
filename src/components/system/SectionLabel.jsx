/** Small Hebrew label above a page title or a section (no tracking, no uppercase). */
export default function SectionLabel({ as: Tag = 'p', className = '', children }) {
  return <Tag className={`text-xs font-semibold text-brand ${className}`}>{children}</Tag>;
}
