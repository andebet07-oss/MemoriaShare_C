import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { whatsappUrl } from '@/lib/contact';
import { cn } from '@/lib/utils';

const LABEL = 'דברו איתנו בוואטסאפ';

/** The hero's secondary button. Renders nothing when no number is set. */
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
 * The floating button, phones only. `hidden` while the hero's own buttons are
 * on screen, so it never sits over the main CTA. Renders nothing when no
 * number is set.
 */
export function WhatsAppFab({ hidden }) {
  const href = whatsappUrl();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={LABEL}
      {...(hidden ? { inert: '', 'aria-hidden': true } : {})}
      className={cn(
        'fixed left-4 z-40 flex size-12 items-center justify-center rounded-full border border-border bg-secondary/90 text-brand shadow-card-dark backdrop-blur transition-[opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden',
        hidden ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
      )}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <MessageCircle aria-hidden className="size-6" />
    </a>
  );
}
