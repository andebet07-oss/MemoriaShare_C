import { useEffect, useRef, useState } from 'react';
import { BatteryFull, Wifi, Signal, Camera, Loader2 } from 'lucide-react';
import { useElementSize } from '@/hooks/useElementSize';

/**
 * Phone size, resolved against the nearest size container (the preview area):
 * as tall as the area allows minus breathing room (5% of the area, 16–40px in
 * total, so small screens keep the phone big and large ones get more air),
 * never wider than the area, capped so it never looks oversized.
 * The 9:19.5 aspect ratio gives the width.
 */
const PHONE_SIZE = {
  height: 'min(calc(100cqh - clamp(1rem, 5cqh, 2.5rem)), 480px, calc((100cqw - 2rem) * 19.5 / 9))',
  aspectRatio: '9 / 19.5',
};

// Inner dimensions are `cqw` of the phone itself (it is an inline-size
// container), so the mockup stays proportional at every size. Values match the
// previous desktop rendering at a 225px-wide phone.
const ICON = { signal: { width: '3.6cqw', height: '3.6cqw' }, battery: { width: '4.4cqw', height: '4.4cqw' } };

const DEFAULT_TRANSFORM = { x: 0, y: 0, zoom: 1 };

/**
 * MagnetLead preview phone. `imageTransform` is size-independent so the cover
 * looks identical whatever size the phone renders at:
 *   x, y  offset of the image centre, as a fraction of the screen width / height
 *   zoom  scale relative to "cover" (1 = image just covers the screen)
 */
export default function LeadPhoneMockup({ coverImage, eventName, date, imageTransform, isDesignMode = false, isUploading = false, onImageTransformChange }) {
  const formattedDate = date
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(date + 'T00:00:00'))
    : '25.02.2026';

  const [imageError, setImageError] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const screenRef = useRef(null);
  const screen = useElementSize(screenRef);
  const touchState = useRef({ isDragging: false, lastX: 0, lastY: 0, lastPinchDist: null });

  // No transform reset here: the mockup unmounts on the date step, and a reset
  // on remount would throw away the user's framing. The parent resets it when a
  // new cover is chosen (the default transform is "centred, covering").
  useEffect(() => {
    setImageError(false);
    setImgNaturalSize({ w: 0, h: 0 });
  }, [coverImage]);

  const displayImage = coverImage || '/mockup.jpg';
  const transform = imageTransform || DEFAULT_TRANSFORM;
  const ready = imgNaturalSize.w > 0 && screen.width > 0;
  // Image px → screen px scale at which the image just covers / just fits the screen.
  const coverScale = ready ? Math.max(screen.width / imgNaturalSize.w, screen.height / imgNaturalSize.h) : 1;
  const containScale = ready ? Math.min(screen.width / imgNaturalSize.w, screen.height / imgNaturalSize.h) : 1;

  const getPinchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (!isDesignMode) return;
    e.preventDefault();
    if (e.touches.length === 1) {
      touchState.current.isDragging = true;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
      touchState.current.lastPinchDist = null;
    } else if (e.touches.length === 2) {
      touchState.current.isDragging = false;
      touchState.current.lastPinchDist = getPinchDist(e.touches);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDesignMode || !onImageTransformChange || !ready) return;
    e.preventDefault();
    if (e.touches.length === 1 && touchState.current.isDragging) {
      const dx = e.touches[0].clientX - touchState.current.lastX;
      const dy = e.touches[0].clientY - touchState.current.lastY;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
      onImageTransformChange((prev) => ({ ...prev, x: prev.x + dx / screen.width, y: prev.y + dy / screen.height }));
    } else if (e.touches.length === 2 && touchState.current.lastPinchDist !== null) {
      const newDist = getPinchDist(e.touches);
      const ratio = newDist / touchState.current.lastPinchDist;
      touchState.current.lastPinchDist = newDist;
      // Same limits as before, expressed relative to cover: down to "contain", up to 4× natural size.
      const minZoom = containScale / coverScale;
      const maxZoom = 4 / coverScale;
      onImageTransformChange((prev) => ({ ...prev, zoom: Math.min(maxZoom, Math.max(minZoom, prev.zoom * ratio)) }));
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isDragging = false;
    touchState.current.lastPinchDist = null;
  };

  // The outer element only sizes the phone and is the inline-size container;
  // the frame is drawn on the inner element so its own radius / bezel resolve
  // in the phone's cqw too (a container's own styles use its ancestor's units).
  return (
    <div className="relative shrink-0 mx-auto [container-type:inline-size]" style={PHONE_SIZE}>
      <div className="relative w-full h-full bg-cool-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-foreground/10 rounded-[14cqw] p-[3.2cqw]">
        {isDesignMode && (
          <div className="absolute inset-0 ring-2 ring-primary z-[70] pointer-events-none animate-pulse rounded-[14cqw]" />
        )}

        {/* Dynamic Island */}
        <div className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full z-[60] flex items-center justify-end shadow-inner top-[6cqw] w-[33.8cqw] h-[8.8cqw] pr-[4cqw]">
          <div className="rounded-full bg-cool-900 border border-foreground/5 shadow-sm w-[2.7cqw] h-[2.7cqw]" />
        </div>

        {/* Inner Screen */}
        <div
          ref={screenRef}
          className="relative w-full h-full bg-black overflow-hidden flex flex-col border border-black shadow-inner rounded-[12cqw]"
          style={{ touchAction: isDesignMode ? 'none' : 'auto' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none opacity-90 h-[18cqw] px-[7.2cqw]">
            <span className="font-bold text-white tracking-tight text-[length:4.8cqw]">9:41</span>
            <div className="flex items-center gap-[1.8cqw]">
              <Signal fill="white" className="text-white" style={ICON.signal} />
              <Wifi className="text-white" style={ICON.signal} />
              <BatteryFull fill="white" className="text-white" style={ICON.battery} />
            </div>
          </div>

          {/* Background Image — with graceful fallback when /mockup.jpg is missing */}
          {imageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-cool-900 to-cool-950 z-0" />
          ) : (
            <img
              src={displayImage}
              onError={() => setImageError(true)}
              onLoad={(e) => setImgNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              alt="Event Cover"
              className="absolute z-0 transition-opacity duration-300"
              style={ready ? {
                top: '50%', left: '50%',
                width: `${imgNaturalSize.w}px`,
                height: `${imgNaturalSize.h}px`,
                maxWidth: 'none', maxHeight: 'none',
                transform: `translate(calc(-50% + ${transform.x * screen.width}px), calc(-50% + ${transform.y * screen.height}px)) scale(${transform.zoom * coverScale})`,
                willChange: 'transform', userSelect: 'none', pointerEvents: 'none',
              } : {
                top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                userSelect: 'none', pointerEvents: 'none',
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />

          {/* Content */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center text-center pointer-events-none transition-opacity duration-300 p-[5.2cqw] pb-[7.2cqw] ${isDesignMode ? 'opacity-20' : 'opacity-100'}`}
            dir="rtl"
          >
            <h1 className="text-white font-bold leading-tight mb-[0.9cqw] drop-shadow-2xl text-[length:8cqw]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {eventName || 'Sarah & Daniel'}
            </h1>
            <p className="text-white/70 font-medium tracking-[0.1em] drop-shadow-md text-[length:4.8cqw] mb-[6cqw]">
              <bdi>{formattedDate}</bdi>
            </p>

            {/* CTA — only meaningful deviation from Share mockup */}
            <button className="w-[90%] bg-white text-black font-bold flex items-center justify-center shadow-[0_8px_20px_rgba(255,255,255,0.2)] pointer-events-none rounded-[4.3cqw] gap-[2.7cqw] py-[4cqw] text-[length:5.6cqw]">
              <Camera className="w-[5.2cqw] h-[5.2cqw]" />
              צלמו ושלחו להדפסה
            </button>
          </div>

          {isDesignMode && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <p className="text-white/80 bg-black/60 rounded-full font-bold tracking-widest text-center text-[length:4cqw] px-[5.3cqw] py-[1.8cqw]">גרור • צבוט לזום</p>
            </div>
          )}

          {/* Home indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 w-[35%] bg-white/40 rounded-full z-30 pointer-events-none h-[1.8cqw] bottom-[2cqw]" />
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-[80] rounded-[14cqw]">
            <Loader2 className="text-white animate-spin w-[14.2cqw] h-[14.2cqw] mb-[3.6cqw]" />
            <p className="text-white font-bold tracking-widest text-[length:4.4cqw]">מעלה...</p>
          </div>
        )}
      </div>
    </div>
  );
}
