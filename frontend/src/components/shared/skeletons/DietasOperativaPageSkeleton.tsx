import { Skeleton } from "@/components/ui/skeleton"
import { FiltersBarSkeleton } from "@/components/shared/skeletons/FiltersBarSkeleton"
import { KpiGridSkeleton } from "@/components/shared/skeletons/KpiGridSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton"
import { cn } from "@/lib/utils"

interface DietasOperativaPageSkeletonProps {
  className?: string
}

export function DietasOperativaPageSkeleton({
  className,
}: DietasOperativaPageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-lg" />
      <KpiGridSkeleton count={4} />
      <FiltersBarSkeleton selectCount={3} />
      <TableSkeleton rows={10} columns={6} />
    </SkeletonBlock>
  )
}
