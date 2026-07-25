import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { formatearUltimaActualizacionReporte } from "@/modules/dietas-cocina/lib/formatearFechaOperativa"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"
import { crearFiltrosReportesIniciales } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesProveedorDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"

export function ReportesProveedorView() {
  const base = mockReportesProveedor
  const { ordenes, etiquetas } = useCicloBandejas()
  const [filtros, setFiltros] = useState(crearFiltrosReportesIniciales)

  const data = useMemo(
    () => construirReportesProveedorDesdeCiclo(ordenes, etiquetas, filtros),
    [ordenes, etiquetas, filtros],
  )

  const subtituloActualizacion = useMemo(
    () => formatearUltimaActualizacionReporte(new Date()),
    [ordenes, etiquetas, filtros],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Reportes de producción"
        subtitle="Analítica operativa de planta y despacho."
      />

      <ReportesFiltros
        {...base.filtros}
        filtros={filtros}
        ultimaActualizacion={subtituloActualizacion}
        onFiltrosChange={setFiltros}
      />

      <ReportesKpiGrid kpis={data.kpis} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <LogisticaTimeline
            hitos={data.hitos}
            titulo="Tiempos por hito de producción"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Estado de órdenes
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
                  Tipos de dieta producidos
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <HorizontalBarChart items={data.tiposDieta} />
              </CardContent>
            </Card>
          </div>

          <div
            className={`grid gap-4 ${data.mostrarDistribucionTurno ? "lg:grid-cols-2" : ""}`}
          >
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

            {data.mostrarDistribucionTurno && (
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">
                    Distribución por turno
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <VerticalBarChart items={data.distribucionServicio} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <HallazgosPanel hallazgos={data.hallazgos} titulo="Alertas operativas" />
      </div>
    </div>
  )
}
