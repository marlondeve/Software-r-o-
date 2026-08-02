import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({
  rows = 8,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60", className)}>
      <div className="flex gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === 0 ? "w-24" : "flex-1")}
          />
        ))}
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-3 px-4 py-3">
            {Array.from({ length: columns }, (_, col) => (
              <Skeleton
                key={col}
                className={cn("h-4", col === 0 ? "w-28" : "flex-1")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
