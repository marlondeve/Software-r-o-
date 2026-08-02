import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PageHeaderSkeletonProps {
  showActions?: boolean
  showSubtitle?: boolean
  className?: string
}

export function PageHeaderSkeleton({
  showActions = true,
  showSubtitle = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-7 w-48 max-w-full" />
        {showSubtitle && <Skeleton className="h-4 w-72 max-w-full" />}
      </div>
      {showActions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      )}
    </div>
  )
}
