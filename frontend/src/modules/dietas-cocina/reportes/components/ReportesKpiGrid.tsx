import { Card, CardContent } from "@/components/ui/card"
import {
  detalleKpiVariantEstilos,
  type DetalleKpiVariant,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import type {
  ReporteKpi,
  ReporteKpiSeccion,
} from "@/modules/dietas-cocina/reportes/lib/reportesKpiSecciones"
import { cn } from "@/lib/utils"

interface ReporteKpiCardProps {
  kpi: ReporteKpi
}

function ReporteKpiCard({ kpi }: ReporteKpiCardProps) {
  return (
    <Card
      className={cn(
        "py-0 shadow-none",
        kpi.destacado && "border-emerald-600/40 bg-emerald-50/50 dark:bg-emerald-950/20",
        kpi.informativo && "border-dashed opacity-90",
      )}
    >
      <CardContent className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{kpi.label}</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold tabular-nums",
            kpi.detalleVariant === "negative"
              ? "text-destructive"
              : kpi.destacado
                ? "text-emerald-900 dark:text-emerald-100"
                : "text-foreground",
          )}
        >
          {kpi.value}
        </p>
        {kpi.detalle && (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium leading-snug",
              detalleKpiVariantEstilos[kpi.detalleVariant ?? "neutral"],
            )}
          >
            {kpi.detalle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface ReportesKpiGridProps {
  kpis: Array<{
    label: string
    value: string
    detalle?: string
    detalleVariant?: DetalleKpiVariant
    clave?: string
    destacado?: boolean
    informativo?: boolean
  }>
  secciones?: ReporteKpiSeccion[]
}

export function ReportesKpiGrid({ kpis, secciones }: ReportesKpiGridProps) {
  if (secciones && secciones.length > 0) {
    return (
      <div className="space-y-5">
        {secciones.map((seccion) => (
          <section key={seccion.id} className="space-y-2">
            <div>
              <h2
                className={cn(
                  "text-sm font-semibold tracking-tight",
                  seccion.destacado
                    ? "text-emerald-900 dark:text-emerald-100"
                    : "text-foreground",
                )}
              >
                {seccion.titulo}
              </h2>
              {seccion.descripcion ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{seccion.descripcion}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {seccion.kpis.map((kpi) => (
                <ReporteKpiCard key={kpi.clave ?? kpi.label} kpi={kpi} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <ReporteKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}
