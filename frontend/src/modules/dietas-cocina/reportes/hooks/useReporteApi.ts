import { useEffect, useState } from "react"

import { esErrorRed } from "@/lib/esErrorRed"
import { estaOnlineAhora } from "@/hooks/useConectividadRed"
import type { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { reporteViewVacio } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  cargarReporteDesdeCache,
  guardarReporteEnCache,
} from "@/modules/dietas-cocina/lib/reportesCacheStorage"

type ReporteView = ReturnType<typeof mapReporteDto>

interface FiltrosReporteCache extends Record<string, string | undefined> {
  desde?: string
  hasta?: string
  servicio?: string
  horario?: string
}

interface UseReporteApiOptions {
  tipo: "clinico" | "produccion"
  apiActiva: boolean
  filtros: FiltrosReporteCache
  cargar: () => Promise<unknown>
  mapear: (resp: unknown) => ReporteView
}

export function useReporteApi({
  tipo,
  apiActiva,
  filtros,
  cargar,
  mapear,
}: UseReporteApiOptions) {
  const [reporteApi, setReporteApi] = useState<ReporteView | null>(null)
  const [cargando, setCargando] = useState(false)
  const [desdeCache, setDesdeCache] = useState(false)
  const filtrosKey = JSON.stringify(filtros)

  useEffect(() => {
    if (!apiActiva) return

    const filtrosCache: FiltrosReporteCache = JSON.parse(filtrosKey)

    if (!estaOnlineAhora()) {
      const cache = cargarReporteDesdeCache(tipo, filtrosCache)
      setReporteApi(cache ?? reporteViewVacio())
      setDesdeCache(Boolean(cache))
      return
    }

    let cancelado = false
    setCargando(true)
    setDesdeCache(false)

    void cargar()
      .then((resp) => {
        if (cancelado) return
        const mapped = mapear(resp)
        setReporteApi(mapped)
        guardarReporteEnCache(tipo, filtrosCache, mapped)
      })
      .catch((error) => {
        if (cancelado) return
        const cache = cargarReporteDesdeCache(tipo, filtrosCache)
        if (esErrorRed(error) && cache) {
          setReporteApi(cache)
          setDesdeCache(true)
        } else {
          setReporteApi(reporteViewVacio())
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [apiActiva, tipo, filtrosKey, cargar, mapear])

  return { reporteApi, cargando, desdeCache }
}
