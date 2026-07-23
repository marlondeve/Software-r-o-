import {
  mockParametrosTiempos,
  type ModoCargaAnticipada,
  type TiempoComida,
} from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

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

export function cargarConfigTiempos(): ConfigTiempos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return crearConfigTiemposInicial()
    return JSON.parse(raw) as ConfigTiempos
  } catch {
    return crearConfigTiemposInicial()
  }
}

export function guardarConfigTiempos(config: ConfigTiempos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
