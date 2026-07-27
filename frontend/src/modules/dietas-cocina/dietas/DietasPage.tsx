import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"
import { Info, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
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
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { formatearFechaReferenciaDietas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { buscarDietas, obtenerDietasPaciente } from "@/modules/dietas-cocina/api/services/dietas.service"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"
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
type TipoSheetDieta = "solicitud" | "detalle" | "novedad"

interface SheetDietaState {
  tipo: TipoSheetDieta
  filaId: string
}

import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

function formatearSolicitadoEn(): string {
  return `Hoy, ${formatearHoraDesdeFecha()}`
}

export function DietasPage() {
  const { usuario } = useAuth()
  const {
    filas,
    ultimaSincronizacion,
    meta: data,
    sincronizandoCenso,
    errorSincronizacion,
    actualizarFila,
    setFilas,
    sincronizarCenso,
    asignarConsistenciaMasiva,
    guardarSolicitud,
    confirmarDietaApi,
    confirmarMasivoApi,
    cancelarDietaApi,
    registrarNovedadApi,
    obtenerHistorialApi,
    obtenerDetalleApi,
  } = useDietasOperativas()
  const { crearOrdenDesdeDieta, cancelarOrdenCocina } = useCicloBandejas()
  const apiActiva = usarApiDietasCocina()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : data.comidaActiva,
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
  const [filasBusquedaApi, setFilasBusquedaApi] = useState<FilaDieta[] | null>(null)
  const [buscandoApi, setBuscandoApi] = useState(false)
  const [errorBusquedaApi, setErrorBusquedaApi] = useState<string | null>(null)

  const filtrosApiActivos =
    apiActiva &&
    (servicio !== "todos" ||
      estado !== "todos" ||
      busqueda.trim().length >= 2)

  useEffect(() => {
    if (!filtrosApiActivos) {
      setFilasBusquedaApi(null)
      setErrorBusquedaApi(null)
      setBuscandoApi(false)
      return
    }

    const controlador = new AbortController()
    const timer = window.setTimeout(() => {
      setBuscandoApi(true)
      setErrorBusquedaApi(null)
      void buscarDietas({
        fecha: fechaOperativaHoy(),
        comida: comidaActiva,
        servicio: servicio !== "todos" ? servicio : undefined,
        estado: estado !== "todos" ? estado : undefined,
        paciente: busqueda.trim() || undefined,
      })
        .then((resultado) => {
          if (!controlador.signal.aborted) setFilasBusquedaApi(resultado)
        })
        .catch((error) => {
          if (!controlador.signal.aborted) {
            setFilasBusquedaApi([])
            setErrorBusquedaApi(
              error instanceof Error
                ? error.message
                : "No se pudo buscar dietas en el servidor.",
            )
          }
        })
        .finally(() => {
          if (!controlador.signal.aborted) setBuscandoApi(false)
        })
    }, 350)

    return () => {
      controlador.abort()
      window.clearTimeout(timer)
    }
  }, [
    filtrosApiActivos,
    comidaActiva,
    servicio,
    estado,
    busqueda,
    apiActiva,
  ])

  const filasBase = filtrosApiActivos ? (filasBusquedaApi ?? []) : filas

  const filasFiltradas = useMemo(() => {
    return filasBase.filter((fila) => {
      if (fila.comida !== comidaActiva) return false
      if (!filtrosApiActivos && !filaCoincideBusqueda(fila, busqueda)) return false
      if (!filtrosApiActivos && servicio !== "todos" && fila.servicio !== servicio) {
        return false
      }
      if (!filtrosApiActivos && estado !== "todos" && fila.estado !== estado) {
        return false
      }
      if (soloPendientes && !ESTADOS_PENDIENTES.includes(fila.estado)) {
        return false
      }
      return true
    })
  }, [
    filasBase,
    comidaActiva,
    busqueda,
    servicio,
    estado,
    soloPendientes,
    filtrosApiActivos,
  ])

  const kpis = useMemo(
    () => calcularKpisDietas(filas, comidaActiva),
    [filas, comidaActiva],
  )

  const serviciosDisponibles = useMemo(() => {
    if (!usarApiDietasCocina()) {
      return data.servicios
    }
    const desdeFilas = filas.map((fila) => fila.servicio)
    return [...new Set(desdeFilas)].sort((a, b) => a.localeCompare(b, "es"))
  }, [filas, data.servicios])

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

  function limpiarFiltros() {
    setBusqueda("")
    setServicio("todos")
    setEstado("todos")
    setSoloPendientes(false)
  }

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
    if (apiActiva) {
      void sincronizarCenso(id).catch(() => {})
    }
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
    if (apiActiva) return fila.ordenCocinaId ?? null
    if (!fila.tipoDieta || !fila.consistencia) return null
    if (fila.ordenCocinaId) return fila.ordenCocinaId
    return crearOrdenDesdeDieta({
      id: fila.id,
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
    if (apiActiva) {
      void confirmarDietaApi(fila.id)
        .then((actualizada) => {
          demoToast(`Dieta de ${actualizada.paciente} confirmada.`, "success")
          setSheet(null)
        })
        .catch((error) => {
          demoToast(
            error instanceof Error ? error.message : "No se pudo confirmar la dieta.",
            "error",
          )
        })
      return
    }

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
    const ids = idsSeleccionados()
    if (apiActiva) {
      void confirmarMasivoApi(ids, usuario?.nombre ?? usuario?.email ?? "Usuario")
        .then(() => {
          demoToast(`${ids.length} dieta(s) confirmada(s).`, "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error ? error.message : "No se pudo confirmar la selección.",
            "error",
          )
        })
      return
    }

    const idsSet = new Set(ids)
    let confirmadas = 0
    let enviadasCocina = 0
    setFilas((prev) =>
      prev.map((fila) => {
        if (!idsSet.has(fila.id) || fila.estado !== "guardado") return fila
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
            {formatearFechaReferenciaDietas()} · Última sincronización:{" "}
            {ultimaSincronizacion}
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sincronizandoCenso}
            onClick={async () => {
              try {
                const total = await sincronizarCenso(comidaActiva)
                if (usarApiDietasCocina()) {
                  demoToast(
                    total > 0
                      ? `Censo actualizado: ${total} paciente(s) hospitalizado(s).`
                      : "No hay pacientes hospitalizados en el censo del HIS.",
                    total > 0 ? "success" : "warning",
                  )
                } else {
                  demoToast(
                    total > 0
                      ? `Censo actualizado: ${total} paciente(s) nuevo(s) incorporado(s).`
                      : "Censo ya estaba al día. No hay ingresos nuevos.",
                    total > 0 ? "success" : "info",
                  )
                }
              } catch (error) {
                demoToast(
                  error instanceof Error
                    ? error.message
                    : "Error al sincronizar el censo hospitalario.",
                  "error",
                )
              }
            }}
          >
            <RefreshCw
              data-icon="inline-start"
              className={sincronizandoCenso ? "animate-spin" : undefined}
            />
            {sincronizandoCenso ? "Sincronizando..." : "Actualizar censo"}
          </Button>
        }
      />

      {apiActiva && errorSincronizacion && (
        <Alert variant="destructive">
          <AlertDescription>{errorSincronizacion}</AlertDescription>
        </Alert>
      )}

      {apiActiva && sincronizandoCenso && filas.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Cargando censo desde el API…
        </div>
      ) : (
        <>
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
        servicios={serviciosDisponibles}
        onBusquedaChange={setBusqueda}
        onServicioChange={setServicio}
        onEstadoChange={setEstado}
        onSoloPendientesChange={setSoloPendientes}
        onLimpiar={limpiarFiltros}
      />

      {apiActiva && errorBusquedaApi && (
        <Alert variant="destructive">
          <AlertDescription>{errorBusquedaApi}</AlertDescription>
        </Alert>
      )}

      {apiActiva && buscandoApi && (
        <p className="text-sm text-muted-foreground">Buscando dietas en el servidor…</p>
      )}

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
          if (apiActiva) {
            void cancelarDietaApi(fila.id, { motivo, justificacion })
              .then(async () => {
                if (fila.ordenCocinaId) {
                  await cancelarOrdenCocina(fila.ordenCocinaId, justificacion)
                }
                demoToast(`Dieta de ${fila.paciente} cancelada.`, "success")
                setCancelarAbierto(false)
                setFilaCancelarId(null)
              })
              .catch((error) => {
                demoToast(
                  error instanceof Error ? error.message : "No se pudo cancelar la dieta.",
                  "error",
                )
              })
            return
          }
          if (fila.ordenCocinaId) {
            void cancelarOrdenCocina(fila.ordenCocinaId, justificacion)
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
          if (apiActiva) {
            void guardarSolicitud(fila.id, {
              tipoDieta: datos.tipoDieta,
              consistencia: datos.consistencia,
              observaciones: datos.observaciones,
              pacienteAislado: datos.pacienteAislado,
              observacionAislamiento: datos.observacionAislamiento,
              alergico: datos.alergico,
              alergias: datos.alergias,
            })
              .then(() => {
                demoToast(`Solicitud de ${fila.paciente} guardada.`, "success")
                setSheet(null)
              })
              .catch((error) => {
                demoToast(
                  error instanceof Error ? error.message : "No se pudo guardar la solicitud.",
                  "error",
                )
              })
            return
          }
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
        cargarHistorial={apiActiva ? obtenerHistorialApi : undefined}
        cargarDetalle={apiActiva ? obtenerDetalleApi : undefined}
        cargarDietasPaciente={apiActiva ? obtenerDietasPaciente : undefined}
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
          if (apiActiva) {
            void registrarNovedadApi(fila.id, {
              comida: datos.comida,
              tipoDieta: datos.tipoDieta,
              consistencia: datos.consistencia,
              observaciones: datos.observaciones,
              pacienteAislado: datos.pacienteAislado,
              observacionAislamiento: datos.observacionAislamiento,
              alergico: datos.alergico,
              alergias: datos.alergias,
              motivo: datos.motivo,
            })
              .then((actualizada) => {
                demoToast(`Novedad registrada para ${actualizada.paciente}.`, "success")
                setSheet(null)
              })
              .catch((error) => {
                demoToast(
                  error instanceof Error ? error.message : "No se pudo registrar la novedad.",
                  "error",
                )
              })
            return
          }
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
        </>
      )}
    </div>
  )
}
