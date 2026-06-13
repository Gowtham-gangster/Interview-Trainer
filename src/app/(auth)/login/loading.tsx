import { Skeleton } from '@/components/ui/skeleton'

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <Skeleton className="skeleton-shimmer mx-auto h-8 w-48" />
          <Skeleton className="skeleton-shimmer mx-auto h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="skeleton-shimmer h-11 w-full" />
          <Skeleton className="skeleton-shimmer h-11 w-full" />
          <Skeleton className="skeleton-shimmer h-11 w-full" />
        </div>
      </div>
    </div>
  )
}
