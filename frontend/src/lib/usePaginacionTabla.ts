import { useEffect, useMemo, useState } from "react"

import { TAMANO_PAGINA_TABLA } from "@/lib/tamanoPaginaTabla"

interface UsePaginacionTablaOptions {
  tamanoPagina?: number
  /** Cambia cuando filtros u orden cambian para volver a la página 1. */
  resetKey?: string | number
}

export function usePaginacionTabla<T>(
  items: T[],
  options: UsePaginacionTablaOptions = {},
) {
  const tamanoPagina = options.tamanoPagina ?? TAMANO_PAGINA_TABLA
  const [paginaActual, setPaginaActual] = useState(1)

  const total = items.length
  const totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina))

  useEffect(() => {
    setPaginaActual(1)
  }, [options.resetKey])

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas)
    }
  }, [paginaActual, totalPaginas])

  const filasPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * tamanoPagina
    return items.slice(inicio, inicio + tamanoPagina)
  }, [items, paginaActual, tamanoPagina])

  const paginaDesde = total === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1
  const paginaHasta = Math.min(paginaActual * tamanoPagina, total)

  return {
    paginaActual,
    setPaginaActual,
    totalPaginas,
    paginaDesde,
    paginaHasta,
    total,
    filasPagina,
    tamanoPagina,
  }
}
