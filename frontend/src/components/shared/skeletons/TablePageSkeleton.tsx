import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { FiltersBarSkeleton } from "@/components/shared/skeletons/FiltersBarSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton"
import { cn } from "@/lib/utils"

interface TablePageSkeletonProps {
  filterCount?: number
  rows?: number
  columns?: number
  className?: string
}

export function TablePageSkeleton({
  filterCount = 4,
  rows = 8,
  columns = 5,
  className,
}: TablePageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton />
      <FiltersBarSkeleton selectCount={filterCount} />
      <TableSkeleton rows={rows} columns={columns} />
    </SkeletonBlock>
  )
}
