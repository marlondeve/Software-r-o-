import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { obtenerTiemposComidaConfig } from "@/modules/dietas-cocina/api/services/parametros.service"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import {
  guardarConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { parametrosToConfig } from "@/modules/dietas-cocina/parametros/lib/tiemposApiBridge"

/**
 * Carga tiempos del API al entrar al módulo y los deja en localStorage
 * para que solicitud/novedades usen la misma ventana que Parámetros.
 */
export function SincronizarConfigTiempos() {
  const apiActiva = usarApiDietasCocina()

  useEffect(() => {
    if (!apiActiva) return

    let cancelado = false
    void obtenerTiemposComidaConfig()
      .then(({ tiempos, modoCarga }) => {
        if (cancelado) return
        const config = parametrosToConfig(
          tiempos,
          mockParametrosTiempos,
          modoCarga,
        )
        guardarConfigTiempos(config)
      })
      .catch(() => {
        // Sin API: se mantienen mocks / storage local.
      })

    return () => {
      cancelado = true
    }
  }, [apiActiva])

  return null
}
