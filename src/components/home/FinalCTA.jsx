import { Button } from '@/components/ui/button';
import SectionLabel from '@/components/system/SectionLabel';

/** ctaRef: the booking button (Home keeps the floating WhatsApp button off it). */
export default function FinalCTA({ onCreateEvent, onHowItWorks, ctaRef }) {
  return (
    <section id="contact" className="border-t border-border py-24 md:py-36" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-xl text-center">
          <SectionLabel className="mb-6">בואו נתחיל</SectionLabel>
          <h2 className="text-balance text-3xl font-bold leading-tight text-foreground md:text-5xl">המגנט הראשון מתחיל כאן.</h2>

          <div className="mx-auto my-8 h-px w-10 bg-border" />

          <Button ref={ctaRef} size="lg" className="px-14" onClick={onCreateEvent}>שריינו תאריך</Button>
          <a
            href="#how-it-works"
            onClick={onHowItWorks}
            className="mx-auto mt-5 block w-fit py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            איך זה עובד
          </a>
        </div>
      </div>
    </section>
  );
}
