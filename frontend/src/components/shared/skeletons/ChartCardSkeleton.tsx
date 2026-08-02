import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChartCardSkeletonProps {
  variant?: "donut" | "bar"
  className?: string
}

export function ChartCardSkeleton({
  variant = "donut",
  className,
}: ChartCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <Skeleton className="h-5 w-48" />
      <div className="flex flex-1 items-center justify-center py-6">
        {variant === "donut" ? (
          <Skeleton className="size-40 rounded-full" />
        ) : (
          <div className="flex h-40 w-full items-end justify-around gap-2 px-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={i}
                className="w-8"
                style={{ height: `${40 + (i % 3) * 20}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
