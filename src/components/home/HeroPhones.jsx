import { useRef } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import { cn } from '@/lib/utils';
import PhoneFrame from './PhoneFrame';
import { LandingScreen, CameraScreen, MagnetScreen } from './HeroScreens';
import { MagnetImage } from './Stage';

// The group is laid out once, at its desktop size: 208 + 256 + 208 px phones
// with 32px gaps, 512px tall. Below md it is scaled as one unit, so phones see
// the same composition, smaller. It is fitted to 728px of screen: the tilted
// side phones may run ~12% of their width off screen; the centre phone fits.
const FIT_WIDTH = 728;
const GROUP_HEIGHT = 512; // the centre phone
const GAP_BELOW = 64;     // mb-16, scaled with the group
const MD = 768;
const CONTAINER_PADDING = 48; // HeroSection's px-6, both sides

// Magnets around the phones, in the group's units (x from its centre). Two on
// narrow screens, at the side phones' top corners; three from lg, beside them.
// They settle in after the phones rise (entrance under 1.5s, once). The lg-only
// one loads lazily, so phones never fetch it.
const FLOATING = [
  { id: 'hero-float-1', className: 'left-[calc(50%-392px)] top-[-50px] w-[150px] [rotate:-9deg] lg:left-[calc(50%-500px)] lg:top-[60px]', delay: 650, eager: true },
  { id: 'hero-float-2', className: 'left-[calc(50%+250px)] top-[-64px] w-[150px] [rotate:8deg] lg:left-[calc(50%+380px)] lg:top-[140px] lg:w-[140px]', delay: 750, eager: true },
  { id: 'hero-float-3', className: 'hidden left-[calc(50%+190px)] top-[-50px] w-[190px] [rotate:6deg] lg:block', delay: 850, eager: false },
];

// The phones drift gently once in place, out of step; paused while the hero is off screen.
const drift = 'motion-safe:animate-drift group-data-[paused]/hero:[animation-play-state:paused]';

/** The guest's flow, right to left: the event page, the camera, the magnet. */
export default function HeroPhones() {
  const ref = useRef(null);
  const { width } = useElementSize(ref);
  const screenWidth = width + CONTAINER_PADDING;
  // Below md the group always goes through the scaled wrapper (at scale ≤ 1).
  const scaled = width > 0 && screenWidth < MD;
  const scale = scaled ? Math.min(1, screenWidth / FIT_WIDTH) : 1;

  return (
    <div
      ref={ref}
      className="relative z-20 mb-16 flex min-h-[320px] items-end justify-center gap-3 [--rise:24px] motion-safe:animate-rise motion-safe:[animation-delay:200ms] motion-safe:[animation-duration:650ms] md:gap-8"
      // Scaling leaves the layout box full size: collapse the space it leaves.
      style={scaled ? { height: GROUP_HEIGHT * scale, minHeight: 0, marginBottom: GAP_BELOW * scale } : undefined}
    >
      {/* Desktop: `contents`, so the phones lay out exactly as direct children. */}
      <div
        className={scaled ? 'relative flex w-max shrink-0 origin-bottom items-end gap-8' : 'contents'}
        style={scaled ? { transform: `scale(${scale})` } : undefined}
      >
        <PhoneFrame label="דף האירוע של האורח" className={cn('z-10 -rotate-6 translate-y-5 opacity-80', drift, 'motion-safe:[animation-delay:-2.4s]')}>
          <LandingScreen />
        </PhoneFrame>
        <PhoneFrame center label="המצלמה עם מסגרת המגנט" className={cn('z-30 -translate-y-3', drift)}>
          <CameraScreen />
        </PhoneFrame>
        <PhoneFrame label="המגנט המוכן" className={cn('z-10 rotate-6 translate-y-5 opacity-80', drift, 'motion-safe:[animation-delay:-4.8s]')}>
          <MagnetScreen />
        </PhoneFrame>

        {FLOATING.map(({ id, className, delay, eager }) => (
          <div key={id} className={cn('absolute z-40 motion-safe:animate-settle', className)} style={{ animationDelay: `${delay}ms` }}>
            <MagnetImage id={id} eager={eager} />
          </div>
        ))}
      </div>
    </div>
  );
}
