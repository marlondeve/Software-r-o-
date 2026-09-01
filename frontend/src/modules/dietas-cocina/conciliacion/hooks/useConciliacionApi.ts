import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useCallback, useEffect, useState } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  cargarPlanillaCsv,
  exportarConciliacionCsv,
  guardarCantidadesCocina,
  listarConciliacion,
  marcarConciliado,
  marcarPendienteRevision,
  subirFacturaPeriodo,
} from "@/modules/dietas-cocina/api/services/conciliacion.service"
import { EVENTOS_DIETAS_COCINA } from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"
import { useRefetchOnDietasEvento } from "@/modules/dietas-cocina/realtime/useRefetchOnDietasEvento"
import { descargarBlob } from "@/modules/dietas-cocina/lib/descargarBlob"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import {
  rangoUltimosDias,
  type KpiConciliacionUi,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionFiltros"

export function useConciliacionApi() {
  const apiActiva = usarApiDietasCocina()
  const inicial = rangoUltimosDias(30)
  const [filas, setFilas] = useState<FilaConciliacion[]>([])
  const [kpis, setKpis] = useState<KpiConciliacionUi[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardandoCocinaId, setGuardandoCocinaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState("todos")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)

  const recargar = useCallback(async () => {
    if (!apiActiva) return
    setCargando(true)
    setError(null)
    try {
      const lista = await listarConciliacion({
        busqueda: busqueda || undefined,
        desde,
        hasta,
        estado: estado !== "todos" ? estado : undefined,
        numeroFactura: numeroFactura || undefined,
        pageSize: 100,
      })
      setFilas(lista.filas)
      setKpis(lista.kpis ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conciliación")
      setFilas([])
      setKpis([])
    } finally {
      setCargando(false)
    }
  }, [apiActiva, busqueda, desde, hasta, estado, numeroFactura])

  useEffect(() => {
    if (apiActiva) void recargar()
  }, [apiActiva, recargar])

  useRefetchOnDietasEvento(
    [
      EVENTOS_DIETAS_COCINA.ConciliacionActualizada,
      EVENTOS_DIETAS_COCINA.FilaActualizada,
      EVENTOS_DIETAS_COCINA.CensoActualizado,
      EVENTOS_DIETAS_COCINA.OrdenActualizada,
      EVENTOS_DIETAS_COCINA.EtiquetasActualizadas,
    ],
    () => {
      void recargar()
    },
    apiActiva,
  )

  const actualizarEstadoFila = useCallback(
    async (
      id: string,
      nuevo: FilaConciliacion["estado"],
      motivo: string,
      observaciones: string,
    ) => {
      if (!apiActiva) return
      try {
        if (nuevo === "conciliado-manual") {
          await marcarConciliado(id, motivo, observaciones)
        } else {
          await marcarPendienteRevision(id, motivo, observaciones)
        }
        await recargar()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar conciliación")
        throw err
      }
    },
    [apiActiva, recargar],
  )

  const exportar = useCallback(async () => {
    const blob = await exportarConciliacionCsv({
      busqueda: busqueda || undefined,
      desde,
      hasta,
      estado: estado !== "todos" ? estado : undefined,
      numeroFactura: numeroFactura || undefined,
    })
    descargarBlob(blob, `conciliacion-${desde}-${hasta}.csv`)
    demoToast("Conciliación exportada.", "success")
  }, [busqueda, desde, hasta, estado, numeroFactura])

  const cargarPlanilla = useCallback(
    async (archivo: File) => {
      await cargarPlanillaCsv({ archivo, desde, hasta, numeroFactura: numeroFactura || undefined })
      demoToast("Planilla de cocina cargada.", "success")
      await recargar()
    },
    [desde, hasta, numeroFactura, recargar],
  )

  const cargarFactura = useCallback(
    async (archivo: File) => {
      await subirFacturaPeriodo({
        archivo,
        desde,
        hasta,
        numeroFactura: numeroFactura || undefined,
      })
      demoToast("Factura adjunta al periodo.", "success")
      await recargar()
    },
    [desde, hasta, numeroFactura, recargar],
  )

  const guardarCantidadCocina = useCallback(
    async (fila: FilaConciliacion, cantidad: number) => {
      if (!apiActiva) return
      setGuardandoCocinaId(fila.id)
      setError(null)
      try {
        const resultado = await guardarCantidadesCocina({
          desde,
          hasta,
          numeroFactura: numeroFactura || undefined,
          lineas: [
            {
              comida: fila.comida,
              lineaFcr: fila.lineaFcr,
              cantidad,
            },
          ],
        })
        setFilas(resultado.filas)
        const lista = await listarConciliacion({
          desde,
          hasta,
          busqueda: busqueda || undefined,
          estado: estado !== "todos" ? estado : undefined,
          numeroFactura: numeroFactura || undefined,
          pageSize: 100,
        })
        setKpis(lista.kpis ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar cantidad de cocina")
        throw err
      } finally {
        setGuardandoCocinaId(null)
      }
    },
    [apiActiva, busqueda, desde, hasta, estado, numeroFactura],
  )

  return {
    filas,
    filasFiltradas: filas,
    kpis,
    busqueda,
    setBusqueda,
    numeroFactura,
    setNumeroFactura,
    desde,
    setDesde,
    hasta,
    setHasta,
    estado,
    setEstado,
    actualizarEstadoFila,
    cargando,
    error,
    recargar,
    exportar,
    cargarPlanilla,
    cargarFactura,
    guardarCantidadCocina,
    guardandoCocinaId,
  }
}
