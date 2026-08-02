import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"

export function AuthLayoutSkeleton() {
  return (
    <SkeletonBlock
      aria-label="Cargando sesión"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-4 w-36" />
      </div>
    </SkeletonBlock>
  )
}
