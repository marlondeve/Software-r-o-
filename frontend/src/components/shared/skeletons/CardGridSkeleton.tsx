import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface CardGridSkeletonProps {
  count?: number
  className?: string
}

export function CardGridSkeleton({ count = 4, className }: CardGridSkeletonProps) {
  return (
    <SkeletonBlock
      className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border/60 bg-card p-4"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </SkeletonBlock>
  )
}
