import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBlock } from "@/components/shared/skeletons/SkeletonBlock"

interface SectionPageSkeletonProps {
  title?: string
}

export function SectionPageSkeleton({ title }: SectionPageSkeletonProps) {
  return (
    <SkeletonBlock aria-label="Cargando sección">
      <section>
        {title ? (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        ) : (
          <Skeleton className="h-6 w-40" />
        )}
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      </section>
    </SkeletonBlock>
  )
}
