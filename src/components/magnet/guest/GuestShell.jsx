import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The one-screen guest layout: the event photo edge to edge on top (~60%),
 * then the solid sheet with the data and actions. The root is fixed to the
 * visible viewport, so nothing ever scrolls vertically.
 *
 * `title` sits over the bottom of the photo (it brings its own fade into the
 * sheet). `cover` null → a plain raised surface.
 */
/** "MEMORIA", centred under the safe area (Latin, so it may be tracked). */
export function Wordmark() {
  return (
    <p
      dir="ltr"
      className="relative pl-[0.32em] pt-[calc(env(safe-area-inset-top,0px)+16px)] text-center text-[11px] font-medium leading-4 tracking-[0.32em] text-guest-ink"
    >
      MEMORIA
    </p>
  );
}

export default function GuestShell({ cover, title, children }) {
  const [shown, setShown] = useState(false);

  return (
    <div dir="rtl" className="fixed inset-0 flex flex-col overflow-hidden bg-guest-bg font-heebo text-guest-ink">
      {/* Photo: 60% basis; it absorbs the sheet's slack up to 70% and is the
          first thing to shrink (never below the wordmark + title). */}
      <header className="relative flex max-h-[70%] shrink grow-[1000] basis-[60%] flex-col overflow-hidden bg-guest-raised">
        {cover && (
          <img
            src={cover}
            alt=""
            onLoad={() => setShown(true)}
            className={cn(
              'absolute inset-0 size-full object-cover object-[center_25%] transition-opacity duration-300 ease-out motion-reduce:transition-none',
              shown ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[calc(env(safe-area-inset-top,0px)+7.5rem)] bg-guest-fade-down" />
        <Wordmark />
        <div className="min-h-4 flex-1" />
        {title}
      </header>

      <main className="flex flex-1 shrink-0 flex-col px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
