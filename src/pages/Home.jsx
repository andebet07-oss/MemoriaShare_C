import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import MagnetDesigner from '@/components/home/MagnetDesigner';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/home/FinalCTA';
import { MobileActionBar } from '@/components/home/WhatsApp';
import { LEGAL_LINKS } from '@/components/legal/legalLinks';
import { useInView } from '@/hooks/useInView';

export default function Home() {
  const navigate = useNavigate();
  // The phones' bottom bar shows once the hero's buttons are scrolled away, and
  // steps aside while the designer (its own button, its fields) or the final
  // booking button is on screen.
  const heroCtaRef = useRef(null);
  const designFormRef = useRef(null);
  const finalCtaRef = useRef(null);
  const heroCtaInView = useInView(heroCtaRef);
  const designFormInView = useInView(designFormRef);
  const finalCtaInView = useInView(finalCtaRef);

  // Single product: every booking CTA starts the MemoriaMagnet lead wizard.
  const startMagnetLead = () => navigate('/magnet/lead');
  // The designer's choices arrive in the wizard already filled in.
  const bookDesign = (prefill) => navigate('/magnet/lead', { state: { prefill } });

  return (
    // Home and legal pages: secondary text at #b4b4b4 (approved 2026-10-28).
    <div className="min-h-screen bg-page text-foreground [--muted-foreground:0_0%_71%]">
      <div className="relative z-10">
        {/* Keyboard users skip the header straight to the page. */}
        <a href="#content" className="sr-only rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[1000]">דלגו לתוכן</a>
        <Header onCreateEvent={startMagnetLead} />
        <main id="content" tabIndex={-1} className="outline-none">
          <HeroSection onCreateEvent={startMagnetLead} ctaRef={heroCtaRef} />
          <Features />
          <HowItWorks />
          <MagnetDesigner onBook={bookDesign} formRef={designFormRef} />
          <FAQ />
          <FinalCTA onCreateEvent={startMagnetLead} ctaRef={finalCtaRef} />
        </main>
        {/* Phones: room at the bottom so the bottom bar never sits on the links. */}
        <footer className="bg-page pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] pt-10 md:py-10" dir="rtl">
          <nav aria-label="מידע משפטי" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-sm text-muted-foreground">
            {LEGAL_LINKS.map(({ to, label }, i) => (
              <span key={to} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden>·</span>}
                <Link to={to} className="rounded-sm py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">{label}</Link>
              </span>
            ))}
          </nav>
        </footer>
        <MobileActionBar hidden={heroCtaInView || designFormInView || finalCtaInView} onBook={startMagnetLead} />
      </div>
    </div>
  );
}
