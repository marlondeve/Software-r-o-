import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface FormStackSkeletonProps {
  fields?: number
  className?: string
}

export function FormStackSkeleton({ fields = 6, className }: FormStackSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      ))}
    </div>
  )
}
