import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"

const INTERVALO_SINCRONIZACION_MS = 15_000

/**
 * Mantiene las órdenes de cocina alineadas con el censo de dietas en modo API,
 * sin depender del botón de actualizar manual.
 */
export function SincronizarCocinaDesdeDietas() {
  const apiActiva = usarApiDietasCocina()
  const { filas, sincronizarCenso } = useDietasOperativas()
  const { sincronizarOrdenesDesdeFilas, rehidratarDesdeStorage, etiquetas } =
    useCicloBandejas()

  useEffect(() => {
    if (!apiActiva) return
    sincronizarOrdenesDesdeFilas(filas)
  }, [filas, etiquetas, apiActiva, sincronizarOrdenesDesdeFilas])

  useEffect(() => {
    if (!apiActiva) return

    const sincronizar = () => {
      if (document.visibilityState !== "visible") return
      void sincronizarCenso(obtenerComidaActivaOperativa()).catch(() => {})
      rehidratarDesdeStorage()
    }

    const intervalo = window.setInterval(sincronizar, INTERVALO_SINCRONIZACION_MS)
    window.addEventListener("focus", sincronizar)

    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener("focus", sincronizar)
    }
  }, [apiActiva, rehidratarDesdeStorage, sincronizarCenso])

  return null
}
