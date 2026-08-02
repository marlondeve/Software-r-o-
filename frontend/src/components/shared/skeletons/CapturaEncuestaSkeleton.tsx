import { Skeleton } from "@/components/ui/skeleton"
import { FormStackSkeleton } from "@/components/shared/skeletons/FormStackSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface CapturaEncuestaSkeletonProps {
  className?: string
}

export function CapturaEncuestaSkeleton({ className }: CapturaEncuestaSkeletonProps) {
  return (
    <SkeletonBlock className={cn("mx-auto max-w-2xl space-y-6 py-6", className)}>
      <PageHeaderSkeleton showActions={false} showSubtitle={false} />
      <div className="flex justify-center gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="size-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <FormStackSkeleton fields={4} />
    </SkeletonBlock>
  )
}
