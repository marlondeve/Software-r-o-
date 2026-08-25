import type { KpiEtiqueta } from "@/modules/dietas-cocina/types/labels"
import { Card, CardContent } from "@/components/ui/card"
import {
  claseKpiEtiqueta,
  claseValorKpiEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEstilos"
import { cn } from "@/lib/utils"

interface EtiquetasKpiGridProps {
  kpis: KpiEtiqueta[]
  kpiActivo?: string
  onKpiClick?: (kpiId: string) => void
}

export function EtiquetasKpiGrid({
  kpis,
  kpiActivo,
  onKpiClick,
}: EtiquetasKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => {
        const clickable = Boolean(onKpiClick)
        return (
        <Card
          key={kpi.id}
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={clickable ? () => onKpiClick?.(kpi.id) : undefined}
          onKeyDown={
            clickable
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onKpiClick?.(kpi.id)
                  }
                }
              : undefined
          }
          className={cn(
            "py-0 shadow-none",
            claseKpiEtiqueta(kpi),
            clickable && "cursor-pointer transition-shadow hover:shadow-sm",
            kpiActivo === kpi.id && "ring-2 ring-primary ring-offset-2",
          )}
        >
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                claseValorKpiEtiqueta(kpi),
              )}
            >
              {kpi.value}
            </p>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
