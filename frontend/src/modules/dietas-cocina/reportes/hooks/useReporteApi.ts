import { useEffect, useRef, useState } from "react"

import { esErrorRed } from "@/lib/esErrorRed"
import { estaOnlineAhora } from "@/hooks/useConectividadRed"
import type { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { reporteViewVacio } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  cargarReporteDesdeCache,
  guardarReporteEnCache,
} from "@/modules/dietas-cocina/lib/reportesCacheStorage"
import { formatearUltimaActualizacionReporte } from "@/modules/dietas-cocina/lib/formatearFechaOperativa"

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
  const [textoActualizacion, setTextoActualizacion] = useState(
    () => formatearUltimaActualizacionReporte(new Date()),
  )
  const filtrosKey = JSON.stringify(filtros)
  const cargarRef = useRef(cargar)
  const mapearRef = useRef(mapear)
  cargarRef.current = cargar
  mapearRef.current = mapear

  useEffect(() => {
    if (!apiActiva) return

    const filtrosCache: FiltrosReporteCache = JSON.parse(filtrosKey)

    if (!estaOnlineAhora()) {
      const cache = cargarReporteDesdeCache(tipo, filtrosCache)
      setReporteApi(cache ?? reporteViewVacio())
      setDesdeCache(Boolean(cache))
      setCargando(false)
      return
    }

    let cancelado = false
    setCargando(true)
    setDesdeCache(false)

    void cargarRef
      .current()
      .then((resp) => {
        if (cancelado) return
        const mapped = mapearRef.current(resp)
        setReporteApi(mapped)
        guardarReporteEnCache(tipo, filtrosCache, mapped)
        setTextoActualizacion(formatearUltimaActualizacionReporte(new Date()))
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
        setTextoActualizacion(formatearUltimaActualizacionReporte(new Date()))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
    // Intencional: cargar/mapear vía ref para no re-disparar el fetch en cada render.
  }, [apiActiva, tipo, filtrosKey])

  return {
    reporteApi,
    cargando,
    desdeCache,
    textoActualizacion: cargando ? "Actualizando…" : textoActualizacion,
  }
}
