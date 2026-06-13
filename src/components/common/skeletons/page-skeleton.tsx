import { Skeleton } from '@/components/ui/skeleton'

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="skeleton-shimmer h-8 w-48" />
        <Skeleton className="skeleton-shimmer h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="skeleton-shimmer h-10 w-36 rounded-md" />
    </div>
  )
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-xl border border-border/60 bg-card p-5"
        >
          <Skeleton className="skeleton-shimmer h-5 w-2/3" />
          <Skeleton className="skeleton-shimmer h-4 w-1/2" />
          <Skeleton className="skeleton-shimmer h-20 w-full rounded-lg" />
          <Skeleton className="skeleton-shimmer h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function GenericPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  )
}
