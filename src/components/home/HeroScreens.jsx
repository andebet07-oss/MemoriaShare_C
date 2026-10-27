import { X, ZapOff, Film, RotateCw, RectangleVertical } from 'lucide-react';
import { Wordmark } from '@/components/magnet/guest/GuestShell';
import GuestTitle, { FlowLine } from '@/components/magnet/guest/GuestTitle';
import GuestSheet from '@/components/magnet/guest/GuestSheet';
import GuestNotice from '@/components/magnet/guest/GuestNotice';
import { eventRenderSpec } from '@/lib/polaroid/renderPolaroid';
import { usePolaroidOverlay } from '@/hooks/usePolaroidOverlay';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import { SAMPLE_EVENT, HERO_PHOTOS } from './homeSamples';

// The hero's screens, laid out on a 375px-wide phone (see PhoneFrame). Each
// phone shows its photo edge to edge, with the real Magnet UI on top: the
// guest components, the template frame (renderOverlay) and a finished magnet
// (renderComposite). Pictures only.

const noop = () => {};
const quota = SAMPLE_EVENT.print_quota_per_device;
const spec = eventRenderSpec(SAMPLE_EVENT);

function Photo({ src, className = '' }) {
  return <img src={src} alt="" draggable={false} className={`absolute inset-0 size-full object-cover ${className}`} />;
}

/** Right: the guest landing after scanning the QR, over the event cover. */
export function LandingScreen() {
  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-guest-bg font-heebo text-guest-ink">
      <Photo src={HERO_PHOTOS.right} className="object-[center_25%]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[7.5rem] bg-guest-fade-down" />
      <Wordmark />
      <div className="absolute inset-x-0 bottom-0">
        <GuestTitle event={SAMPLE_EVENT}><FlowLine /></GuestTitle>
        <div className="bg-guest-bg px-5 pb-6 pt-5">
          <GuestSheet jobs={[]} quota={quota} remaining={quota} online loadError={false}
            onRetry={noop} onCapture={noop} onStatus={noop} />
        </div>
      </div>
    </div>
  );
}

// Same chrome as MagnetCamera (portrait screen).
const round = 'w-12 h-12 rounded-full flex items-center justify-center border-[1.5px] backdrop-blur-lg bg-foreground/10 border-foreground/15';
const FRAME_WIDTH = 335; // the viewfinder's width on a 375px phone (20px each side)

/** Center: the camera, the event's template frame over what the guest is shooting. */
export function CameraScreen() {
  const overlay = usePolaroidOverlay(spec, 'portrait', FRAME_WIDTH);
  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-background">
      <Photo src={HERO_PHOTOS.center} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/60 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background/70 to-transparent" />

      <div className="absolute inset-x-5 bottom-[140px] top-[72px] flex items-center justify-center">
        {overlay && <img src={overlay.url} alt="" draggable={false} className="h-auto w-full drop-shadow-xl" />}
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pb-3 pt-12">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground/10 backdrop-blur-md">
          <X className="h-4 w-4 text-foreground" />
        </span>
        <span className="flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/10 px-3.5 backdrop-blur-md">
          <span className="text-base font-semibold leading-none tabular-nums text-foreground">{quota}</span>
          <span className="text-xs font-medium leading-none text-foreground/70">נותרו</span>
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center px-6 pb-[34px]">
        <div className="flex items-center justify-center gap-3">
          <span className={round}><ZapOff className="h-5 w-5 text-foreground/80" /></span>
          <span className={round}><Film className="h-5 w-5 text-foreground/80" /></span>
        </div>
        <span className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3.5px] border-foreground/80" />
          <span className="h-[61px] w-[61px] rounded-full bg-primary shadow-indigo-glow" />
        </span>
        <div className="flex items-center justify-center gap-3">
          <span className={round}><RotateCw className="h-5 w-5 text-foreground/80" /></span>
          <span className={round}><RectangleVertical className="h-5 w-5 text-foreground/80" /></span>
        </div>
      </div>
    </div>
  );
}

/** Left: the finished magnet of that photo, ready for pickup. */
export function MagnetScreen() {
  const { url } = useSampleMagnet({ ...spec, orientation: 'portrait', photo: HERO_PHOTOS.left, scale: 1.5 });
  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-guest-bg font-heebo text-guest-ink">
      <Photo src={HERO_PHOTOS.left} />
      <div aria-hidden className="absolute inset-0 bg-guest-bg/55" />
      <div className="absolute inset-x-0 bottom-40 top-0 flex items-center justify-center px-10 pt-14">
        {url && <img src={url} alt="" draggable={false} className="block h-auto max-h-full w-auto max-w-full -rotate-3 shadow-2xl" />}
      </div>
      <div className="absolute inset-x-5 bottom-8 rounded-2xl border border-guest-line bg-guest-bg/90 p-4 backdrop-blur-md">
        <GuestNotice kind="ready" />
      </div>
    </div>
  );
}
