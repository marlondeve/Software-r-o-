import { FormStackSkeleton } from "@/components/shared/skeletons/FormStackSkeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface ParametrosPageSkeletonProps {
  className?: string
}

export function ParametrosPageSkeleton({ className }: ParametrosPageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton showActions={false} />
      <FormStackSkeleton fields={8} />
    </SkeletonBlock>
  )
}
