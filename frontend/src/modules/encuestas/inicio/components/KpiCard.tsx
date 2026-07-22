import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiTrend {
  direction: "up" | "down"
  texto: string
  tono?: "positivo" | "alerta"
}

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconTone?: "default" | "alerta"
  trend?: KpiTrend
  footnote?: string
  progreso?: number
  className?: string
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconTone = "default",
  trend,
  footnote,
  progreso,
  className,
}: KpiCardProps) {
  const tonoTrend = trend?.tono ?? "positivo"
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp

  return (
    <Card className={cn("py-3 shadow-none", className)}>
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  tonoTrend === "alerta" ? "text-destructive" : "text-primary",
                )}
              >
                <TrendIcon className="size-3.5" />
                {trend.texto}
              </span>
            )}
          </div>
          {footnote && (
            <p className="text-xs text-muted-foreground">{footnote}</p>
          )}
          {progreso !== undefined && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
              />
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            iconTone === "alerta"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}
