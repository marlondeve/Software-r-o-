import type { ModoCargaAnticipada, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
const STORAGE_KEY = "dietas-cocina-parametros-tiempos"

export interface ConfigTiempos {
  activos: Record<TiempoComida, boolean>
  modoCarga: ModoCargaAnticipada
  horasPorComida: Record<TiempoComida, Record<string, string>>
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
        Object.fromEntries(comida.hitos.map((hito) => [hito.id, hito.hora])),
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
      Object.keys(base.horasPorComida).map((comidaId) => [
        comidaId,
        {
          ...base.horasPorComida[comidaId as TiempoComida],
          ...(config.horasPorComida?.[comidaId as TiempoComida] ?? {}),
        },
      ]),
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
  const { modoCarga: _modoCarga, ...persistible } = config
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistible))
}
