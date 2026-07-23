import { useState } from "react"

import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { ConciliacionDetalleSheet } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionDetalleSheet"
import { ConciliacionFiltros } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionFiltros"
import { ConciliacionKpiGrid } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionKpiGrid"
import { ConciliacionTabla } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionTabla"
import { useConciliacionFiltrada } from "@/modules/dietas-cocina/conciliacion/lib/conciliacionFiltros"
import { obtenerDetalleConciliacion } from "@/modules/dietas-cocina/conciliacion/lib/detalleConciliacion"

export function ConciliacionPage() {
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
  } = useConciliacionFiltrada()

  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)

  const detalle = filaSeleccionada
    ? obtenerDetalleConciliacion(filaSeleccionada, filas, detalles)
    : null

  function abrirDetalle(id: string) {
    setFilaSeleccionada(id)
    setSheetAbierto(true)
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Conciliación" />

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

      <ConciliacionTabla
        filas={filasFiltradas}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onVerDetalle={abrirDetalle}
      />

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
  )
}
