import type { ModoCargaAnticipada, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { formatearHora24 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

const STORAGE_KEY = "dietas-cocina-parametros-tiempos"

/** Evento same-tab: solicitud/novedades releen la ventana al sincronizar parámetros. */
export const CONFIG_TIEMOS_CAMBIO_EVENTO = "dietas-cocina-config-tiempos"

export interface ConfigTiempos {
  activos: Record<TiempoComida, boolean>
  modoCarga: ModoCargaAnticipada
  horasPorComida: Record<TiempoComida, Record<string, string>>
}

/** Normaliza "H:mm", "HH:mm:ss" o variantes a "HH:mm". */
export function normalizarHoraConfig(hora: string | null | undefined): string {
  if (!hora?.trim()) return "07:00"
  const match = hora.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return formatearHora24(hora.trim())
  return formatearHora24(`${match[1]}:${match[2]}`)
}

export function crearConfigTiemposInicial(): ConfigTiempos {
  const { comidas, cargaAnticipada } = mockParametrosTiempos
  return {
    activos: Object.fromEntries(
      comidas.map((comida) => [comida.id, comida.activo]),
    ) as Record<TiempoComida, boolean>,
    modoCarga: cargaAnticipada.modo,
    horasPorComida: Object.fromEntries(
      comidas.map((comida) => [
        comida.id,
        Object.fromEntries(
          comida.hitos.map((hito) => [hito.id, normalizarHoraConfig(hito.hora)]),
        ),
      ]),
    ) as Record<TiempoComida, Record<string, string>>,
  }
}

/** Completa campos faltantes si localStorage tiene JSON parcial o antiguo. */
export function normalizarConfigTiempos(
  config: Partial<ConfigTiempos> | null | undefined,
): ConfigTiempos {
  const base = crearConfigTiemposInicial()
  if (!config) return base

  return {
    activos: { ...base.activos, ...(config.activos ?? {}) },
    modoCarga: config.modoCarga ?? base.modoCarga,
    horasPorComida: Object.fromEntries(
      Object.keys(base.horasPorComida).map((comidaId) => {
        const comida = comidaId as TiempoComida
        const horasBase = base.horasPorComida[comida]
        const horasIn = config.horasPorComida?.[comida] ?? {}
        return [
          comidaId,
          Object.fromEntries(
            Object.keys(horasBase).map((hitoId) => [
              hitoId,
              normalizarHoraConfig(horasIn[hitoId] ?? horasBase[hitoId]),
            ]),
          ),
        ]
      }),
    ) as Record<TiempoComida, Record<string, string>>,
  }
}

export function cargarConfigTiempos(): ConfigTiempos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return crearConfigTiemposInicial()
    return normalizarConfigTiempos(JSON.parse(raw) as Partial<ConfigTiempos>)
  } catch {
    return crearConfigTiemposInicial()
  }
}

export function guardarConfigTiempos(config: ConfigTiempos) {
  const normalizado = normalizarConfigTiempos(config)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activos: normalizado.activos,
      modoCarga: normalizado.modoCarga,
      horasPorComida: normalizado.horasPorComida,
    }),
  )
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONFIG_TIEMOS_CAMBIO_EVENTO))
  }
}
