import { Card, CardContent } from "@/components/ui/card"
import type { KpiDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  claseKpiDieta,
  claseValorKpi,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import { cn } from "@/lib/utils"

interface DietasKpiGridProps {
  kpis: KpiDieta[]
}

export function DietasKpiGrid({ kpis }: DietasKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          className={cn("py-0 shadow-none", claseKpiDieta(kpi))}
        >
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums",
                claseValorKpi(kpi),
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
