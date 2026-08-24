import type { TiempoComida, ModoCargaAnticipada } from "@/modules/dietas-cocina/types/enums"
import type { ConfigTiempos, ParametrosTiempoComida } from "@/modules/dietas-cocina/types/parameters"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { normalizarHoraConfig } from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"

export function parametrosToConfig(
  tiempos: ParametrosTiempoComida[],
  fallback = mockParametrosTiempos,
  modoCarga?: ModoCargaAnticipada,
): ConfigTiempos {
  const activos = {} as Record<TiempoComida, boolean>
  const horasPorComida = {} as Record<TiempoComida, Record<string, string>>

  for (const comida of fallback.comidas) {
    const api = tiempos.find((item) => item.id === comida.id)
    activos[comida.id] = api?.activo ?? comida.activo
    horasPorComida[comida.id] = Object.fromEntries(
      comida.hitos.map((hito) => [
        hito.id,
        normalizarHoraConfig(
          api?.hitos.find((item) => item.id === hito.id)?.hora ?? hito.hora,
        ),
      ]),
    ) as Record<string, string>
  }

  return {
    activos,
    modoCarga: modoCarga ?? fallback.cargaAnticipada.modo,
    horasPorComida,
  }
}

export function configToParametros(
  config: ConfigTiempos,
  base: ParametrosTiempoComida[],
): ParametrosTiempoComida[] {
  return base.map((tiempo) => ({
    ...tiempo,
    activo: config.activos[tiempo.id] ?? tiempo.activo,
    hitos: tiempo.hitos.map((hito) => ({
      ...hito,
      hora: config.horasPorComida[tiempo.id]?.[hito.id] ?? hito.hora,
    })),
    ventanaCambios: {
      ...tiempo.ventanaCambios,
      inicio: config.horasPorComida[tiempo.id]?.solicitud ?? tiempo.ventanaCambios.inicio,
      fin: config.horasPorComida[tiempo.id]?.novedades ?? tiempo.ventanaCambios.fin,
    },
  }))
}

export function tiemposBaseDesdeMock(): ParametrosTiempoComida[] {
  return mockParametrosTiempos.comidas.map((comida) => ({ ...comida, hitos: [...comida.hitos] }))
}
