import { useEffect } from "react"

import {
  type TipoEventoDietasCocina,
  suscribirEventosDietasCocina,
} from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"

/** Recarga la pantalla abierta cuando llega un evento SignalR. */
export function useRefetchOnDietasEvento(
  tipos: TipoEventoDietasCocina[],
  recargar: () => void,
  activo = true,
): void {
  const clave = tipos.join(",")
  useEffect(() => {
    if (!activo) return
    const setTipos = new Set(clave.split(","))
    return suscribirEventosDietasCocina((evento) => {
      if (setTipos.has(evento.tipo)) recargar()
    })
  }, [activo, clave, recargar])
}
