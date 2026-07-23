import { useMemo, useState } from "react"
import { Info, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { DietasAsignarConsistenciaDialog } from "@/modules/dietas-cocina/dietas/components/DietasAsignarConsistenciaDialog"
import { DietasBarraSeleccion } from "@/modules/dietas-cocina/dietas/components/DietasBarraSeleccion"
import { DietasCancelarDialog } from "@/modules/dietas-cocina/dietas/components/DietasCancelarDialog"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { DietasDetalleSheet } from "@/modules/dietas-cocina/dietas/components/DietasDetalleSheet"
import { DietasFiltros } from "@/modules/dietas-cocina/dietas/components/DietasFiltros"
import { DietasKpiGrid } from "@/modules/dietas-cocina/dietas/components/DietasKpiGrid"
import { DietasNovedadSheet } from "@/modules/dietas-cocina/dietas/components/DietasNovedadSheet"
import { DietasSolicitudSheet } from "@/modules/dietas-cocina/dietas/components/DietasSolicitudSheet"
import { DietasTabla } from "@/modules/dietas-cocina/dietas/components/DietasTabla"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  calcularKpisDietas,
  ESTADOS_PENDIENTES,
  filaCoincideBusqueda,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import {
  demoToast,
  descargarArchivoDemo,
} from "@/modules/dietas-cocina/lib/demoFeedback"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

type TipoSheetDieta = "solicitud" | "detalle" | "novedad"

interface SheetDietaState {
  tipo: TipoSheetDieta
  filaId: string
}

function formatearSolicitadoEn(): string {
  const ahora = new Date()
  return `Hoy, ${ahora.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

export function DietasPage() {
  const {
    filas,
    ultimaSincronizacion,
    meta: data,
    actualizarFila,
    setFilas,
    sincronizarCenso,
    asignarConsistenciaMasiva,
  } = useDietasOperativas()
  const { crearOrdenDesdeDieta, cancelarOrdenCocina } = useCicloBandejas()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(
    data.comidaActiva,
  )
  const [busqueda, setBusqueda] = useState("")
  const [servicio, setServicio] = useState("todos")
  const [estado, setEstado] = useState("todos")
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [sheet, setSheet] = useState<SheetDietaState | null>(null)
  const [cancelarAbierto, setCancelarAbierto] = useState(false)
  const [filaCancelarId, setFilaCancelarId] = useState<string | null>(null)
  const [consistenciaAbierto, setConsistenciaAbierto] = useState(false)

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => {
      if (fila.comida !== comidaActiva) return false
      if (!filaCoincideBusqueda(fila, busqueda)) return false
      if (servicio !== "todos" && fila.servicio !== servicio) return false
      if (estado !== "todos" && fila.estado !== estado) return false
      if (soloPendientes && !ESTADOS_PENDIENTES.includes(fila.estado)) {
        return false
      }
      return true
    })
  }, [filas, comidaActiva, busqueda, servicio, estado, soloPendientes])

  const kpis = useMemo(
    () => calcularKpisDietas(filas, comidaActiva),
    [filas, comidaActiva],
  )

  const idsVisibles = useMemo(
    () => new Set(filasFiltradas.map((fila) => fila.id)),
    [filasFiltradas],
  )

  const seleccionadosVisibles = useMemo(
    () =>
      [...seleccionados].filter((id) => idsVisibles.has(id)).length,
    [seleccionados, idsVisibles],
  )

  const filaActiva = useMemo(() => {
    if (!sheet) return null
    return filas.find((fila) => fila.id === sheet.filaId) ?? null
  }, [sheet, filas])

  const filaCancelar = useMemo(() => {
    if (!filaCancelarId) return null
    return filas.find((fila) => fila.id === filaCancelarId) ?? null
  }, [filaCancelarId, filas])

  function idsSeleccionados(): string[] {
    return [...seleccionados].filter((id) => idsVisibles.has(id))
  }

  function actualizarFila(id: string, cambios: Partial<FilaDieta>) {
    setFilas((prev) =>
      prev.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)),
    )
  }

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

  function abrirSheet(tipo: TipoSheetDieta, fila: FilaDieta) {
    setSheet({ tipo, filaId: fila.id })
  }

  function cerrarSheet(open: boolean) {
    if (!open) setSheet(null)
  }

  function cambiarSheetDesdeDetalle(tipo: TipoSheetDieta, fila: FilaDieta) {
    setSheet({ tipo, filaId: fila.id })
  }

  function abrirCancelar(fila: FilaDieta) {
    setFilaCancelarId(fila.id)
    setCancelarAbierto(true)
  }

  function enviarDietaACocina(fila: FilaDieta): string | null {
    if (!fila.tipoDieta || !fila.consistencia) return null
    if (fila.ordenCocinaId) return fila.ordenCocinaId
    return crearOrdenDesdeDieta({
      pacienteId: fila.pacienteId,
      paciente: fila.paciente,
      edad: fila.edad,
      pabellon: fila.pabellon,
      habitacion: fila.habitacion,
      tipoDieta: fila.tipoDieta,
      consistencia: fila.consistencia,
      comida: fila.comida,
      aislado: fila.aislado ?? fila.aislamiento !== "Ninguno",
      alergias: fila.alergico ? fila.alergias.split(",").map((a) => a.trim()) : [],
      observaciones: fila.observaciones,
    })
  }

  function confirmarDieta(fila: FilaDieta) {
    const ordenId = enviarDietaACocina(fila)
    actualizarFila(fila.id, {
      estado: "confirmada",
      ...(ordenId ? { ordenCocinaId: ordenId } : {}),
    })
    if (ordenId) {
      demoToast(`Dieta de ${fila.paciente} confirmada y enviada a cocina.`)
    } else {
      demoToast(
        `Dieta de ${fila.paciente} confirmada. Complete tipo y consistencia para crear orden en cocina.`,
      )
    }
    setSheet(null)
  }

  function exportarSeleccionados() {
    const ids = idsSeleccionados()
    const filasExport = filas.filter((fila) => ids.includes(fila.id))
    const csv = [
      "Paciente,Servicio,Habitación,Dieta,Consistencia,Estado",
      ...filasExport.map(
        (fila) =>
          `${fila.paciente},${fila.servicio},${fila.habitacion},${fila.tipoDieta ?? ""},${fila.consistencia ?? ""},${fila.estado}`,
      ),
    ].join("\n")
    descargarArchivoDemo(
      csv,
      `dietas-${comidaActiva}.csv`,
      "text/csv;charset=utf-8",
    )
  }

  function confirmarSeleccionados() {
    const ids = new Set(idsSeleccionados())
    let confirmadas = 0
    let enviadasCocina = 0
    setFilas((prev) =>
      prev.map((fila) => {
        if (!ids.has(fila.id) || fila.estado !== "guardado") return fila
        confirmadas += 1
        const ordenId = enviarDietaACocina(fila)
        if (ordenId) enviadasCocina += 1
        return {
          ...fila,
          estado: "confirmada" as const,
          ...(ordenId ? { ordenCocinaId: ordenId } : {}),
        }
      }),
    )
    demoToast(
      confirmadas > 0
        ? `${confirmadas} dieta(s) confirmada(s). ${enviadasCocina} enviada(s) a cocina.`
        : "No hay dietas en estado guardado entre las seleccionadas.",
    )
  }

  return (
    <div className="space-y-5 pb-20">
      <DashboardPageHeader
        title="Gestión diaria de dietas"
        subtitle={
          <>
            {data.fecha} · Última sincronización: {ultimaSincronizacion}
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const agregados = sincronizarCenso()
              demoToast(
                agregados > 0
                  ? `Censo actualizado: ${agregados} paciente(s) nuevo(s) incorporado(s).`
                  : "Censo ya estaba al día. No hay ingresos nuevos.",
              )
            }}
          >
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

      <DietasKpiGrid kpis={kpis} />

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
        onAbrirSolicitud={(fila) => abrirSheet("solicitud", fila)}
        onAbrirDetalle={(fila) => abrirSheet("detalle", fila)}
        onRegistrarNovedad={(fila) => abrirSheet("novedad", fila)}
        onCancelarDieta={abrirCancelar}
      />

      <DietasCancelarDialog
        open={cancelarAbierto}
        onOpenChange={setCancelarAbierto}
        fila={filaCancelar}
        comidaActiva={comidaActiva}
        comidas={data.comidas}
        onConfirmar={(fila, motivo, justificacion) => {
          if (fila.ordenCocinaId) {
            cancelarOrdenCocina(fila.ordenCocinaId)
          }
          actualizarFila(fila.id, {
            estado: "cancelada",
            observaciones: `[${motivo}] ${justificacion}`,
          })
          demoToast(`Dieta de ${fila.paciente} cancelada y orden de cocina anulada si existía.`)
          setCancelarAbierto(false)
          setFilaCancelarId(null)
        }}
      />

      <DietasSolicitudSheet
        open={sheet?.tipo === "solicitud"}
        onOpenChange={cerrarSheet}
        fila={filaActiva}
        comidaInicial={comidaActiva}
        comidas={data.comidas}
        tiposDieta={data.tiposDieta}
        consistencias={data.consistencias}
        cierreVentanaMinutos={data.cierreVentanaMinutos}
        onGuardar={(fila, datos) => {
          actualizarFila(fila.id, {
            comida: datos.comida,
            tipoDieta: datos.tipoDieta,
            consistencia: datos.consistencia,
            aislado: datos.pacienteAislado,
            alergico: datos.alergico,
            alergias: datos.alergias,
            observacionAislamiento: datos.observacionAislamiento,
            observaciones: datos.observaciones,
            estado: "guardado",
            solicitadoPor: "Usuario demo",
            solicitadoEn: formatearSolicitadoEn(),
          })
          demoToast(`Solicitud de ${fila.paciente} guardada (demo).`)
          setSheet(null)
        }}
      />

      <DietasDetalleSheet
        open={sheet?.tipo === "detalle"}
        onOpenChange={cerrarSheet}
        fila={filaActiva}
        onEditar={(fila) => cambiarSheetDesdeDetalle("solicitud", fila)}
        onConfirmar={confirmarDieta}
      />

      <DietasNovedadSheet
        open={sheet?.tipo === "novedad"}
        onOpenChange={cerrarSheet}
        fila={filaActiva}
        comidaActiva={comidaActiva}
        comidas={data.comidas}
        tiposDieta={data.tiposDieta}
        consistencias={data.consistencias}
        cierreVentanaMinutos={data.cierreVentanaMinutos}
        onConfirmar={(fila, datos) => {
          const ordenId = enviarDietaACocina({
            ...fila,
            comida: datos.comida,
            tipoDieta: datos.tipoDieta,
            consistencia: datos.consistencia,
            aislado: datos.pacienteAislado,
            alergico: datos.alergico,
            alergias: datos.alergias,
            observacionAislamiento: datos.observacionAislamiento,
            observaciones: datos.observaciones,
          })
          actualizarFila(fila.id, {
            comida: datos.comida,
            tipoDieta: datos.tipoDieta,
            consistencia: datos.consistencia,
            aislado: datos.pacienteAislado,
            alergico: datos.alergico,
            alergias: datos.alergias,
            observacionAislamiento: datos.observacionAislamiento,
            observaciones: datos.observaciones,
            estado: "confirmada",
            ...(ordenId ? { ordenCocinaId: ordenId } : {}),
          })
          demoToast(
            ordenId
              ? `Novedad registrada y enviada a cocina para ${fila.paciente}.`
              : `Novedad registrada para ${fila.paciente}.`,
          )
          setSheet(null)
        }}
      />

      <DietasBarraSeleccion
        cantidad={seleccionadosVisibles}
        visible={seleccionadosVisibles > 0}
        onExportar={exportarSeleccionados}
        onAsignarConsistencia={() => setConsistenciaAbierto(true)}
        onConfirmarSeleccionados={confirmarSeleccionados}
      />

      <DietasAsignarConsistenciaDialog
        open={consistenciaAbierto}
        onOpenChange={setConsistenciaAbierto}
        cantidad={seleccionadosVisibles}
        consistencias={data.consistencias}
        onConfirmar={(consistencia) => {
          const actualizados = asignarConsistenciaMasiva(
            idsSeleccionados(),
            consistencia,
          )
          demoToast(
            actualizados > 0
              ? `Consistencia "${consistencia}" asignada a ${actualizados} paciente(s).`
              : "No se actualizó ningún paciente.",
          )
        }}
      />
    </div>
  )
}
