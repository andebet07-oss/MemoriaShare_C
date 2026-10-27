import GuestShell from './GuestShell';

const BAR = 'rounded-full bg-guest-ink/[0.08] animate-pulse motion-reduce:animate-none';

/** The sheet while the guest's prints load: a data line and the CTA's shape. */
export function SheetSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col">
      <div className={`${BAR} mt-0.5 h-4 w-40`} />
      <div className="mt-auto pt-5">
        <div className="h-[54px] rounded-2xl bg-guest-raised animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}

/** The title block's shape (welcome line, names, date) while the event loads. */
function TitleSkeleton() {
  return (
    <div aria-hidden className="relative px-5">
      <div className="absolute inset-x-0 -top-24 bottom-0 bg-guest-fade-up" />
      <div className="relative mx-auto w-full max-w-md">
        <div className={`${BAR} h-3 w-36`} />
        <div className={`${BAR} mt-4 h-9 w-56`} />
        <div className={`${BAR} mt-4 h-3 w-24`} />
      </div>
    </div>
  );
}

/** Loading: the same layout as the landing, before anything is known. */
export default function GuestSkeleton() {
  return (
    <div role="status" aria-label="טוען את האירוע">
      <GuestShell cover={null} title={<TitleSkeleton />}>
        <SheetSkeleton />
      </GuestShell>
    </div>
  );
}
