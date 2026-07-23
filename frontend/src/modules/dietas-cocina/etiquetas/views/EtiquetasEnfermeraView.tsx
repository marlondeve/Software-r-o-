import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { RecepcionProveedorPanel } from "@/modules/dietas-cocina/etiquetas/components/RecepcionProveedorPanel"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { calcularKpisEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import {
  AccionesFlujoHub,
} from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { puedeConfirmarPreEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { cn } from "@/lib/utils"
import { AlertTriangle, ClipboardList, PackageCheck } from "lucide-react"

export function EtiquetasEnfermeraView() {
  const location = useLocation()
  const { etiquetas, confirmarPreEntrega, getOrdenByEtiquetaId } =
    useCicloBandejas()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(
    mockEtiquetas.comidaActiva,
  )
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as { mensaje?: string } | null
    if (state?.mensaje) {
      setMensaje(state.mensaje)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const filtradasComida = useMemo(
    () => etiquetas.filter((e) => e.comida === comidaActiva),
    [etiquetas, comidaActiva],
  )

  const kpis = useMemo(
    () => calcularKpisEnfermera(etiquetas, comidaActiva),
    [etiquetas, comidaActiva],
  )

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

  function confirmarRecepcion() {
    const ids = [...seleccionados].filter((id) => {
      const etiqueta = pendientesRecepcion.find((e) => e.id === id)
      if (!etiqueta) return false
      const orden = getOrdenByEtiquetaId(id)
      return puedeConfirmarPreEntrega(orden, etiqueta)
    })
    if (ids.length === 0) {
      demoToast(
        "Selecciona bandejas impresas despachadas desde cocina para confirmar recepción.",
      )
      return
    }
    confirmarPreEntrega(ids, "Enfermera de turno")
    setSeleccionados(new Set())
    setMensaje(
      `${ids.length} bandeja${ids.length > 1 ? "s" : ""} recibida${ids.length > 1 ? "s" : ""} — el proveedor puede ver el estado actualizado.`,
    )
  }

  const iconosKpi = [ClipboardList, PackageCheck, AlertTriangle]

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Recepción y entrega de bandejas"
        subtitle={mockEtiquetas.fechaReferencia}
      />

      <DietasComidaTabs
        comidas={mockEtiquetas.comidas}
        comidaActiva={comidaActiva}
        onComidaChange={cambiarComida}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KpiCardSimple
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            icon={iconosKpi[i] ?? ClipboardList}
          />
        ))}
      </div>

      {mensaje && (
        <p className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
          {mensaje}
        </p>
      )}

      <RecepcionProveedorPanel
        bandejas={pendientesRecepcion}
        seleccionados={seleccionados}
        onToggle={toggleSeleccion}
        onToggleTodas={toggleTodas}
        onConfirmar={confirmarRecepcion}
      />

      <AccionesFlujoHub />

      {pendientesEntrega.length > 0 && (
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
                    className={cn("text-xs", claseBadgeLogistica(e.estadoLogistica))}
                  >
                    {etiquetaLogisticaLabel(e.estadoLogistica)}
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
    </div>
  )
}
