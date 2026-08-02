import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"

/** Reintenta la cola outbox de bandejas al recuperar conexión. */
export function SincronizarBandejasPendientes() {
  const apiActiva = usarApiDietasCocina()
  const {
    estaOnline,
    hidrato,
    cantidadPendientesSync,
    sincronizarBandejasPendientes,
  } = useCicloBandejas()

  useEffect(() => {
    if (!apiActiva || !estaOnline || !hidrato || cantidadPendientesSync === 0) {
      return
    }
    void sincronizarBandejasPendientes()
  }, [
    apiActiva,
    estaOnline,
    hidrato,
    cantidadPendientesSync,
    sincronizarBandejasPendientes,
  ])

  return null
}
