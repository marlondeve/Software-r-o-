import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface KpiGridSkeletonProps {
  count?: number
  className?: string
}

const GRID_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
}

export function KpiGridSkeleton({ count = 6, className }: KpiGridSkeletonProps) {
  const gridClass = GRID_CLASS[count] ?? GRID_CLASS[6]

  return (
    <div className={cn("grid gap-3", gridClass, className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
