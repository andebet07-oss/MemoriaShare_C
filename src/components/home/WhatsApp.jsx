import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { whatsappUrl } from '@/lib/contact';
import { cn } from '@/lib/utils';

const LABEL = 'דברו איתנו בוואטסאפ';

/** The secondary WhatsApp button (hero, final CTA). Renders nothing when no number is set. */
export function WhatsAppButton({ className }) {
  const href = whatsappUrl();
  if (!href) return null;
  return (
    <Button asChild size="lg" variant="secondary" className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle aria-hidden />
        {LABEL}
      </a>
    </Button>
  );
}

/**
 * The phones' bottom bar: the booking button, with WhatsApp beside it as an
 * icon. `hidden` while another booking button is on screen or a field has
 * focus (Home decides). Without a number, the bar holds the booking button only.
 */
export function MobileActionBar({ hidden, onBook }) {
  const href = whatsappUrl();
  return (
    <div
      {...(hidden ? { inert: '', 'aria-hidden': true } : {})}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex gap-2.5 bg-page/85 px-4 pt-2.5 backdrop-blur-xl transition-[opacity,transform] duration-200 motion-reduce:transition-none md:hidden',
        hidden ? 'pointer-events-none translate-y-full opacity-0' : 'opacity-100',
      )}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      dir="rtl"
    >
      <Button size="lg" className="h-12 flex-1" onClick={onBook}>שריינו תאריך</Button>
      {href && (
        <Button asChild size="icon" variant="secondary" className="size-12 shrink-0 [&_svg]:size-5">
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={LABEL}>
            <MessageCircle aria-hidden />
          </a>
        </Button>
      )}
    </div>
  );
}
