import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import MagnetDesigner from '@/components/home/MagnetDesigner';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/home/FinalCTA';
import { WhatsAppFab } from '@/components/home/WhatsApp';
import { LEGAL_LINKS } from '@/components/legal/legalLinks';
import { useInView } from '@/hooks/useInView';
import { useViewportHeight } from '@/hooks/useViewportHeight';

// The bottom of the screen where the floating button sits (and a little more).
// In px: browsers differ on what a percentage root margin is relative to.
const BOTTOM_BAND_PX = 180;

export default function Home() {
  const navigate = useNavigate();
  // The floating WhatsApp button steps aside while the hero's buttons are on
  // screen (they include WhatsApp), and while the designer's form or the final
  // booking button passes through the bottom of the screen, where it sits.
  const heroCtaRef = useRef(null);
  const designFormRef = useRef(null);
  const finalCtaRef = useRef(null);
  const bottomBand = `-${Math.max(0, useViewportHeight() - BOTTOM_BAND_PX)}px 0px 0px 0px`;
  const heroCtaInView = useInView(heroCtaRef, { rootMargin: '0px 0px 96px 0px' });
  const designFormLow = useInView(designFormRef, { rootMargin: bottomBand });
  const finalCtaLow = useInView(finalCtaRef, { rootMargin: bottomBand });

  // Single product: every booking CTA starts the MemoriaMagnet lead wizard.
  const startMagnetLead = () => navigate('/magnet/lead');
  // The designer's choices arrive in the wizard already filled in.
  const bookDesign = (prefill) => navigate('/magnet/lead', { state: { prefill } });

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground">
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
          <FinalCTA onCreateEvent={startMagnetLead} onHowItWorks={scrollToHowItWorks} ctaRef={finalCtaRef} />
        </main>
        {/* Phones: room at the bottom so the floating WhatsApp button never sits on the links. */}
        <footer className="border-t border-border pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] pt-8 md:py-8" dir="rtl">
          <nav aria-label="מידע משפטי" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-sm text-muted-foreground">
            {LEGAL_LINKS.map(({ to, label }, i) => (
              <span key={to} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden>·</span>}
                <Link to={to} className="rounded-sm py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">{label}</Link>
              </span>
            ))}
          </nav>
        </footer>
        <WhatsAppFab hidden={heroCtaInView || designFormLow || finalCtaLow} />
      </div>
    </div>
  );
}
