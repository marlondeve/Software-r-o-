import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { DonutChart } from "@/modules/dietas-cocina/inicio/components/DonutChart"
import { HallazgosPanel } from "@/modules/dietas-cocina/reportes/components/HallazgosPanel"
import { LogisticaTimeline } from "@/modules/dietas-cocina/reportes/components/LogisticaTimeline"
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/modules/dietas-cocina/reportes/components/ReportesCharts"
import { ReportesFiltros } from "@/modules/dietas-cocina/reportes/components/ReportesFiltros"
import { ReportesKpiGrid } from "@/modules/dietas-cocina/reportes/components/ReportesKpiGrid"
import { mockReportesNutricionista } from "@/modules/dietas-cocina/reportes/datos/mockReportesNutricionista"
import {
  type FiltrosReportes,
} from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"

const FILTROS_INICIALES: FiltrosReportes = {
  desde: "2023-10-01",
  hasta: "2023-10-24",
  servicio: "todos",
  horario: "todos",
}

export function ReportesNutricionistaView() {
  const base = mockReportesNutricionista
  const { ordenes, etiquetas } = useCicloBandejas()
  const [filtros, setFiltros] = useState<FiltrosReportes>(FILTROS_INICIALES)

  const data = useMemo(
    () => construirReportesNutricionistaDesdeCiclo(ordenes, etiquetas, filtros),
    [ordenes, etiquetas, filtros],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Reportes y analítica" />

      <ReportesFiltros
        {...base.filtros}
        filtros={filtros}
        onFiltrosChange={setFiltros}
      />

      <ReportesKpiGrid kpis={data.kpis} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <LogisticaTimeline hitos={data.hitos} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Estado de dietas
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <DonutChart
                  segments={data.estadoDietas.segmentos}
                  total={data.estadoDietas.totalNumerico}
                  totalDisplay={data.estadoDietas.total}
                  totalLabel="TOTAL"
                />
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Tipos de dieta principales
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <HorizontalBarChart items={data.tiposDieta} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Motivos de devolución (Top 3)
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <VerticalBarChart items={data.motivosDevolucion} />
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Distribución por servicios
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <VerticalBarChart items={data.distribucionServicio} />
              </CardContent>
            </Card>
          </div>
        </div>

        <HallazgosPanel hallazgos={data.hallazgos} />
      </div>
    </div>
  )
}
