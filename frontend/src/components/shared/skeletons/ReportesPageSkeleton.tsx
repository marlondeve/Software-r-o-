import { ChartCardSkeleton } from "@/components/shared/skeletons/ChartCardSkeleton"
import { FiltersBarSkeleton } from "@/components/shared/skeletons/FiltersBarSkeleton"
import { KpiGridSkeleton } from "@/components/shared/skeletons/KpiGridSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface ReportesPageSkeletonProps {
  className?: string
}

export function ReportesPageSkeleton({ className }: ReportesPageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton showActions={false} />
      <FiltersBarSkeleton selectCount={4} />
      <KpiGridSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton variant="bar" />
        <ChartCardSkeleton variant="donut" />
      </div>
      <ChartCardSkeleton variant="bar" className="min-h-48" />
    </SkeletonBlock>
  )
}
