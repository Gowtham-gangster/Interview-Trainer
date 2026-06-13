import { Skeleton } from '@/components/ui/skeleton'

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Skeleton className="skeleton-shimmer h-6 w-40" />
        <Skeleton className="skeleton-shimmer h-8 w-8 rounded-md" />
      </div>

      <div className="flex-1 space-y-6 p-4">
        <div className="flex justify-start gap-3">
          <Skeleton className="skeleton-shimmer h-8 w-8 rounded-full" />
          <Skeleton className="skeleton-shimmer h-20 w-[70%] rounded-2xl rounded-bl-sm" />
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton className="skeleton-shimmer h-16 w-[55%] rounded-2xl rounded-br-sm" />
          <Skeleton className="skeleton-shimmer h-8 w-8 rounded-full" />
        </div>
        <div className="flex justify-start gap-3">
          <Skeleton className="skeleton-shimmer h-8 w-8 rounded-full" />
          <Skeleton className="skeleton-shimmer h-28 w-[75%] rounded-2xl rounded-bl-sm" />
        </div>
      </div>

      <div className="border-t p-4">
        <Skeleton className="skeleton-shimmer h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}
