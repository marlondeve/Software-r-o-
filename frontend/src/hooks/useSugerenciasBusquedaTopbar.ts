import { useEffect, useState } from "react"

import {
  clasificarBusquedaTopbar,
  normalizarTerminoBusqueda,
} from "@/lib/busquedaTopbar"
import {
  combinarSugerencias,
  filasASugerenciasPaciente,
  pareceBusquedaEtiqueta,
  sugerenciaEtiqueta,
  sugerenciaVerTodos,
  type SugerenciaBusquedaTopbar,
} from "@/lib/sugerenciasBusquedaTopbar"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { buscarDietas } from "@/modules/dietas-cocina/api/services/dietas.service"
import { buscarEtiquetaPorCodigoSafe } from "@/modules/dietas-cocina/api/services/etiquetas.service"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"
import type { ModuloId } from "@/types/module"

const MIN_CARACTERES = 2
const DEBOUNCE_MS = 300

interface UseSugerenciasBusquedaTopbarParams {
  modulo: ModuloId | null
  rol: string | null
  termino: string
  habilitado?: boolean
}

export function useSugerenciasBusquedaTopbar({
  modulo,
  rol,
  termino,
  habilitado = true,
}: UseSugerenciasBusquedaTopbarParams) {
  const apiActiva = usarApiDietasCocina()
  const [sugerencias, setSugerencias] = useState<SugerenciaBusquedaTopbar[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!habilitado || !modulo) {
      setSugerencias([])
      setCargando(false)
      return
    }

    const q = normalizarTerminoBusqueda(termino)
    const esEtiqueta = pareceBusquedaEtiqueta(q)
    const minimo = esEtiqueta ? 1 : MIN_CARACTERES

    if (q.length < minimo) {
      setSugerencias([])
      setCargando(false)
      return
    }

    let cancelado = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setCargando(true)

        try {
          const etiquetaEstatica = esEtiqueta
            ? sugerenciaEtiqueta(q, rol)
            : null

          if (modulo !== "dietas-cocina") {
            const accion = sugerenciaVerTodos(modulo, q, rol)
            if (!cancelado) {
              setSugerencias(accion ? [accion] : [])
            }
            return
          }

          const pacientes: SugerenciaBusquedaTopbar[] = []
          let etiquetaApi = etiquetaEstatica

          if (apiActiva && clasificarBusquedaTopbar(q) === "texto") {
            const filas = await buscarDietas({
              fecha: fechaOperativaHoy(),
              busqueda: q,
            })
            pacientes.push(...filasASugerenciasPaciente(filas, rol))
          }

          if (apiActiva && esEtiqueta) {
            const encontrada = await buscarEtiquetaPorCodigoSafe(q)
            if (encontrada) {
              etiquetaApi = sugerenciaEtiqueta(q, rol, encontrada)
            }
          }

          const accion = sugerenciaVerTodos(modulo, q, rol)
          const resultado = combinarSugerencias(
            etiquetaApi ? [etiquetaApi] : [],
            pacientes,
            accion ? [accion] : [],
          )

          if (!cancelado) setSugerencias(resultado)
        } catch {
          if (!cancelado) {
            const fallback = combinarSugerencias(
              esEtiqueta && sugerenciaEtiqueta(q, rol)
                ? [sugerenciaEtiqueta(q, rol)!]
                : [],
              sugerenciaVerTodos(modulo, q, rol)
                ? [sugerenciaVerTodos(modulo, q, rol)!]
                : [],
            )
            setSugerencias(fallback)
          }
        } finally {
          if (!cancelado) setCargando(false)
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      cancelado = true
      window.clearTimeout(timer)
    }
  }, [apiActiva, habilitado, modulo, rol, termino])

  const q = normalizarTerminoBusqueda(termino)
  const minimo = pareceBusquedaEtiqueta(q) ? 1 : MIN_CARACTERES
  const panelVisible = habilitado && q.length >= minimo

  return {
    sugerencias,
    cargando,
    panelVisible,
    haySugerencias: sugerencias.length > 0,
  }
}
