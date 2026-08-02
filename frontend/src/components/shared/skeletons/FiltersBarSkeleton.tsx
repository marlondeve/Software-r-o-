import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface FiltersBarSkeletonProps {
  selectCount?: number
  className?: string
}

export function FiltersBarSkeleton({
  selectCount = 3,
  className,
}: FiltersBarSkeletonProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Skeleton className="h-9 w-full min-w-[200px] flex-1 sm:max-w-xs" />
      {Array.from({ length: selectCount }, (_, i) => (
        <Skeleton key={i} className="h-9 w-32" />
      ))}
    </div>
  )
}
