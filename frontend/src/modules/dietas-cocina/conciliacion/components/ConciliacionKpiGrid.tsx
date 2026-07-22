import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type KpiVariant = "default" | "warning" | "destructive"

interface ConciliacionKpi {
  label: string
  value: string
  variant?: KpiVariant
}

interface ConciliacionKpiGridProps {
  kpis: ConciliacionKpi[]
}

export function ConciliacionKpiGrid({ kpis }: ConciliacionKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            "py-0 shadow-none",
            kpi.variant === "warning" && "border-amber-500/40",
            kpi.variant === "destructive" &&
              "border-destructive/40 bg-destructive/5",
          )}
        >
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums",
                kpi.variant === "warning" && "text-amber-600",
                kpi.variant === "destructive" && "text-destructive",
                kpi.variant === "default" && "text-foreground",
              )}
            >
              {kpi.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
