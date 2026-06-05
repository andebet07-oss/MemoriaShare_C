import { Skeleton } from '@/components/ui/skeleton';

/**
 * Reusable loading skeletons — content-shaped placeholders that mirror the
 * real layout so pages feel instant instead of showing a bare spinner.
 */

/** 2×2 KPI cards (AdminOverview). */
export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-card border border-border">
          <Skeleton className="w-8 h-8 rounded-xl mb-3" />
          <Skeleton className="w-12 h-7 mb-2" />
          <Skeleton className="w-20 h-3" />
        </div>
      ))}
    </div>
  );
}

/** Stacked list rows (leads / events). */
export function RowsSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="w-2/3 h-5 mb-2" />
              <Skeleton className="w-1/2 h-3" />
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Responsive card grid (frames library). */
export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
          <Skeleton className="w-full rounded-none" style={{ aspectRatio: '776 / 1031' }} />
          <div className="p-3">
            <Skeleton className="w-2/3 h-4 mb-2" />
            <Skeleton className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
