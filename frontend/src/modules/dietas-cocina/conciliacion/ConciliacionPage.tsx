import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton } from "@/components/shared/skeletons"
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
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { construirDetallesConciliacionDesdeCiclo } from "@/modules/dietas-cocina/lib/construirConciliacionDesdeCiclo"
import { puedeCapturarCocinaConciliacion, puedeResolverConciliacion } from "@/modules/dietas-cocina/lib/permisos"
import { useMatrizPermisosVersion } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
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
    desde,
    setDesde,
    hasta,
    setHasta,
    estado,
    setEstado,
    actualizarEstadoFila,
    cargando,
    error,
    exportar,
    guardarCantidadCocina,
    guardandoCocinaId,
  } = apiActiva ? apiData : mockData

  const { ordenes } = useCicloBandejas()
  const rol = useRolVistaEfectivo()
  useMatrizPermisosVersion()
  const puedeResolver = puedeResolverConciliacion(rol)
  const puedeCapturarCocina = puedeCapturarCocinaConciliacion(rol)

  useEffect(() => {
    const q = searchParams.get("q")?.trim()
    if (q) setBusqueda(q)
  }, [searchParams, setBusqueda])

  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)
  const [detalleApi, setDetalleApi] = useState<DetalleConciliacion | null>(null)

  useEffect(() => {
    if (!apiActiva || !filaSeleccionada) {
      setDetalleApi(null)
      return
    }

    let cancelado = false
    void obtenerDetalleConciliacionApi(filaSeleccionada, desde, hasta)
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
  }, [apiActiva, filaSeleccionada, filas, desde, hasta])

  const detallesLocal = useMemo(
    () => (apiActiva ? {} : construirDetallesConciliacionDesdeCiclo(ordenes, filas)),
    [apiActiva, ordenes, filas],
  )

  const detalle = apiActiva
    ? detalleApi
    : filaSeleccionada
      ? obtenerDetalleConciliacion(filaSeleccionada, filas, detallesLocal)
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
          desde={desde}
          hasta={hasta}
          estado={estado}
          numeroFactura={numeroFactura}
          apiActiva={apiActiva}
          onRangoChange={({ desde: d, hasta: h }) => {
            setDesde(d)
            setHasta(h)
          }}
          onEstadoChange={setEstado}
          onNumeroFacturaChange={setNumeroFactura}
          onExportar={exportar}
        />

        <ConciliacionKpiGrid kpis={kpis} />

        {apiActiva && cargando && filasFiltradas.length === 0 ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <ConciliacionTabla
            filas={filasFiltradas}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            onVerDetalle={abrirDetalle}
            puedeEditarCocina={apiActiva && puedeCapturarCocina}
            guardandoCocinaId={guardandoCocinaId}
            onGuardarCantidadCocina={guardarCantidadCocina}
          />
        )}

        <ConciliacionDetalleSheet
          open={sheetAbierto}
          onOpenChange={setSheetAbierto}
          detalle={detalle}
          filaId={filaSeleccionada}
          puedeResolver={puedeResolver}
          onMarcarConciliado={(id, motivo, observaciones) => {
            void actualizarEstadoFila(id, "conciliado-manual", motivo, observaciones)
          }}
          onPendienteRevision={(id, motivo, observaciones) => {
            void actualizarEstadoFila(id, "pendiente", motivo, observaciones)
          }}
        />
      </div>
    </RutaDietasSectionGuard>
  )
}
