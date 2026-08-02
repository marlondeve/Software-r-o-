import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/PageHeaderSkeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"
import { cn } from "@/lib/utils"

interface EditorPageSkeletonProps {
  className?: string
}

export function EditorPageSkeleton({ className }: EditorPageSkeletonProps) {
  return (
    <SkeletonBlock className={cn("space-y-5", className)}>
      <PageHeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <div className="space-y-3 lg:col-span-5">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-3 lg:col-span-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonBlock>
  )
}
