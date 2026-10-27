import { useRef } from 'react';
import { ZapOff, Film, RotateCw, RectangleVertical } from 'lucide-react';
import { Wordmark } from '@/components/magnet/guest/GuestShell';
import GuestTitle, { FlowLine } from '@/components/magnet/guest/GuestTitle';
import GuestSheet from '@/components/magnet/guest/GuestSheet';
import GuestNotice from '@/components/magnet/guest/GuestNotice';
import PolaroidViewfinder from '@/components/magnet/camera/PolaroidViewfinder';
import { eventRenderSpec } from '@/lib/polaroid/renderPolaroid';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import { MAGNET_EVENT, CAMERA_EVENT, LANDING_EVENT } from './homeSamples';

// The hero's screens, laid out on a 375px-wide phone (see PhoneFrame). Frames
// come from the template renderer, so they match the print; each photo shows
// once, inside its frame (or, on the landing, as the cover). Pictures only.

const noop = () => {};

/** Right: the guest landing after scanning the QR, the event cover edge to edge. */
export function LandingScreen() {
  const quota = LANDING_EVENT.print_quota_per_device;
  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-guest-bg font-heebo text-guest-ink">
      <img src={LANDING_EVENT.cover_image} alt="" draggable={false} className="absolute inset-0 size-full object-cover object-[55%_20%]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[7.5rem] bg-guest-fade-down" />
      <Wordmark />
      <div className="absolute inset-x-0 bottom-0">
        <GuestTitle event={LANDING_EVENT}><FlowLine /></GuestTitle>
        <div className="bg-guest-bg px-5 pb-6 pt-5">
          <GuestSheet jobs={[]} quota={quota} remaining={quota} online loadError={false}
            onRetry={noop} onCapture={noop} onStatus={noop} />
        </div>
      </div>
    </div>
  );
}

// The real camera's round controls.
const round = 'w-12 h-12 rounded-full flex items-center justify-center border-[1.5px] bg-foreground/10 border-foreground/15';
const FRAME_TOP = 40;  // status-bar gap above the frame
const FRAME_H = 500;   // a portrait magnet 375px wide (3 × 4)

/**
 * Centre: the camera as the real viewfinder draws it (PolaroidViewfinder +
 * renderOverlay): the frame edge to edge, the photo only through the window,
 * the shutter bar under the frame.
 */
export function CameraScreen() {
  const videoRef = useRef(null);
  return (
    <div dir="rtl" className="fixed inset-0 overflow-hidden bg-cool-950">
      <PolaroidViewfinder spec={eventRenderSpec(CAMERA_EVENT)} orientation="portrait" videoRef={videoRef}
        inset={{ top: FRAME_TOP, right: 0, left: 0, bottom: `calc(100% - ${FRAME_TOP + FRAME_H}px)` }}
        still={CAMERA_EVENT.photo} />
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center px-6" style={{ top: FRAME_TOP + FRAME_H }}>
        <div className="flex items-center justify-center gap-3">
          <span className={round}><ZapOff className="h-5 w-5 text-foreground/70" /></span>
          <span className={round}><Film className="h-5 w-5 text-foreground/70" /></span>
        </div>
        <span className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3.5px] border-foreground/70" />
          <span className="h-[61px] w-[61px] rounded-full bg-primary shadow-indigo-glow" />
        </span>
        <div className="flex items-center justify-center gap-3">
          <span className={round}><RotateCw className="h-5 w-5 text-foreground/70" /></span>
          <span className={round}><RectangleVertical className="h-5 w-5 text-foreground/70" /></span>
        </div>
      </div>
    </div>
  );
}

/** Left: the finished magnet (renderComposite), ready for pickup. */
export function MagnetScreen() {
  const { url } = useSampleMagnet({
    ...eventRenderSpec(MAGNET_EVENT), orientation: 'portrait', photo: MAGNET_EVENT.photo, scale: 1.5,
  });
  return (
    <div dir="rtl" className="fixed inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden bg-guest-bg px-5 font-heebo text-guest-ink">
      <div className="aspect-[3/4] w-full">
        {url && <img src={url} alt="" draggable={false} className="block size-full shadow-2xl" />}
      </div>
      <div className="w-full px-1">
        <GuestNotice kind="ready" />
      </div>
    </div>
  );
}
