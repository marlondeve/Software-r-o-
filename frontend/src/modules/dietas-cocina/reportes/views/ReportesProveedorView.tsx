import { useCallback, useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoadingGate, ReportesPageSkeleton } from "@/components/shared/skeletons"
import { BannerModuloSinConexion } from "@/modules/dietas-cocina/components/BannerModuloSinConexion"
import { useConectividadRed } from "@/hooks/useConectividadRed"
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
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { formatearUltimaActualizacionReporte } from "@/modules/dietas-cocina/lib/formatearFechaOperativa"
import { listarServiciosDesdeFilas } from "@/modules/dietas-cocina/lib/servicioClinico"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"
import { crearFiltrosReportesIniciales } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesProveedorDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { obtenerReporteProveedor } from "@/modules/dietas-cocina/api/services/reportes.service"
import { REPORTES_FILTROS_UI } from "@/modules/dietas-cocina/config/reportes-ui"
import { useReporteApi } from "@/modules/dietas-cocina/reportes/hooks/useReporteApi"

export function ReportesProveedorView() {
  const base = mockReportesProveedor
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
      obtenerReporteProveedor({
        desde: filtros.desde,
        hasta: filtros.hasta,
        servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
        horario: filtros.horario !== "todos" ? filtros.horario : undefined,
        comida: undefined,
      }),
    [filtros],
  )

  const { reporteApi, cargando, desdeCache } = useReporteApi({
    tipo: "produccion",
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
    () => construirReportesProveedorDesdeCiclo(ordenes, etiquetas, filtros, filas),
    [ordenes, etiquetas, filtros, filas],
  )

  const data = useMemo(() => {
    if (!apiActiva) return dataCiclo
    if (!estaOnline && !reporteApi) return dataCiclo
    return reporteApi ?? dataCiclo
  }, [apiActiva, reporteApi, dataCiclo, estaOnline])

  const subtituloActualizacion = useMemo(
    () =>
      apiActiva
        ? cargando
          ? "Actualizando…"
          : formatearUltimaActualizacionReporte(new Date())
        : formatearUltimaActualizacionReporte(new Date()),
    [apiActiva, cargando],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Reportes de producción"
        subtitle="Analítica operativa de planta y despacho."
      />
      <BannerModuloSinConexion datosEnCache={desdeCache || !estaOnline} />

      <ReportesFiltros
        {...(apiActiva ? REPORTES_FILTROS_UI : base.filtros)}
        filtros={filtros}
        serviciosDisponibles={serviciosDisponibles}
        ultimaActualizacion={subtituloActualizacion}
        onFiltrosChange={setFiltros}
      />

      <PageLoadingGate
        loading={apiActiva && estaOnline && cargando && !reporteApi}
        skeleton={<ReportesPageSkeleton />}
      >
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
            className={`grid gap-4 ${data.mostrarDistribucionTurno ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
          >
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

            {data.mostrarDistribucionTurno && (
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">
                    Volumen por comida
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <VerticalBarChart
                    items={
                      "distribucionTurno" in data
                        ? data.distribucionTurno
                        : data.distribucionServicio
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <HallazgosPanel hallazgos={data.hallazgos} titulo="Alertas operativas" />
      </div>
      </PageLoadingGate>
    </div>
  )
}
