import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface FlowCardSkeletonProps {
  className?: string
}

export function FlowCardSkeleton({ className }: FlowCardSkeletonProps) {
  return (
    <SkeletonBlock
      aria-label="Cargando"
      className={cn("flex flex-col items-center gap-4 py-12", className)}
    >
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-2 h-10 w-32 rounded-md" />
    </SkeletonBlock>
  )
}
