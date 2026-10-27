import { useNavigate } from 'react-router-dom';

import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Designs from '@/components/home/Designs';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/home/FinalCTA';

export default function Home() {
  const navigate = useNavigate();

  // Single product: every booking CTA starts the MemoriaMagnet lead wizard.
  const startMagnetLead = () => navigate('/magnet/lead');

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground">
      <div className="relative z-10">
        <Header onCreateEvent={startMagnetLead} />
        <main>
          <HeroSection onCreateEvent={startMagnetLead} />
          <Features />
          <HowItWorks />
          <Designs />
          <FAQ />
          <FinalCTA onCreateEvent={startMagnetLead} onHowItWorks={scrollToHowItWorks} />
        </main>
        <footer className="border-t border-border py-8" dir="rtl">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href="/privacy.html" className="transition-colors hover:text-foreground">מדיניות פרטיות</a>
            <span aria-hidden>·</span>
            <a href="/terms.html" className="transition-colors hover:text-foreground">תנאי שימוש</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
