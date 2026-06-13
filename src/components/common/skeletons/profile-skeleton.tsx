import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="skeleton-shimmer h-8 w-32" />
        <Skeleton className="skeleton-shimmer h-4 w-64" />
      </div>
      <div className="overflow-hidden rounded-2xl border">
        <Skeleton className="skeleton-shimmer h-32 w-full rounded-none" />
        <div className="space-y-4 p-6">
          <Skeleton className="skeleton-shimmer -mt-14 h-28 w-28 rounded-full" />
          <Skeleton className="skeleton-shimmer h-7 w-48" />
          <Skeleton className="skeleton-shimmer h-4 w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="skeleton-shimmer h-20 rounded-xl" />
            <Skeleton className="skeleton-shimmer h-20 rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-shimmer h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
