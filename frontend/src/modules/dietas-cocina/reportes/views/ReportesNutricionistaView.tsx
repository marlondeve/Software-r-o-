import { useCallback, useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoadingGate, ReportesPageSkeleton } from "@/components/shared/skeletons"
import { BannerModuloSinConexion } from "@/modules/dietas-cocina/components/BannerModuloSinConexion"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
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
import { crearFiltrosReportesIniciales } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  mapReporteDto,
} from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { obtenerReporteNutricionista } from "@/modules/dietas-cocina/api/services/reportes.service"
import { REPORTES_FILTROS_UI } from "@/modules/dietas-cocina/config/reportes-ui"
import { formatearUltimaActualizacionReporte } from "@/modules/dietas-cocina/lib/formatearFechaOperativa"
import { listarServiciosDesdeFilas } from "@/modules/dietas-cocina/lib/servicioClinico"
import { useReporteApi } from "@/modules/dietas-cocina/reportes/hooks/useReporteApi"
import { useConectividadRed } from "@/hooks/useConectividadRed"

export function ReportesNutricionistaView() {
  const base = mockReportesNutricionista
  const { ordenes, etiquetas } = useCicloBandejas()
  const { filas } = useDietasOperativas()
  const apiActiva = usarApiDietasCocina()
  const estaOnline = useConectividadRed()
  const [filtros, setFiltros] = useState(crearFiltrosReportesIniciales)
  const serviciosDisponibles = useMemo(
    () => (apiActiva ? listarServiciosDesdeFilas(filas) : undefined),
    [apiActiva, filas],
  )

  const cargarReporte = useCallback(
    () =>
      obtenerReporteNutricionista({
        desde: filtros.desde,
        hasta: filtros.hasta,
        servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
        horario: filtros.horario !== "todos" ? filtros.horario : undefined,
      }),
    [filtros],
  )

  const { reporteApi, cargando, desdeCache } = useReporteApi({
    tipo: "clinico",
    apiActiva,
    filtros: {
      desde: filtros.desde,
      hasta: filtros.hasta,
      servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
      horario: filtros.horario !== "todos" ? filtros.horario : undefined,
    },
    cargar: cargarReporte,
    mapear: (resp) => mapReporteDto(resp as Parameters<typeof mapReporteDto>[0]),
  })

  const dataCiclo = useMemo(
    () =>
      construirReportesNutricionistaDesdeCiclo(ordenes, etiquetas, filtros, {
        soloDatosReales: apiActiva,
        filas,
      }),
    [ordenes, etiquetas, filtros, apiActiva, filas],
  )

  const data = useMemo(() => {
    if (!apiActiva) return dataCiclo
    if (!estaOnline && !reporteApi) return dataCiclo
    return reporteApi ?? dataCiclo
  }, [apiActiva, reporteApi, dataCiclo, estaOnline])

  const ultimaActualizacion = useMemo(
    () =>
      apiActiva
        ? cargando
          ? "Actualizando…"
          : formatearUltimaActualizacionReporte(new Date())
        : base.filtros.ultimaActualizacion,
    [apiActiva, cargando, base.filtros.ultimaActualizacion],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Reportes y analítica" />
      <BannerModuloSinConexion datosEnCache={desdeCache || !estaOnline} />

      <ReportesFiltros
        {...(apiActiva ? REPORTES_FILTROS_UI : base.filtros)}
        filtros={filtros}
        serviciosDisponibles={serviciosDisponibles}
        ultimaActualizacion={ultimaActualizacion}
        onFiltrosChange={setFiltros}
      />

      <PageLoadingGate
        loading={apiActiva && estaOnline && cargando && !reporteApi}
        skeleton={<ReportesPageSkeleton />}
      >
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
                  Rechazos antes de entrega (Top 3)
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <VerticalBarChart items={data.motivosDevolucion} />
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm font-semibold">
                  Recogidas de bandeja (Top 3)
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <VerticalBarChart items={data.motivosRecogida} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
      </PageLoadingGate>
    </div>
  )
}
