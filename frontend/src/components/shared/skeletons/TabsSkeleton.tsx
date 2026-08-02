import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TabsSkeletonProps {
  tabCount?: number
  className?: string
}

export function TabsSkeleton({ tabCount = 2, className }: TabsSkeletonProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex gap-2">
        {Array.from({ length: tabCount }, (_, i) => (
          <Skeleton key={i} className="h-11 w-40 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
