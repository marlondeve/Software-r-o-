import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  cargarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { minutosDelDiaEnColombia, minutosHastaHora, estaEnRangoHorario } from "@/modules/dietas-cocina/parametros/lib/horasOperativas"
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
    return estaEnRangoHorario(ahora, inicio, fin)
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
 * Pantalla Parámetros / ventana de solicitud). Recorre el ciclo diario desde
 * la comida operativa actual; no elige la merienda con fin-dist más temprano.
 */
export function resolverProximoCierre(
  fecha = new Date(),
  config: ConfigTiempos = cargarConfigTiempos(),
) {
  const ahora = minutosDelDiaEnColombia(fecha)
  const activas = comidasActivas(config)
  const comidaActual = resolverComidaOperativaActual(fecha, config)
  const idxInicio = Math.max(0, ORDEN_COMIDAS.indexOf(comidaActual))

  let proximo:
    | {
        comida: TiempoComida
        minutosObjetivo: number
        hora24: string
        diaSiguiente: boolean
        minutosRestantes: number
      }
    | undefined

  for (let offset = 0; offset < ORDEN_COMIDAS.length; offset++) {
    const comida = ORDEN_COMIDAS[(idxInicio + offset) % ORDEN_COMIDAS.length]
    if (!activas.includes(comida)) continue

    const finDist = hitoHora(config, comida, "fin-dist")
    if (!finDist) continue

    const solicitud = parseHora24(hitoHora(config, comida, "solicitud") ?? "00:00")
    const minutosObjetivo = parseHora24(finDist)
    const enVentana = estaEnRangoHorario(ahora, solicitud, minutosObjetivo)

    if (offset === 0 && !enVentana) continue

    const minutosRestantes = minutosHastaHora(ahora, minutosObjetivo)
    proximo = {
      comida,
      minutosObjetivo,
      hora24: finDist,
      diaSiguiente: minutosObjetivo <= ahora,
      minutosRestantes,
    }
    break
  }

  if (!proximo) {
    const comida = activas[0] ?? "desayuno"
    const finDist = hitoHora(config, comida, "fin-dist") ?? "09:30"
    const minutosObjetivo = parseHora24(finDist)
    proximo = {
      comida,
      minutosObjetivo,
      hora24: finDist,
      diaSiguiente: true,
      minutosRestantes: minutosHastaHora(ahora, minutosObjetivo),
    }
  }

  const servicioBase = labelComida(proximo.comida).toUpperCase()

  return {
    servicio: proximo.diaSiguiente
      ? `${servicioBase} (DÍA SIGUIENTE)`
      : servicioBase,
    hora: formatearHora12(proximo.hora24),
    tiempoRestante: formatearDuracionRestante(proximo.minutosRestantes),
    comida: proximo.comida,
    diaSiguiente: proximo.diaSiguiente,
  }
}
