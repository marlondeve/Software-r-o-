import { Card, CardContent } from "@/components/ui/card"
import {
  detalleKpiVariantEstilos,
  type DetalleKpiVariant,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { cn } from "@/lib/utils"

interface ReporteKpi {
  label: string
  value: string
  detalle?: string
  detalleVariant?: DetalleKpiVariant
}

interface ReportesKpiGridProps {
  kpis: ReporteKpi[]
}

export function ReportesKpiGrid({ kpis }: ReportesKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="py-0 shadow-none">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums",
                kpi.detalleVariant === "negative"
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {kpi.value}
            </p>
            {kpi.detalle && (
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  detalleKpiVariantEstilos[kpi.detalleVariant ?? "neutral"],
                )}
              >
                {kpi.detalle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
