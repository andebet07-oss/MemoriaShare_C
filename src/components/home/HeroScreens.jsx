import { useRef } from 'react';
import { X, ZapOff, Film, RotateCw, RectangleVertical, Trash2 } from 'lucide-react';
import GuestShell from '@/components/magnet/guest/GuestShell';
import GuestTitle, { FlowLine } from '@/components/magnet/guest/GuestTitle';
import GuestSheet from '@/components/magnet/guest/GuestSheet';
import PolaroidViewfinder from '@/components/magnet/camera/PolaroidViewfinder';
import { Button } from '@/components/ui/button';
import { eventRenderSpec } from '@/lib/polaroid/renderPolaroid';
import { useSampleMagnet } from '@/hooks/useSampleMagnet';
import { SAMPLE_EVENT, PARTY_PHOTO, CROPS } from './homeSamples';

// The hero's screens: the real guest components, the real viewfinder and the
// template renderer, with the sample event. Pictures only (see PhoneFrame).

const noop = () => {};
const quota = SAMPLE_EVENT.print_quota_per_device;

/** 1. The guest landing after scanning the QR (first visit). */
export function LandingScreen() {
  return (
    <GuestShell cover={SAMPLE_EVENT.cover_image} title={<GuestTitle event={SAMPLE_EVENT}><FlowLine /></GuestTitle>}>
      <GuestSheet jobs={[]} quota={quota} remaining={quota} online loadError={false}
        onRetry={noop} onCapture={noop} onStatus={noop} />
    </GuestShell>
  );
}

// Same chrome as MagnetCamera (portrait screen).
const round = 'w-12 h-12 rounded-full flex items-center justify-center border-[1.5px] backdrop-blur-lg shadow-lg bg-foreground/10 border-foreground/15';

/** 2. The camera: the live feed (here a still) inside the event's template frame. */
export function CameraScreen() {
  const videoRef = useRef(null);
  return (
    <div className="fixed inset-0 overflow-hidden bg-background bg-glow" dir="rtl">
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 pb-3 pt-12">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground/10">
          <X className="h-4 w-4 text-foreground" />
        </span>
        <span className="flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/10 px-3.5">
          <span className="text-base font-semibold leading-none tabular-nums text-foreground">{quota}</span>
          <span className="text-xs font-medium leading-none text-foreground/60">נותרו</span>
        </span>
      </div>

      <PolaroidViewfinder spec={eventRenderSpec(SAMPLE_EVENT)} orientation="portrait"
        inset={{ top: 72, bottom: 140, right: 20, left: 20 }} videoRef={videoRef} still={PARTY_PHOTO} />

      <div className="absolute inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-6 pb-[34px]">
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

/** 3. The finished magnet on the review screen, from the template renderer. */
export function MagnetScreen() {
  const { url } = useSampleMagnet({
    ...eventRenderSpec(SAMPLE_EVENT), orientation: 'portrait', photo: PARTY_PHOTO, crop: CROPS.party.portrait, scale: 1.5,
  });
  return (
    <div className="fixed inset-0 overflow-hidden bg-background bg-glow" dir="rtl">
      <div className="absolute inset-x-0 top-0 bottom-24 flex items-center justify-center px-5 pt-14">
        {url && <img src={url} alt="" draggable={false} className="block h-auto max-h-full w-auto max-w-full shadow-2xl" />}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background from-60% to-transparent px-5 pb-5 pt-[18px]">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/15 bg-foreground/10">
            <Trash2 className="h-5 w-5 text-foreground/70" />
          </span>
          <Button size="lg" className="flex-1" tabIndex={-1}>שלח להדפסה</Button>
        </div>
      </div>
    </div>
  );
}
