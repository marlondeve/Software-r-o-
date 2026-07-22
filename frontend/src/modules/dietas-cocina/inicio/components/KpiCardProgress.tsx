import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { ProgressBar } from "./ProgressBar"

interface KpiCardProgressProps {
  label: string
  value: string | number
  subtitle?: string
  progress: number
  progressColor?: "primary" | "secondary" | "muted"
  accentBorder?: boolean
  className?: string
}

export function KpiCardProgress({
  label,
  value,
  subtitle,
  progress,
  progressColor = "primary",
  accentBorder = false,
  className,
}: KpiCardProgressProps) {
  return (
    <Card
      className={cn(
        "py-3 shadow-none",
        accentBorder && "border-b-[3px] border-b-primary",
        className,
      )}
    >
      <CardContent className="space-y-2 px-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <ProgressBar value={progress} color={progressColor} />
      </CardContent>
    </Card>
  )
}

interface KpiCardSimpleProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}

export function KpiCardSimple({
  label,
  value,
  icon: Icon,
  className,
}: KpiCardSimpleProps) {
  return (
    <Card className={cn("py-3 shadow-none", className)}>
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
