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
import { PlanillaContratoTable } from "@/modules/dietas-cocina/reportes/components/PlanillaContratoTable"
import { ReportesFiltros } from "@/modules/dietas-cocina/reportes/components/ReportesFiltros"
import { ReportesKpiGrid } from "@/modules/dietas-cocina/reportes/components/ReportesKpiGrid"
import {
  agruparKpisReporte,
  kpisTienenClavesApi,
} from "@/modules/dietas-cocina/reportes/lib/reportesKpiSecciones"
import { mockReportesNutricionista } from "@/modules/dietas-cocina/reportes/datos/mockReportesNutricionista"
import { crearFiltrosReportesIniciales } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  descargarReporteDashboardExcel,
  nombreArchivoReporteDashboard,
  obtenerReporteNutricionista,
} from "@/modules/dietas-cocina/api/services/reportes.service"
import { REPORTES_FILTROS_UI } from "@/modules/dietas-cocina/config/reportes-ui"
import { descargarBlob } from "@/modules/dietas-cocina/lib/descargarBlob"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
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
  const [exportando, setExportando] = useState(false)
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

  const totalTiposDieta = useMemo(
    () => data.tiposDieta.reduce((sum, item) => sum + item.value, 0),
    [data.tiposDieta],
  )

  const mostrarCostos =
    "mostrarCostos" in data &&
    data.mostrarCostos &&
    ("costoPorDia" in data || "costoPorServicio" in data || "costoPorComida" in data)

  const seccionesKpi = useMemo(() => {
    if (!kpisTienenClavesApi(data.kpis)) return undefined
    return agruparKpisReporte(data.kpis, "clinico")
  }, [data.kpis])

  const exportarExcel = useCallback(() => {
    if (!apiActiva || !estaOnline) return
    setExportando(true)
    void descargarReporteDashboardExcel("clinico", {
      desde: filtros.desde,
      hasta: filtros.hasta,
      servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
      horario: filtros.horario !== "todos" ? filtros.horario : undefined,
    })
      .then((blob) => {
        descargarBlob(
          blob,
          nombreArchivoReporteDashboard("clinico", filtros),
        )
        demoToast("Reporte Excel generado.")
      })
      .catch((error) => {
        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudo generar el reporte.",
          "error",
        )
      })
      .finally(() => setExportando(false))
  }, [apiActiva, estaOnline, filtros])

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Reportes clínicos"
        subtitle="«Conciliar con cocina» muestra bandejas facturables. «Censo clínico» es el universo de pacientes; no lo compare con la planilla del proveedor."
      />
      <BannerModuloSinConexion datosEnCache={desdeCache || !estaOnline} />

      <ReportesFiltros
        {...(apiActiva ? REPORTES_FILTROS_UI : base.filtros)}
        filtros={filtros}
        serviciosDisponibles={serviciosDisponibles}
        ultimaActualizacion={
          apiActiva ? textoActualizacion : base.filtros.ultimaActualizacion
        }
        exportando={exportando}
        onExportar={apiActiva && estaOnline ? exportarExcel : undefined}
        onFiltrosChange={setFiltros}
      />

      <PageLoadingGate
        loading={apiActiva && estaOnline && cargando && !reporteApi}
        skeleton={<ReportesPageSkeleton />}
      >
        <ReportesKpiGrid kpis={data.kpis} secciones={seccionesKpi} />

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
                      {totalTiposDieta > 0 ? ` (total: ${totalTiposDieta})` : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <HorizontalBarChart items={data.tiposDieta} />
                  </CardContent>
                </Card>
              </div>
            </section>

            {"planillaContrato" in data && data.planillaContrato.length > 0 ? (
              <section className="space-y-3">
                <SeccionTitulo>Producción según contrato</SeccionTitulo>
                <Card className="gap-0 py-0 shadow-none">
                  <CardHeader className="border-b py-3">
                    <CardTitle className="text-sm font-semibold">
                      Planilla de cocina (tarifario FCR)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <PlanillaContratoTable bloques={data.planillaContrato} />
                  </CardContent>
                </Card>
              </section>
            ) : "contratoPorComida" in data && data.contratoPorComida.length > 0 ? (
              <section className="space-y-3">
                <SeccionTitulo>Producción según contrato</SeccionTitulo>
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.contratoPorComida.map((bloque) => (
                    <Card key={bloque.titulo} className="gap-0 py-0 shadow-none">
                      <CardHeader className="border-b py-3">
                        <CardTitle className="text-sm font-semibold">
                          {bloque.titulo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4">
                        <HorizontalBarChart items={bloque.items} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

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
