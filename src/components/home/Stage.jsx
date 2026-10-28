import { useRef } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import { cn } from '@/lib/utils';
import { MAGNETS, THUMBNAILS, magnetSrc } from './samplePhotos';

/**
 * A decorative composition laid out once in design units (w × h px) and
 * scaled as one piece to the width it is given, so magnets and phones keep
 * their arrangement at every size. Hidden from screen readers.
 */
export function Stage({ w, h, className, children }) {
  const ref = useRef(null);
  const { width } = useElementSize(ref);
  const scale = width / w;

  return (
    <div ref={ref} aria-hidden="true" className={cn('relative w-full', className)} style={{ aspectRatio: `${w} / ${h}` }}>
      {scale > 0 && (
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${scale})` }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Something placed on a Stage, in design units. `rotate` uses the independent
 * rotate property, so entrance animations (translate / scale) compose with it.
 */
export function Placed({ x, y, w, rotate = 0, z, className, style, children }) {
  return (
    <div className={cn('absolute', className)} style={{ left: x, top: y, width: w, rotate: `${rotate}deg`, zIndex: z, ...style }}>
      {children}
    </div>
  );
}

/** A pre-rendered magnet (public/samples/magnets), decorative. Its box keeps the magnet's ratio while it loads. */
export function MagnetImage({ id, className, eager = false }) {
  const landscape = (MAGNETS[id] ?? THUMBNAILS[id])?.orientation === 'landscape';
  return (
    <img
      src={magnetSrc(id)}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('block w-full rounded-[2px] shadow-magnet', landscape ? 'aspect-[4/3]' : 'aspect-[3/4]', className)}
    />
  );
}
