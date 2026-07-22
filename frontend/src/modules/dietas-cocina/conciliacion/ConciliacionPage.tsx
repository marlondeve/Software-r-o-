import { useState } from "react"

import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { ConciliacionDetalleSheet } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionDetalleSheet"
import { ConciliacionFiltros } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionFiltros"
import { ConciliacionKpiGrid } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionKpiGrid"
import { ConciliacionTabla } from "@/modules/dietas-cocina/conciliacion/components/ConciliacionTabla"
import { mockConciliacion } from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import { obtenerDetalleConciliacion } from "@/modules/dietas-cocina/conciliacion/lib/detalleConciliacion"

export function ConciliacionPage() {
  const data = mockConciliacion
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)

  const detalle = filaSeleccionada
    ? obtenerDetalleConciliacion(
        filaSeleccionada,
        data.filas,
        data.detalles,
      )
    : null

  function abrirDetalle(id: string) {
    setFilaSeleccionada(id)
    setSheetAbierto(true)
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Conciliación" />

      <ConciliacionFiltros {...data.filtros} />

      <ConciliacionKpiGrid kpis={data.kpis} />

      <ConciliacionTabla filas={data.filas} onVerDetalle={abrirDetalle} />

      <ConciliacionDetalleSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        detalle={detalle}
      />
    </div>
  )
}
