import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { RecepcionProveedorPanel } from "@/modules/dietas-cocina/etiquetas/components/RecepcionProveedorPanel"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  COMIDAS_OPERATIVAS,
  obtenerComidaActivaOperativa,
  subtituloFechaOperativa,
} from "@/modules/dietas-cocina/config/operativa-defaults"
import { calcularKpisEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import {
  CAPACIDADES_BANDEJAS_PISO,
  puedeCapacidadEtiquetas,
  puedeRecepcionProveedor,
  resolverTituloEtiquetasOperativas,
  tieneOperacionBandejasPiso,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { AccionesFlujoHub } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { puedeConfirmarPreEntrega, motivoNoConfirmarPreEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { filtrarEtiquetasDelPeriodoOperativo } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import { cn } from "@/lib/utils"
import { AlertTriangle, ClipboardList, PackageCheck } from "lucide-react"

const ICONOS_KPI: Record<string, typeof ClipboardList> = {
  "pendientes-recepcion": ClipboardList,
  "pendientes-entrega": PackageCheck,
  recogidas: AlertTriangle,
}

function SeccionOperativa({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
        {descripcion && (
          <p className="text-sm text-muted-foreground">{descripcion}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export function EtiquetasEnfermeraView() {
  const apiActiva = usarApiDietasCocina()
  const rol = useRolVistaEfectivo()
  const puedeRecepcion = puedeRecepcionProveedor(rol)
  const puedeEntrega = puedeCapacidadEtiquetas(rol, "entrega_paciente")
  const operacionPiso = tieneOperacionBandejasPiso(rol)
  const location = useLocation()
  const { etiquetas, confirmarPreEntrega, getOrdenByEtiquetaId } =
    useCicloBandejas()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : mockEtiquetas.comidaActiva,
  )
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    const state = location.state as { mensaje?: string } | null
    if (state?.mensaje) {
      setMensaje(state.mensaje)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const etiquetasOperativas = useMemo(
    () => filtrarEtiquetasDelPeriodoOperativo(etiquetas),
    [etiquetas],
  )

  const filtradasComida = useMemo(
    () => etiquetasOperativas.filter((e) => e.comida === comidaActiva),
    [etiquetasOperativas, comidaActiva],
  )

  const kpis = useMemo(() => {
    const todos = calcularKpisEnfermera(etiquetasOperativas, comidaActiva)
    return todos.filter((kpi) => {
      if (kpi.id === "pendientes-recepcion") return puedeRecepcion
      if (kpi.id === "pendientes-entrega") return operacionPiso
      if (kpi.id === "recogidas") {
        return puedeCapacidadEtiquetas(rol, "recogida_bandeja")
      }
      return true
    })
  }, [etiquetasOperativas, comidaActiva, puedeRecepcion, operacionPiso, rol])

  const pendientesRecepcion = useMemo(
    () => filtradasComida.filter((e) => e.estadoLogistica === "impresa"),
    [filtradasComida],
  )

  const pendientesEntrega = useMemo(
    () => filtradasComida.filter((e) => e.estadoLogistica === "pre_entregada"),
    [filtradasComida],
  )

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
    setMensaje(null)
  }

  function toggleSeleccion(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleTodas(checked: boolean) {
    if (checked) {
      setSeleccionados(new Set(pendientesRecepcion.map((e) => e.id)))
    } else {
      setSeleccionados(new Set())
    }
  }

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
      setSeleccionados(new Set())
      setMensaje(
        `${ids.length} bandeja${ids.length > 1 ? "s" : ""} recibida${ids.length > 1 ? "s" : ""} — el proveedor puede ver el estado actualizado.`,
      )
    } catch {
      // El contexto ya mostró el error del API.
    } finally {
      setConfirmando(false)
    }
  }

  const columnasKpi =
    kpis.length === 1 ? "sm:grid-cols-1" : kpis.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title={resolverTituloEtiquetasOperativas(rol)}
        subtitle={
          apiActiva ? subtituloFechaOperativa() : mockEtiquetas.fechaReferencia
        }
      />

      <DietasComidaTabs
        comidas={apiActiva ? COMIDAS_OPERATIVAS : mockEtiquetas.comidas}
        comidaActiva={comidaActiva}
        onComidaChange={cambiarComida}
      />

      {kpis.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-3", columnasKpi)}>
          {kpis.map((kpi) => (
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

      {puedeRecepcion && (
        <SeccionOperativa
          titulo="Recepción del proveedor"
          descripcion="Confirma las bandejas que llegan del proveedor antes de que pasen a entrega en piso."
        >
          <RecepcionProveedorPanel
            bandejas={pendientesRecepcion}
            seleccionados={seleccionados}
            onToggle={toggleSeleccion}
            onToggleTodas={toggleTodas}
            onConfirmar={() => void confirmarRecepcion()}
            confirmando={confirmando}
          />
          <AccionesFlujoHub capacidades={["recepcion_proveedor"]} />
        </SeccionOperativa>
      )}

      {operacionPiso && (
        <SeccionOperativa
          titulo="Bandejas en piso"
          descripcion="Entrega al paciente, rechazos antes de entregar y recogida con registro de consumo."
        >
          <AccionesFlujoHub capacidades={[...CAPACIDADES_BANDEJAS_PISO]} />

          {puedeEntrega && pendientesEntrega.length > 0 && (
            <Card>
              <CardHeader className="border-b pb-3">
                <h3 className="font-semibold">Pendientes de entrega al paciente</h3>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {pendientesEntrega.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{e.paciente}</p>
                        <p className="text-sm text-muted-foreground">
                          Hab. {e.habitacion} · Recibida {e.horaPreEntrega ?? "—"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          claseBadgeLogistica(e.estadoLogistica),
                        )}
                      >
                        {etiquetaLogisticaLabel(e.estadoLogistica, e)}
                      </Badge>
                      <Button type="button" size="sm" asChild>
                        <Link
                          to={`/dietas-cocina/etiquetas/consulta/${encodeURIComponent(e.codigo)}`}
                        >
                          Entregar
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </SeccionOperativa>
      )}
    </div>
  )
}
