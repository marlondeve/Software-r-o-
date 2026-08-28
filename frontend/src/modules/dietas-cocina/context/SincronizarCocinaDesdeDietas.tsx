import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"

/**
 * Mantiene las órdenes de cocina alineadas con las filas de dietas.
 * El refresco de red lo hace SignalR (SincronizarRealtimeDietasCocina).
 */
export function SincronizarCocinaDesdeDietas() {
  const apiActiva = usarApiDietasCocina()
  const { filas } = useDietasOperativas()
  const { sincronizarOrdenesDesdeFilas } = useCicloBandejas()

  useEffect(() => {
    if (!apiActiva) return
    sincronizarOrdenesDesdeFilas(filas)
  }, [filas, apiActiva, sincronizarOrdenesDesdeFilas])

  return null
}
