import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"

import { ClipboardList } from "lucide-react"
import { Outlet, useMatch } from "react-router-dom"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { RecepcionProveedorPanel } from "@/modules/dietas-cocina/etiquetas/components/RecepcionProveedorPanel"
import { useEtiquetasOperativas } from "@/modules/dietas-cocina/etiquetas/hooks/useEtiquetasOperativas"
import { AccionesFlujoHub } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { BadgePendientesSync } from "@/modules/dietas-cocina/etiquetas/components/BadgePendientesSync"
import { PanelConflictosSync } from "@/modules/dietas-cocina/etiquetas/components/PanelConflictosSync"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { subtituloFechaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import {
  motivoNoConfirmarPreEntrega,
  puedeConfirmarPreEntrega,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { cn } from "@/lib/utils"

const ICONOS_KPI: Record<string, typeof ClipboardList> = {
  "pendientes-recepcion": ClipboardList,
}

function RecepcionProveedorPageContent() {
  const {
    apiActiva,
    rol,
    comidas,
    comidaActiva,
    cambiarComida,
    mensaje,
    confirmando,
    setConfirmando,
    seleccionados,
    kpis,
    pendientesRecepcion,
    toggleSeleccion,
    toggleTodas,
    confirmarPreEntrega,
    getOrdenByEtiquetaId,
  } = useEtiquetasOperativas()

  async function confirmarRecepcion() {
    const ids = [...seleccionados].filter((id) => {
      const etiqueta = pendientesRecepcion.find((e) => e.id === id)
      if (!etiqueta) return false
      const orden = getOrdenByEtiquetaId(id)
      return puedeConfirmarPreEntrega(orden, etiqueta, { apiActiva })
    })
    if (ids.length === 0) {
      const primera = pendientesRecepcion.find((e) => seleccionados.has(e.id))
      const orden = primera ? getOrdenByEtiquetaId(primera.id) : undefined
      const motivo = primera
        ? motivoNoConfirmarPreEntrega(orden, primera, { apiActiva })
        : "Selecciona bandejas impresas pendientes de recepción."
      demoToast(motivo ?? "No se pudo confirmar la recepción.", "error")
      return
    }
    setConfirmando(true)
    try {
      await confirmarPreEntrega(ids, rol ?? "Personal de turno")
      demoToast(
        `${ids.length} bandeja${ids.length > 1 ? "s" : ""} recibida${ids.length > 1 ? "s" : ""}.`,
        "success",
      )
    } finally {
      setConfirmando(false)
    }
  }

  const columnasKpi =
    kpis.length === 1 ? "sm:grid-cols-1" : kpis.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Recepción del proveedor"
        subtitle={
          apiActiva ? subtituloFechaOperativa() : mockEtiquetas.fechaReferencia
        }
        actions={<BadgePendientesSync />}
      />

      <DietasComidaTabs
        comidas={comidas}
        comidaActiva={comidaActiva}
        onComidaChange={cambiarComida}
      />

      <PanelConflictosSync />

      {kpis.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-3", columnasKpi)}>
          {kpis
            .filter((kpi) => kpi.id === "pendientes-recepcion")
            .map((kpi) => (
              <KpiCardSimple
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                icon={ICONOS_KPI[kpi.id] ?? ClipboardList}
              />
            ))}
        </div>
      )}

      {mensaje && (
        <p className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
          {mensaje}
        </p>
      )}

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            Confirmar recepción
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirma las bandejas que llegan del proveedor antes de que pasen a
            entrega en piso.
          </p>
        </div>
        <RecepcionProveedorPanel
          bandejas={pendientesRecepcion}
          seleccionados={seleccionados}
          onToggle={toggleSeleccion}
          onToggleTodas={toggleTodas}
          onConfirmar={() => void confirmarRecepcion()}
          confirmando={confirmando}
        />
        <AccionesFlujoHub capacidades={["recepcion_proveedor"]} />
      </section>
    </div>
  )
}

export function RecepcionProveedorPage() {
  const esIndex = useMatch({
    path: "/dietas-cocina/recepcion-proveedor",
    end: true,
  })

  return (
    <RutaDietasSectionGuard
      segmento="recepcion-proveedor"
      title="Recepción del proveedor"
    >
      {esIndex && <RecepcionProveedorPageContent />}
      <Outlet />
    </RutaDietasSectionGuard>
  )
}
