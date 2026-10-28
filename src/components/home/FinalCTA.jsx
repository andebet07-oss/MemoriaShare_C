import { Button } from '@/components/ui/button';
import Reveal from './Reveal';
import { WhatsAppButton } from './WhatsApp';
import { Stage, Placed, MagnetImage } from './Stage';

/** Three magnets, loosely placed, on soft indigo light. */
function ClosingMagnets() {
  return (
    <Stage w={560} h={470}>
      <div className="absolute inset-[-15%] bg-glow-soft" />
      <Placed x={20} y={60} w={330} rotate={-4} z={1}><MagnetImage id="final-1" /></Placed>
      <Placed x={345} y={0} w={205} rotate={5} z={2}><MagnetImage id="final-2" /></Placed>
      <Placed x={290} y={180} w={215} rotate={-2} z={3}><MagnetImage id="final-3" /></Placed>
    </Stage>
  );
}

/** ctaRef: the booking button (Home keeps the bottom bar away while it's on screen). */
export default function FinalCTA({ onCreateEvent, ctaRef }) {
  return (
    <section id="contact" className="overflow-hidden bg-page py-24 md:py-36" dir="rtl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-12">
        <Reveal>
          <h2 className="text-balance text-[2.5rem] font-bold leading-[1.06] text-foreground md:text-[clamp(3.5rem,5.6vw,5rem)] md:leading-[1.02]">המגנט הראשון מתחיל כאן.</h2>
          <p className="mt-4 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground md:mt-6 md:text-xl">השאירו פרטים, ונחזור אליכם לאישור התאריך.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
            <Button ref={ctaRef} size="lg" className="w-full px-12 sm:w-auto" onClick={onCreateEvent}>שריינו תאריך</Button>
            <WhatsAppButton className="w-full px-8 sm:w-auto" />
          </div>
        </Reveal>
        <Reveal delay={120} className="order-first md:order-none">
          <ClosingMagnets />
        </Reveal>
      </div>
    </section>
  );
}
