import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { KpiExperiencia } from "@/modules/encuestas/indicadores/datos/mockIndicadoresExperiencia"

export function KpiExperienciaGrid({ kpis }: { kpis: KpiExperiencia[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const TrendIcon = kpi.trend?.direction === "down" ? TrendingDown : TrendingUp
        return (
          <Card key={kpi.label} className="py-0 shadow-none">
            <CardContent className="space-y-2 px-4 py-4">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-3xl font-semibold tabular-nums text-primary">
                  {kpi.valor}
                  {kpi.sufijo && (
                    <span className="ml-1 text-base font-medium text-foreground">
                      {kpi.sufijo}
                    </span>
                  )}
                </p>
                {kpi.trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      kpi.trend.direction === "down"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <TrendIcon className="size-3.5" />
                    {kpi.trend.texto}
                  </span>
                )}
                {kpi.nota && (
                  <span className="text-sm text-muted-foreground">{kpi.nota}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
