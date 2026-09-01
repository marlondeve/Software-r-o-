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
import { PlanillaContratoTable } from "@/modules/dietas-cocina/reportes/components/PlanillaContratoTable"
import { ReportesFiltros } from "@/modules/dietas-cocina/reportes/components/ReportesFiltros"
import { ReportesKpiGrid } from "@/modules/dietas-cocina/reportes/components/ReportesKpiGrid"
import {
  agruparKpisReporte,
  kpisTienenClavesApi,
} from "@/modules/dietas-cocina/reportes/lib/reportesKpiSecciones"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { formatearUltimaActualizacionReporte } from "@/modules/dietas-cocina/lib/formatearFechaOperativa"
import { listarServiciosDesdeFilas } from "@/modules/dietas-cocina/lib/servicioClinico"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"
import { crearFiltrosReportesIniciales } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { construirReportesProveedorDesdeCiclo } from "@/modules/dietas-cocina/reportes/lib/reportesDesdeCiclo"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  descargarReporteDashboardExcel,
  nombreArchivoReporteDashboard,
  obtenerReporteProveedor,
} from "@/modules/dietas-cocina/api/services/reportes.service"
import { descargarBlob } from "@/modules/dietas-cocina/lib/descargarBlob"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { REPORTES_FILTROS_UI } from "@/modules/dietas-cocina/config/reportes-ui"
import { useReporteApi } from "@/modules/dietas-cocina/reportes/hooks/useReporteApi"

function SeccionTitulo({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>
  )
}

export function ReportesProveedorView() {
  const base = mockReportesProveedor
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
      obtenerReporteProveedor({
        desde: filtros.desde,
        hasta: filtros.hasta,
        servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
        horario: filtros.horario !== "todos" ? filtros.horario : undefined,
        comida: undefined,
      }),
    [filtros],
  )

  const mapearReporte = useCallback(
    (resp: unknown) => mapReporteDto(resp as Parameters<typeof mapReporteDto>[0]),
    [],
  )

  const { reporteApi, cargando, desdeCache, textoActualizacion } = useReporteApi({
    tipo: "produccion",
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
    () => construirReportesProveedorDesdeCiclo(ordenes, etiquetas, filtros, filas),
    [ordenes, etiquetas, filtros, filas],
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

  const volumenComida =
    "distribucionTurno" in data ? data.distribucionTurno : data.distribucionServicio

  const seccionesKpi = useMemo(() => {
    if (!kpisTienenClavesApi(data.kpis)) return undefined
    return agruparKpisReporte(data.kpis, "produccion")
  }, [data.kpis])

  const exportarExcel = useCallback(() => {
    if (!apiActiva || !estaOnline) return
    setExportando(true)
    void descargarReporteDashboardExcel("produccion", {
      desde: filtros.desde,
      hasta: filtros.hasta,
      servicio: filtros.servicio !== "todos" ? filtros.servicio : undefined,
      horario: filtros.horario !== "todos" ? filtros.horario : undefined,
    })
      .then((blob) => {
        descargarBlob(
          blob,
          nombreArchivoReporteDashboard("produccion", filtros),
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
        title="Reportes de producción"
        subtitle="Use la sección «Conciliar con cocina» para cuadrar con la planilla del proveedor. Los demás indicadores son operativos o de referencia."
      />
      <BannerModuloSinConexion datosEnCache={desdeCache || !estaOnline} />

      <ReportesFiltros
        {...(apiActiva ? REPORTES_FILTROS_UI : base.filtros)}
        filtros={filtros}
        serviciosDisponibles={serviciosDisponibles}
        ultimaActualizacion={
          apiActiva
            ? textoActualizacion
            : formatearUltimaActualizacionReporte(new Date())
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
              <SeccionTitulo>Operación</SeccionTitulo>
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
              <SeccionTitulo>Calidad y volumen</SeccionTitulo>
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

                {data.mostrarDistribucionTurno ? (
                  <Card className="gap-0 py-0 shadow-none lg:col-span-2">
                    <CardHeader className="border-b py-3">
                      <CardTitle className="text-sm font-semibold">
                        Volumen por comida
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4">
                      <HorizontalBarChart items={volumenComida} />
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </section>
          </div>

          <HallazgosPanel hallazgos={data.hallazgos} titulo="Alertas operativas" />
        </div>

        {"mostrarCostos" in data && data.mostrarCostos ? (
          <section className="space-y-3">
            <SeccionTitulo>Costos (COP)</SeccionTitulo>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold">Costo por día</CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <VerticalBarChart
                    items={data.costoPorDia}
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
                    items={data.costoPorServicio}
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
                    items={data.costoPorComida}
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
