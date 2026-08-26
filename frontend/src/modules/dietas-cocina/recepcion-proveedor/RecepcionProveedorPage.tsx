import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"

import { ClipboardList } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Outlet, useMatch } from "react-router-dom"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { RecepcionProveedorPanel } from "@/modules/dietas-cocina/etiquetas/components/RecepcionProveedorPanel"
import { useEtiquetasOperativas } from "@/modules/dietas-cocina/etiquetas/hooks/useEtiquetasOperativas"
import {
  ordenarEtiquetasConListaFija,
  sincronizarOrdenListaEtiquetas,
  type OrdenListaEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/ordenarEtiquetas"
import {
  etiquetaCoincideUbicacion,
  listarUbicacionesDesdeEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/ubicacionEtiquetas"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    pendientesRecepcionFueraFlujo,
    clasificacionPorId,
    toggleSeleccion,
    toggleTodas,
    confirmarPreEntrega,
    getOrdenByEtiquetaId,
  } = useEtiquetasOperativas()

  const [ubicacion, setUbicacion] = useState("todas")
  const ordenListaRef = useRef<OrdenListaEtiquetas>(new Map())
  const comidaOrdenRef = useRef(comidaActiva)

  const ubicacionesDisponibles = useMemo(
    () =>
      listarUbicacionesDesdeEtiquetas([
        ...pendientesRecepcion,
        ...pendientesRecepcionFueraFlujo,
      ]),
    [pendientesRecepcion, pendientesRecepcionFueraFlujo],
  )

  useEffect(() => {
    if (
      ubicacion !== "todas" &&
      !ubicacionesDisponibles.some((item) => item.value === ubicacion)
    ) {
      setUbicacion("todas")
    }
  }, [ubicacion, ubicacionesDisponibles])

  const bandejasVisibles = useMemo(() => {
    if (comidaOrdenRef.current !== comidaActiva) {
      ordenListaRef.current = new Map()
      comidaOrdenRef.current = comidaActiva
    }

    const filtradas = pendientesRecepcion.filter((etiqueta) =>
      etiquetaCoincideUbicacion(etiqueta, ubicacion),
    )

    // Congela la posición al primer ingreso: sync de censo / cambio de cama
    // ya no reordena la lista mientras el usuario confirma recepción.
    ordenListaRef.current = sincronizarOrdenListaEtiquetas(
      filtradas,
      ordenListaRef.current,
    )
    return ordenarEtiquetasConListaFija(filtradas, ordenListaRef.current)
  }, [pendientesRecepcion, comidaActiva, ubicacion])

  const bandejasFueraFlujoVisibles = useMemo(
    () =>
      pendientesRecepcionFueraFlujo.filter((etiqueta) =>
        etiquetaCoincideUbicacion(etiqueta, ubicacion),
      ),
    [pendientesRecepcionFueraFlujo, ubicacion],
  )

  function onUbicacionChange(value: string) {
    setUbicacion(value)
    toggleTodas(false)
  }

  function onComidaChange(id: typeof comidaActiva) {
    cambiarComida(id)
    setUbicacion("todas")
  }

  async function confirmarRecepcion() {
    const idsVisibles = new Set(bandejasVisibles.map((e) => e.id))
    const ids = [...seleccionados].filter((id) => {
      if (!idsVisibles.has(id)) return false
      const etiqueta = bandejasVisibles.find((e) => e.id === id)
      if (!etiqueta) return false
      const orden = getOrdenByEtiquetaId(id)
      return puedeConfirmarPreEntrega(orden, etiqueta, { apiActiva })
    })
    if (ids.length === 0) {
      const primera = bandejasVisibles.find((e) => seleccionados.has(e.id))
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
    kpis.filter(
      (kpi) => kpi.id === "pendientes-recepcion" || kpi.id === "fuera-flujo",
    ).length === 1
      ? "sm:grid-cols-1"
      : "sm:grid-cols-2"

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
        onComidaChange={onComidaChange}
      />

      <PanelConflictosSync />

      {kpis.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-3", columnasKpi)}>
          {kpis
            .filter(
              (kpi) =>
                kpi.id === "pendientes-recepcion" || kpi.id === "fuera-flujo",
            )
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
            entrega en piso. Filtra por ubicación para recibir solo el área
            correspondiente.
          </p>
        </div>
        <RecepcionProveedorPanel
          bandejas={bandejasVisibles}
          bandejasFueraFlujo={bandejasFueraFlujoVisibles}
          motivoFueraFlujoPorId={
            new Map(
              [...clasificacionPorId.entries()].map(([id, c]) => [
                id,
                c.motivo,
              ]),
            )
          }
          seleccionados={seleccionados}
          onToggle={toggleSeleccion}
          onToggleTodas={(checked) =>
            toggleTodas(
              checked,
              bandejasVisibles.map((etiqueta) => etiqueta.id),
            )
          }
          onConfirmar={() => void confirmarRecepcion()}
          confirmando={confirmando}
          filtros={
            <div className="max-w-sm space-y-1.5">
              <Label
                htmlFor="recepcion-ubicacion"
                className="text-xs font-medium text-muted-foreground"
              >
                Ubicación
              </Label>
              <Select value={ubicacion} onValueChange={onUbicacionChange}>
                <SelectTrigger
                  id="recepcion-ubicacion"
                  className="h-9 w-full bg-card"
                >
                  <SelectValue placeholder="Ubicación (Todas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Ubicación (Todas)</SelectItem>
                  {ubicacionesDisponibles.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
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
