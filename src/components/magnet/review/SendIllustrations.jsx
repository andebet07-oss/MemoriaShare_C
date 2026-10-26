/** Illustrations for the review screen's sending / sent states (brand accent). */
export const PaperPlane = () => (
  <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="animate-paper-fly" aria-hidden="true">
    <path d="M6 34L62 6L42 62L32 40L6 34Z" className="fill-brand" opacity="0.9" />
    <path d="M32 40L42 34L6 34" className="stroke-primary" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M32 40L42 62" className="stroke-primary" strokeWidth="1.4" />
  </svg>
);

export const Champagne = () => (
  <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">
    <path d="M26 6H42L48 30L34 40L20 30L26 6Z" className="fill-brand/20 stroke-brand" strokeWidth="1.5" />
    <path d="M34 40V58M26 58H42" className="stroke-brand" strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="16" r="2.5" className="fill-brand" opacity="0.65" />
    <circle cx="50" cy="12" r="2" className="fill-brand" opacity="0.5" />
    <circle cx="54" cy="26" r="1.5" className="fill-brand" opacity="0.55" />
    <circle cx="14" cy="28" r="2" className="fill-brand" opacity="0.4" />
    <path d="M22 9L18 5M46 11L50 7" className="stroke-brand" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
