import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DetalleVariant = "positive" | "negative" | "neutral"

interface ReporteKpi {
  label: string
  value: string
  detalle?: string
  detalleVariant?: DetalleVariant
}

interface ReportesKpiGridProps {
  kpis: ReporteKpi[]
}

const detalleStyles: Record<DetalleVariant, string> = {
  positive: "text-emerald-600",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
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
                  detalleStyles[kpi.detalleVariant ?? "neutral"],
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
