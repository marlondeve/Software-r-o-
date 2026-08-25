import { Outlet, useMatch } from "react-router-dom"

import { AlertTriangle, ClipboardList, PackageCheck } from "lucide-react"

import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { ListadoBandejasRecibidasEnPiso } from "@/modules/dietas-cocina/etiquetas/components/ListadoBandejasRecibidasEnPiso"
import { useEtiquetasOperativas } from "@/modules/dietas-cocina/etiquetas/hooks/useEtiquetasOperativas"
import {
  CAPACIDADES_BANDEJAS_PISO,
  puedeCapacidadEtiquetas,
  tieneOperacionBandejasPiso,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { AccionesFlujoHub } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { BadgePendientesSync } from "@/modules/dietas-cocina/etiquetas/components/BadgePendientesSync"
import { PanelConflictosSync } from "@/modules/dietas-cocina/etiquetas/components/PanelConflictosSync"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { subtituloFechaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { cn } from "@/lib/utils"

const ICONOS_KPI: Record<string, typeof ClipboardList> = {
  "pendientes-entrega": PackageCheck,
  recogidas: AlertTriangle,
}

function BandejasPisoPageContent() {
  const {
    apiActiva,
    rol,
    comidas,
    comidaActiva,
    cambiarComida,
    mensaje,
    kpis,
    pendientesEntrega,
    pendientesEntregaFueraFlujo,
    clasificacionPorId,
  } = useEtiquetasOperativas()

  const kpisPiso = kpis.filter((kpi) => {
    if (kpi.id === "pendientes-entrega") return true
    if (kpi.id === "fuera-flujo") return true
    if (kpi.id === "recogidas") {
      return puedeCapacidadEtiquetas(rol, "recogida_bandeja")
    }
    return false
  })

  const columnasKpi =
    kpisPiso.length === 1
      ? "sm:grid-cols-1"
      : kpisPiso.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3"

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Bandejas en piso"
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

      {kpisPiso.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-3", columnasKpi)}>
          {kpisPiso.map((kpi) => (
            <KpiCardSimple
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              icon={ICONOS_KPI[kpi.id] ?? PackageCheck}
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
            Operaciones en piso
          </h2>
          <p className="text-sm text-muted-foreground">
            Entrega al paciente, rechazos antes de entregar y recogida con
            registro de consumo.
          </p>
        </div>
        <AccionesFlujoHub capacidades={[...CAPACIDADES_BANDEJAS_PISO]} />
        {!tieneOperacionBandejasPiso(rol) && (
          <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Tiene acceso a esta sección, pero no tiene flujos operativos
            asignados (entrega, rechazo o recogida).
          </p>
        )}
        {(pendientesEntrega.length > 0 ||
          pendientesEntregaFueraFlujo.length > 0) && (
          <ListadoBandejasRecibidasEnPiso
            bandejas={pendientesEntrega}
            bandejasFueraFlujo={pendientesEntregaFueraFlujo}
            motivoFueraFlujoPorId={
              new Map(
                [...clasificacionPorId.entries()].map(([id, c]) => [
                  id,
                  c.motivo,
                ]),
              )
            }
          />
        )}
      </section>
    </div>
  )
}

export function BandejasPisoPage() {
  const esIndex = useMatch({ path: "/dietas-cocina/bandejas-piso", end: true })

  return (
    <RutaDietasSectionGuard segmento="bandejas-piso" title="Bandejas en piso">
      {esIndex && <BandejasPisoPageContent />}
      <Outlet />
    </RutaDietasSectionGuard>
  )
}
