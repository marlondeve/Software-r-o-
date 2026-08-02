import { ChartCardSkeleton } from "@/components/shared/skeletons/ChartCardSkeleton"
import { KpiGridSkeleton } from "@/components/shared/skeletons/KpiGridSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton"
import { cn } from "@/lib/utils"

interface DashboardPageSkeletonProps {
  kpiCount?: number
  className?: string
}

export function DashboardPageSkeleton({
  kpiCount = 6,
  className,
}: DashboardPageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton />
      <KpiGridSkeleton count={kpiCount} />
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCardSkeleton variant="donut" className="lg:col-span-3" />
        <ChartCardSkeleton variant="bar" className="lg:col-span-2" />
      </div>
      <TableSkeleton rows={5} columns={4} />
    </SkeletonBlock>
  )
}
