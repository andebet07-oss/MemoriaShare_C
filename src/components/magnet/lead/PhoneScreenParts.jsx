import { BatteryFull, Wifi, Signal, ImageIcon } from 'lucide-react';

// Sizes are `cqw` of the phone (LeadPhoneMockup's inline-size container).
const ICON = { signal: { width: '3.6cqw', height: '3.6cqw' }, battery: { width: '4.4cqw', height: '4.4cqw' } };

export function PhoneStatusBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none opacity-90 h-[18cqw] px-[7.2cqw]">
      <span className="font-bold text-white tracking-tight text-[length:4.8cqw]">9:41</span>
      <div className="flex items-center gap-[1.8cqw]">
        <Signal fill="white" className="text-white" style={ICON.signal} />
        <Wifi className="text-white" style={ICON.signal} />
        <BatteryFull fill="white" className="text-white" style={ICON.battery} />
      </div>
    </div>
  );
}

/** Placeholder for the cover photo, centred in the screen area above the event details. */
export function EmptyCoverHint() {
  return (
    <div className="absolute inset-x-0 top-0 bottom-[26%] z-20 flex flex-col items-center justify-center gap-[3cqw] pointer-events-none" dir="rtl">
      <div className="rounded-full bg-white/[0.04] ring-1 ring-white/10 p-[4cqw]">
        <ImageIcon className="w-[9cqw] h-[9cqw] text-white/30" strokeWidth={1.5} />
      </div>
      <p className="text-white/40 font-medium text-[length:4.4cqw]">התמונה שלכם תופיע כאן</p>
    </div>
  );
}
