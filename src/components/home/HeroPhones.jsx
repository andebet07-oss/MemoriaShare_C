import { useRef } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import PhoneFrame from './PhoneFrame';
import { LandingScreen, CameraScreen, MagnetScreen } from './HeroScreens';

// The group is laid out once, at its desktop size: 208 + 256 + 208 px phones
// with 32px gaps, 512px tall. Below md it is scaled as one unit, so phones see
// the same composition, smaller. It is fitted to 728px of screen: the tilted
// side phones may run ~12% of their width off screen; the centre phone fits.
const FIT_WIDTH = 728;
const GROUP_HEIGHT = 512; // the centre phone
const GAP_BELOW = 64;     // mb-16, scaled with the group
const MD = 768;
const CONTAINER_PADDING = 48; // HeroSection's px-6, both sides

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
      className="relative z-20 mb-16 flex min-h-[320px] items-end justify-center gap-3 delay-300 duration-700 animate-in fade-in fill-mode-both md:gap-8"
      // Scaling leaves the layout box full size: collapse the space it leaves.
      style={scaled ? { height: GROUP_HEIGHT * scale, minHeight: 0, marginBottom: GAP_BELOW * scale } : undefined}
    >
      {/* Desktop: `contents`, so the phones lay out exactly as direct children. */}
      <div
        className={scaled ? 'flex w-max shrink-0 origin-bottom items-end gap-8' : 'contents'}
        style={scaled ? { transform: `scale(${scale})` } : undefined}
      >
        <PhoneFrame label="דף האירוע של האורח" className="z-10 -rotate-6 translate-y-5 opacity-80">
          <LandingScreen />
        </PhoneFrame>
        <PhoneFrame center label="המצלמה עם מסגרת המגנט" className="z-30 -translate-y-3">
          <CameraScreen />
        </PhoneFrame>
        <PhoneFrame label="המגנט המוכן" className="z-10 rotate-6 translate-y-5 opacity-80">
          <MagnetScreen />
        </PhoneFrame>
      </div>
    </div>
  );
}
