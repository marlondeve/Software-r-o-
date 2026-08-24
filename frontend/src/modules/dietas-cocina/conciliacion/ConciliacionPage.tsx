import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton } from "@/components/shared/skeletons"
import { usePaginacionTabla } from "@/lib/usePaginacionTabla"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { ConciliacionDetalleSheet } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionDetalleSheet"
import { ConciliacionFiltros } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionFiltros"
import { ConciliacionKpiGrid } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionKpiGrid"
import { ConciliacionTabla } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionTabla"
import { useConciliacionFiltrada } from "@/modules/dietas-cocina/conciliacion/lib/conciliacionFiltros"
import { useConciliacionApi } from "@/modules/dietas-cocina/conciliacion/hooks/useConciliacionApi"
import {
  construirDetalleDesdeFila,
  obtenerDetalleConciliacion,
} from "@/modules/dietas-cocina/conciliacion/lib/detalleConciliacion"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { obtenerDetalleConciliacionApi } from "@/modules/dietas-cocina/api/services/conciliacion.service"
import type { DetalleConciliacion } from "@/modules/dietas-cocina/types/reconciliation"

export function ConciliacionPage() {
  const apiActiva = usarApiDietasCocina()
  const [searchParams] = useSearchParams()
  const mockData = useConciliacionFiltrada()
  const apiData = useConciliacionApi()
  const {
    filas,
    filasFiltradas,
    kpis,
    busqueda,
    setBusqueda,
    numeroFactura,
    setNumeroFactura,
    periodo,
    setPeriodo,
    proveedor,
    setProveedor,
    actualizarEstadoFila,
    filtros,
    detalles,
    cargando,
    error,
  } = apiActiva ? apiData : mockData

  useEffect(() => {
    const q = searchParams.get("q")?.trim()
    if (q) setBusqueda(q)
  }, [searchParams, setBusqueda])

  const paginacionMock = usePaginacionTabla(filasFiltradas, {
    resetKey: `${busqueda}-${numeroFactura}-${periodo}-${proveedor}`,
  })

  const filasTabla = apiActiva ? filasFiltradas : paginacionMock.filasPagina
  const paginaActual = apiActiva ? apiData.paginaActual : paginacionMock.paginaActual
  const totalPaginas = apiActiva ? apiData.totalPaginas : paginacionMock.totalPaginas
  const paginaDesde = apiActiva ? apiData.paginaDesde : paginacionMock.paginaDesde
  const paginaHasta = apiActiva ? apiData.paginaHasta : paginacionMock.paginaHasta
  const totalRegistros = apiActiva ? apiData.totalFilas : paginacionMock.total
  const onCambiarPagina = apiActiva
    ? apiData.setPaginaActual
    : paginacionMock.setPaginaActual

  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)
  const [detalleApi, setDetalleApi] = useState<DetalleConciliacion | null>(null)

  useEffect(() => {
    if (!apiActiva || !filaSeleccionada) {
      setDetalleApi(null)
      return
    }

    let cancelado = false
    void obtenerDetalleConciliacionApi(filaSeleccionada)
      .then((detalle) => {
        if (!cancelado) setDetalleApi(detalle)
      })
      .catch(() => {
        if (!cancelado) {
          const fila = filas.find((item) => item.id === filaSeleccionada)
          setDetalleApi(fila ? construirDetalleDesdeFila(fila) : null)
        }
      })

    return () => {
      cancelado = true
    }
  }, [apiActiva, filaSeleccionada, filas])

  const detalle = apiActiva
    ? detalleApi
    : filaSeleccionada
      ? obtenerDetalleConciliacion(filaSeleccionada, filas, detalles)
      : null

  function abrirDetalle(id: string) {
    setFilaSeleccionada(id)
    setSheetAbierto(true)
  }

  return (
    <RutaDietasSectionGuard segmento="conciliacion" title="Conciliación">
    <div className="space-y-5">
      <DashboardPageHeader title="Conciliación" />

      {apiActiva && error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ConciliacionFiltros
        {...filtros}
        periodoSeleccionado={periodo}
        proveedorSeleccionado={proveedor}
        numeroFactura={numeroFactura}
        onPeriodoChange={setPeriodo}
        onProveedorChange={setProveedor}
        onNumeroFacturaChange={setNumeroFactura}
      />

      <ConciliacionKpiGrid kpis={kpis} />

      {apiActiva && cargando && filasFiltradas.length === 0 ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <ConciliacionTabla
          filas={filasTabla}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          onVerDetalle={abrirDetalle}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          paginaDesde={paginaDesde}
          paginaHasta={paginaHasta}
          totalRegistros={totalRegistros}
          onCambiarPagina={onCambiarPagina}
        />
      )}

      <ConciliacionDetalleSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        detalle={detalle}
        filaId={filaSeleccionada}
        onMarcarConciliado={(id) => {
          actualizarEstadoFila(id, "conciliado-manual")
          setSheetAbierto(false)
        }}
        onPendienteRevision={(id) => {
          actualizarEstadoFila(id, "pendiente")
          setSheetAbierto(false)
        }}
      />
    </div>
    </RutaDietasSectionGuard>
  )
}
