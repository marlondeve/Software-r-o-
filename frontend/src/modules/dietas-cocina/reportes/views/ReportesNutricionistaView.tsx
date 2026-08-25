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
import { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { obtenerReporteNutricionista } from "@/modules/dietas-cocina/api/services/reportes.service"
import { REPORTES_FILTROS_UI } from "@/modules/dietas-cocina/config/reportes-ui"
import { listarServiciosDesdeFilas } from "@/modules/dietas-cocina/lib/servicioClinico"
import { useReporteApi } from "@/modules/dietas-cocina/reportes/hooks/useReporteApi"
import { useConectividadRed } from "@/hooks/useConectividadRed"

function SeccionTitulo({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>
  )
}

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

  const mapearReporte = useCallback(
    (resp: unknown) => mapReporteDto(resp as Parameters<typeof mapReporteDto>[0]),
    [],
  )

  const { reporteApi, cargando, desdeCache, textoActualizacion } = useReporteApi({
    tipo: "clinico",
    apiActiva,
    filtros: {
      desde: filtros.desde,
      hasta: filtros.hasta,
      servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
      horario: filtros.horario !== "todos" ? filtros.horario : undefined,
    },
    cargar: cargarReporte,
    mapear: mapearReporte,
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

  const mostrarCostos =
    "mostrarCostos" in data &&
    data.mostrarCostos &&
    ("costoPorDia" in data || "costoPorServicio" in data || "costoPorComida" in data)

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Reportes clínicos"
        subtitle="Analítica clínica, servicios y costo de dietas por día y tiempo de comida."
      />
      <BannerModuloSinConexion datosEnCache={desdeCache || !estaOnline} />

      <ReportesFiltros
        {...(apiActiva ? REPORTES_FILTROS_UI : base.filtros)}
        filtros={filtros}
        serviciosDisponibles={serviciosDisponibles}
        ultimaActualizacion={
          apiActiva ? textoActualizacion : base.filtros.ultimaActualizacion
        }
        onFiltrosChange={setFiltros}
      />

      <PageLoadingGate
        loading={apiActiva && estaOnline && cargando && !reporteApi}
        skeleton={<ReportesPageSkeleton />}
      >
        <ReportesKpiGrid kpis={data.kpis} />

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <section className="space-y-3">
              <SeccionTitulo>Operación clínica</SeccionTitulo>
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
            </section>

            <section className="space-y-3">
              <SeccionTitulo>Calidad, servicios y volumen</SeccionTitulo>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="gap-0 py-0 shadow-none">
                  <CardHeader className="border-b py-3">
                    <CardTitle className="text-sm font-semibold">
                      Rechazos antes de entrega (Top 3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <HorizontalBarChart
                      items={data.motivosDevolucion}
                      vacioMensaje="Sin rechazos en el período"
                    />
                  </CardContent>
                </Card>

                <Card className="gap-0 py-0 shadow-none">
                  <CardHeader className="border-b py-3">
                    <CardTitle className="text-sm font-semibold">
                      Recogidas de bandeja (Top 3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <HorizontalBarChart
                      items={data.motivosRecogida}
                      vacioMensaje="Sin recogidas en el período"
                    />
                  </CardContent>
                </Card>

                <Card className="gap-0 py-0 shadow-none">
                  <CardHeader className="border-b py-3">
                    <CardTitle className="text-sm font-semibold">
                      Distribución por servicios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <HorizontalBarChart items={data.distribucionServicio} />
                  </CardContent>
                </Card>

                {"distribucionTurno" in data && data.distribucionTurno.length > 0 ? (
                  <Card className="gap-0 py-0 shadow-none">
                    <CardHeader className="border-b py-3">
                      <CardTitle className="text-sm font-semibold">
                        Volumen por comida
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4">
                      <HorizontalBarChart items={data.distribucionTurno} />
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </section>
          </div>

          <HallazgosPanel hallazgos={data.hallazgos} />
        </div>

        {mostrarCostos ? (
          <section className="space-y-3">
            <SeccionTitulo>Costos (COP)</SeccionTitulo>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">Costo por día</CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <VerticalBarChart
                    items={"costoPorDia" in data ? data.costoPorDia : []}
                    formatoValor="moneda"
                    preferirHorizontalSiMuchas={false}
                  />
                </CardContent>
              </Card>
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">
                    Costo por servicio
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <HorizontalBarChart
                    items={"costoPorServicio" in data ? data.costoPorServicio : []}
                    formatoValor="moneda"
                  />
                </CardContent>
              </Card>
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">
                    Costo por comida
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <HorizontalBarChart
                    items={"costoPorComida" in data ? data.costoPorComida : []}
                    formatoValor="moneda"
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}
      </PageLoadingGate>
    </div>
  )
}
