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
import { TAMANO_PAGINA_TABLA } from "@/lib/tamanoPaginaTabla"

export function useConciliacionApi() {
  const apiActiva = usarApiDietasCocina()
  const [filas, setFilas] = useState<FilaConciliacion[]>([])
  const [totalFilas, setTotalFilas] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
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
          page: paginaActual,
          pageSize: TAMANO_PAGINA_TABLA,
        }),
        obtenerKpisConciliacion(
          periodo !== "periodo" ? periodo : undefined,
          proveedor !== "proveedor" ? proveedor : undefined,
        ),
      ])
      setFilas(lista.filas)
      setTotalFilas(lista.meta?.total ?? lista.filas.length)
      setKpisApi(kpisRaw.length > 0 ? kpisRaw : calcularKpisConciliacion(lista.filas))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conciliación")
      setFilas([])
      setTotalFilas(0)
      setKpisApi([])
    } finally {
      setCargando(false)
    }
  }, [apiActiva, busqueda, periodo, proveedor, paginaActual])

  useEffect(() => {
    if (apiActiva) void recargar()
  }, [apiActiva, recargar])

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, periodo, proveedor, numeroFactura])

  const totalPaginas = Math.max(1, Math.ceil(totalFilas / TAMANO_PAGINA_TABLA))
  const paginaDesde =
    totalFilas === 0 ? 0 : (paginaActual - 1) * TAMANO_PAGINA_TABLA + 1
  const paginaHasta = Math.min(paginaActual * TAMANO_PAGINA_TABLA, totalFilas)

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas)
    }
  }, [paginaActual, totalPaginas])

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
    paginaActual,
    setPaginaActual,
    totalPaginas,
    paginaDesde,
    paginaHasta,
    totalFilas,
    paginacionServidor: true,
  }
}
