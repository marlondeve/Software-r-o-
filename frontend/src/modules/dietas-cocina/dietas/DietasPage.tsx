import { useMemo, useState } from "react"
import { Info, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { DietasBarraSeleccion } from "@/modules/dietas-cocina/dietas/components/DietasBarraSeleccion"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { DietasFiltros } from "@/modules/dietas-cocina/dietas/components/DietasFiltros"
import { DietasKpiGrid } from "@/modules/dietas-cocina/dietas/components/DietasKpiGrid"
import { DietasSolicitudSheet } from "@/modules/dietas-cocina/dietas/components/DietasSolicitudSheet"
import { DietasTabla } from "@/modules/dietas-cocina/dietas/components/DietasTabla"
import { mockDietas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  ESTADOS_PENDIENTES,
  filaCoincideBusqueda,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export function DietasPage() {
  const data = mockDietas
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(
    data.comidaActiva,
  )
  const [busqueda, setBusqueda] = useState("")
  const [servicio, setServicio] = useState("todos")
  const [estado, setEstado] = useState("todos")
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSolicitud, setFilaSolicitud] = useState<FilaDieta | null>(null)

  const filasFiltradas = useMemo(() => {
    return data.filas.filter((fila) => {
      if (fila.comida !== comidaActiva) return false
      if (!filaCoincideBusqueda(fila, busqueda)) return false
      if (servicio !== "todos" && fila.servicio !== servicio) return false
      if (estado !== "todos" && fila.estado !== estado) return false
      if (soloPendientes && !ESTADOS_PENDIENTES.includes(fila.estado)) {
        return false
      }
      return true
    })
  }, [data.filas, comidaActiva, busqueda, servicio, estado, soloPendientes])

  const idsVisibles = useMemo(
    () => new Set(filasFiltradas.map((fila) => fila.id)),
    [filasFiltradas],
  )

  const seleccionadosVisibles = useMemo(
    () =>
      [...seleccionados].filter((id) => idsVisibles.has(id)).length,
    [seleccionados, idsVisibles],
  )

  function limpiarFiltros() {
    setBusqueda("")
    setServicio("todos")
    setEstado("todos")
    setSoloPendientes(false)
  }

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
  }

  function toggleFila(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleTodas(checked: boolean) {
    if (checked) {
      setSeleccionados(new Set(filasFiltradas.map((fila) => fila.id)))
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev)
        for (const fila of filasFiltradas) next.delete(fila.id)
        return next
      })
    }
  }

  function abrirSolicitud(fila: FilaDieta) {
    setFilaSolicitud(fila)
    setSheetAbierto(true)
  }

  return (
    <div className="space-y-5 pb-20">
      <DashboardPageHeader
        title="Gestión diaria de dietas"
        subtitle={
          <>
            {data.fecha} · Última sincronización: {data.ultimaSincronizacion}
          </>
        }
        actions={
          <Button type="button" variant="outline" size="sm">
            <RefreshCw data-icon="inline-start" />
            Actualizar censo
          </Button>
        }
      />

      <DietasComidaTabs
        comidas={data.comidas}
        comidaActiva={comidaActiva}
        onComidaChange={cambiarComida}
      />

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="text-primary" />
        <AlertDescription className="text-foreground/80">
          {data.avisoClinico}
        </AlertDescription>
      </Alert>

      <DietasKpiGrid kpis={data.kpis} />

      <DietasFiltros
        busqueda={busqueda}
        servicio={servicio}
        estado={estado}
        soloPendientes={soloPendientes}
        servicios={data.servicios}
        onBusquedaChange={setBusqueda}
        onServicioChange={setServicio}
        onEstadoChange={setEstado}
        onSoloPendientesChange={setSoloPendientes}
        onLimpiar={limpiarFiltros}
      />

      <DietasTabla
        filas={filasFiltradas}
        seleccionados={seleccionados}
        onToggleFila={toggleFila}
        onToggleTodas={toggleTodas}
        onAbrirSolicitud={abrirSolicitud}
      />

      <DietasSolicitudSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        fila={filaSolicitud}
        comidaInicial={comidaActiva}
        comidas={data.comidas}
        tiposDieta={data.tiposDieta}
        consistencias={data.consistencias}
        cierreVentanaMinutos={data.cierreVentanaMinutos}
      />

      <DietasBarraSeleccion
        cantidad={seleccionadosVisibles}
        visible={seleccionadosVisibles > 0}
      />
    </div>
  )
}
