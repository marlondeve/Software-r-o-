import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  cargarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { minutosDelDiaEnColombia } from "@/modules/dietas-cocina/parametros/lib/horasOperativas"
import { labelComida } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

const ORDEN_COMIDAS: TiempoComida[] = [
  "desayuno",
  "merienda-manana",
  "almuerzo",
  "merienda-tarde",
  "cena",
  "merienda-noche",
]

function parseHora24(hora24: string): number {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return 0
  return horas * 60 + minutos
}

function hitoHora(
  config: ConfigTiempos,
  comida: TiempoComida,
  hitoId: string,
): string | undefined {
  return config.horasPorComida[comida]?.[hitoId]
}

function comidasActivas(config: ConfigTiempos): TiempoComida[] {
  return ORDEN_COMIDAS.filter((id) => config.activos[id] !== false)
}

export function resolverComidaOperativaActual(
  fecha = new Date(),
  config: ConfigTiempos = cargarConfigTiempos(),
): TiempoComida {
  const ahora = minutosDelDiaEnColombia(fecha)
  const comidas = comidasActivas(config)

  const comidaEnCurso = comidas.find((comida) => {
    const inicio = parseHora24(hitoHora(config, comida, "solicitud") ?? "00:00")
    const fin = parseHora24(hitoHora(config, comida, "fin-dist") ?? "23:59")
    return ahora >= inicio && ahora <= fin
  })
  if (comidaEnCurso) return comidaEnCurso

  const comidaSiguiente = comidas.find((comida) => {
    const inicio = parseHora24(hitoHora(config, comida, "solicitud") ?? "00:00")
    return ahora < inicio
  })
  if (comidaSiguiente) return comidaSiguiente

  return comidas[comidas.length - 1] ?? "almuerzo"
}

export function formatearPeriodoOperativo(
  fecha = new Date(),
  config: ConfigTiempos = cargarConfigTiempos(),
): string {
  const comida = resolverComidaOperativaActual(fecha, config)
  const llegada = hitoHora(config, comida, "llegada")
  if (!llegada) return labelComida(comida)
  return `${labelComida(comida)} - ${formatearHora12(llegada)}`
}

function formatearDuracionRestante(minutosRestantes: number): string {
  const total = Math.max(0, minutosRestantes)
  const horas = Math.floor(total / 60)
  const minutos = total % 60
  if (horas > 0) return `${horas}h ${minutos}min`
  return `${minutos} min`
}

/**
 * Próximo fin de distribución según parámetros operativos (misma fuente que
 * Pantalla Parámetros / ventana de solicitud). No usa el mock de demo.
 */
export function resolverProximoCierre(
  fecha = new Date(),
  config: ConfigTiempos = cargarConfigTiempos(),
) {
  const ahora = minutosDelDiaEnColombia(fecha)
  const comidas = comidasActivas(config)

  let proximo:
    | { comida: TiempoComida; minutosObjetivo: number; hora24: string; diaSiguiente: boolean }
    | undefined

  for (const comida of comidas) {
    const finDist = hitoHora(config, comida, "fin-dist")
    if (!finDist) continue

    const minutosObjetivo = parseHora24(finDist)
    if (minutosObjetivo <= ahora) continue

    if (!proximo || minutosObjetivo < proximo.minutosObjetivo) {
      proximo = {
        comida,
        minutosObjetivo,
        hora24: finDist,
        diaSiguiente: false,
      }
    }
  }

  if (!proximo) {
    const comida = comidas[0] ?? "desayuno"
    const finDist = hitoHora(config, comida, "fin-dist") ?? "09:30"
    proximo = {
      comida,
      minutosObjetivo: parseHora24(finDist),
      hora24: finDist,
      diaSiguiente: true,
    }
  }

  const minutosRestantes = proximo.diaSiguiente
    ? 24 * 60 - ahora + proximo.minutosObjetivo
    : proximo.minutosObjetivo - ahora

  const servicioBase = labelComida(proximo.comida).toUpperCase()

  return {
    servicio: proximo.diaSiguiente
      ? `${servicioBase} (DÍA SIGUIENTE)`
      : servicioBase,
    hora: formatearHora12(proximo.hora24),
    tiempoRestante: formatearDuracionRestante(minutosRestantes),
    comida: proximo.comida,
    diaSiguiente: proximo.diaSiguiente,
  }
}
