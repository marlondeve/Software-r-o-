import { Card, CardContent } from "@/components/ui/card"
import type { KpiCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  claseKpiCocina,
  claseValorKpiCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import { cn } from "@/lib/utils"

interface CocinaKpiGridProps {
  kpis: KpiCocina[]
  kpiActivo?: string
  onKpiClick?: (kpiId: string) => void
}

export function CocinaKpiGrid({ kpis, kpiActivo, onKpiClick }: CocinaKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          role={onKpiClick ? "button" : undefined}
          tabIndex={onKpiClick ? 0 : undefined}
          onClick={onKpiClick ? () => onKpiClick(kpi.id) : undefined}
          onKeyDown={
            onKpiClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onKpiClick(kpi.id)
                  }
                }
              : undefined
          }
          className={cn(
            "py-0 shadow-none",
            claseKpiCocina(kpi),
            onKpiClick && "cursor-pointer transition-shadow hover:shadow-sm",
            kpiActivo === kpi.id && "ring-2 ring-primary ring-offset-2",
          )}
        >
          <CardContent className="px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                claseValorKpiCocina(kpi),
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
