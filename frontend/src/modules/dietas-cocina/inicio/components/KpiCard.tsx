import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  variant?: "default" | "alert" | "muted"
  className?: string
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "py-3 shadow-none",
        variant === "alert" && "border-l-[3px] border-l-destructive",
        variant === "muted" && "bg-muted/30",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              variant === "muted"
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            variant === "alert"
              ? "bg-destructive/10 text-destructive"
              : variant === "muted"
                ? "bg-muted/60 text-muted-foreground/70"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}
