import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  listarConciliacion,
  marcarConciliado,
  marcarPendienteRevision,
  obtenerKpisConciliacion,
} from "@/modules/dietas-cocina/api/services/conciliacion.service"
import { CONCILIACION_FILTROS_UI } from "@/modules/dietas-cocina/config/conciliacion-ui"
import {
  calcularKpisConciliacion,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionFiltros"

export function useConciliacionApi() {
  const apiActiva = usarApiDietasCocina()
  const [filas, setFilas] = useState<FilaConciliacion[]>([])
  const [kpisApi, setKpisApi] = useState<ReturnType<typeof calcularKpisConciliacion>>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [periodo, setPeriodo] = useState("periodo")
  const [proveedor, setProveedor] = useState("proveedor")

  const recargar = useCallback(async () => {
    if (!apiActiva) return
    setCargando(true)
    setError(null)
    try {
      const [lista, kpisRaw] = await Promise.all([
        listarConciliacion({
          busqueda: busqueda || undefined,
          periodo: periodo !== "periodo" ? periodo : undefined,
          proveedor: proveedor !== "proveedor" ? proveedor : undefined,
        }),
        obtenerKpisConciliacion(
          periodo !== "periodo" ? periodo : undefined,
          proveedor !== "proveedor" ? proveedor : undefined,
        ),
      ])
      setFilas(lista)
      setKpisApi(kpisRaw.length > 0 ? kpisRaw : calcularKpisConciliacion(lista))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conciliación")
      setFilas([])
      setKpisApi([])
    } finally {
      setCargando(false)
    }
  }, [apiActiva, busqueda, periodo, proveedor])

  useEffect(() => {
    if (apiActiva) void recargar()
  }, [apiActiva, recargar])

  const kpis = useMemo(
    () => (apiActiva ? kpisApi : calcularKpisConciliacion(filas)),
    [apiActiva, kpisApi, filas],
  )

  const actualizarEstadoFila = useCallback(
    async (id: string, estado: FilaConciliacion["estado"]) => {
      if (!apiActiva) return
      try {
        if (estado === "conciliado-manual") {
          await marcarConciliado(id)
        } else if (estado === "pendiente") {
          await marcarPendienteRevision(id)
        }
        await recargar()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar conciliación")
      }
    },
    [apiActiva, recargar],
  )

  return {
    filas,
    filasFiltradas: filas,
    kpis,
    busqueda,
    setBusqueda,
    numeroFactura,
    setNumeroFactura,
    periodo,
    setPeriodo,
    proveedor,
    setProveedor,
    actualizarEstadoFila,
    filtros: CONCILIACION_FILTROS_UI,
    detalles: {},
    cargando,
    error,
    recargar,
  }
}
