import { useEffect, useState } from "react"

import { CONFIG_TIEMOS_CAMBIO_EVENTO } from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"

const TICK_VENTANA_MS = 60_000

/**
 * Reloj para ventanas operativas sin re-renderizar cada segundo.
 * Actualiza cada minuto y al cambiar parámetros de tiempos.
 */
export function useRelojVentanaOperativa(): Date {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const actualizar = () => setAhora(new Date())
    actualizar()
    const intervalo = window.setInterval(actualizar, TICK_VENTANA_MS)
    window.addEventListener(CONFIG_TIEMOS_CAMBIO_EVENTO, actualizar)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener(CONFIG_TIEMOS_CAMBIO_EVENTO, actualizar)
    }
  }, [])

  return ahora
}
