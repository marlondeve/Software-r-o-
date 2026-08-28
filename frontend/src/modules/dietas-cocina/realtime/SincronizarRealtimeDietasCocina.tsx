import { useEffect, useRef } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { mapearComidaInterna } from "@/modules/dietas-cocina/api/utils"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { mapFilaDietaDtoToDomain, normalizarFilaDietaDto } from "@/modules/dietas-cocina/api/mappers"
import {
  EVENTOS_DIETAS_COCINA,
  suscribirEventosDietasCocina,
} from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"
import {
  conectarHubDietasCocina,
  conexionDietasCocinaActiva,
  desconectarHubDietasCocina,
} from "@/modules/dietas-cocina/realtime/dietasCocinaHub"

const FALLBACK_MS = 60_000
const REINTENTO_HUB_MS = 15_000

/**
 * Conecta SignalR y, si el socket está caído, hace fallback de censo cada 60 s.
 */
export function SincronizarRealtimeDietasCocina() {
  const apiActiva = usarApiDietasCocina()
  const { sincronizarCenso, aplicarFilaRemota } = useDietasOperativas()
  const { recargarEtiquetasYOrdenes } = useCicloBandejas()
  const conectarEnVuelo = useRef(false)

  useEffect(() => {
    if (!apiActiva) return

    const intentarConectar = () => {
      if (conexionDietasCocinaActiva() || conectarEnVuelo.current) return
      conectarEnVuelo.current = true
      void conectarHubDietasCocina()
        .catch(() => {
          /* el fallback de censo cubre mientras el hub no arranca */
        })
        .finally(() => {
          conectarEnVuelo.current = false
        })
    }

    intentarConectar()
    const reintento = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      if (!conexionDietasCocinaActiva()) intentarConectar()
    }, REINTENTO_HUB_MS)

    return () => {
      window.clearInterval(reintento)
      void desconectarHubDietasCocina()
    }
  }, [apiActiva])

  useEffect(() => {
    if (!apiActiva) return

    const pedirCenso = (comida = obtenerComidaActivaOperativa()) => {
      void sincronizarCenso(comida).catch(() => {})
    }

    const unsubscribe = suscribirEventosDietasCocina((evento) => {
      if (evento.tipo === EVENTOS_DIETAS_COCINA.FilaActualizada) {
        const fila = mapFilaDietaDtoToDomain(normalizarFilaDietaDto(evento.payload))
        if (fila.id || fila.pacienteId || fila.cedula) aplicarFilaRemota(fila)
        return
      }
      if (evento.tipo === EVENTOS_DIETAS_COCINA.CensoActualizado) {
        const comida = evento.payload.comida
          ? mapearComidaInterna(String(evento.payload.comida))
          : obtenerComidaActivaOperativa()
        pedirCenso(comida)
        return
      }
      if (
        evento.tipo === EVENTOS_DIETAS_COCINA.OrdenActualizada
        || evento.tipo === EVENTOS_DIETAS_COCINA.EtiquetasActualizadas
      ) {
        void recargarEtiquetasYOrdenes().catch(() => {})
      }
    })

    const fallback = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      if (conexionDietasCocinaActiva()) return
      pedirCenso()
    }, FALLBACK_MS)

    const onFocusOVisible = () => {
      if (document.visibilityState !== "visible") return
      if (conexionDietasCocinaActiva()) return
      void conectarHubDietasCocina().catch(() => {})
      pedirCenso()
    }
    window.addEventListener("focus", onFocusOVisible)
    document.addEventListener("visibilitychange", onFocusOVisible)

    return () => {
      unsubscribe()
      window.clearInterval(fallback)
      window.removeEventListener("focus", onFocusOVisible)
      document.removeEventListener("visibilitychange", onFocusOVisible)
    }
  }, [apiActiva, aplicarFilaRemota, recargarEtiquetasYOrdenes, sincronizarCenso])

  return null
}
