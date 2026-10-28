import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LEGAL_LINKS } from './legalLinks';

const link = 'rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60';

/**
 * A plain text page (accessibility statement, privacy, terms): back link,
 * draft notice, title, sections, and links to the other two pages.
 */
export default function LegalPage({ title, updated, children }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Memoria`;
    return () => { document.title = previous; };
  }, [title]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className={`flex items-center gap-2 text-sm text-muted-foreground ${link}`}>
            <ArrowRight aria-hidden className="size-4" />
            לדף הבית
          </Link>
          <Link to="/" className={link}><img src="/LOGO.png" alt="Memoria, לדף הבית" className="h-8 w-auto" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Remove once the owner has approved the text. */}
        <p role="note" className="mb-10 rounded-xl border border-dashed border-destructive px-4 py-3 text-sm text-foreground">
          טיוטה לבדיקה: הנוסח עוד לא אושר, ומקומות שמסומנים ב־TODO מחכים לפרטים.
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">עדכון אחרון: {updated}</p>
        <div className="mt-10 flex flex-col gap-10">{children}</div>
      </main>

      <footer className="border-t border-border py-8">
        <nav aria-label="מידע משפטי" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {LEGAL_LINKS.map(({ to, label }) => <Link key={to} to={to} className={link}>{label}</Link>)}
        </nav>
      </footer>
    </div>
  );
}

/** A titled section of a legal page. */
export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground [&_li]:ms-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </section>
  );
}

/** A detail we don't have yet, marked for the owner. */
export function Todo({ children }) {
  return <mark className="rounded border border-dashed border-destructive bg-transparent px-1 text-foreground">TODO: {children}</mark>;
}
