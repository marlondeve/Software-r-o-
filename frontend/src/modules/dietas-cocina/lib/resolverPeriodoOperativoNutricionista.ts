import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { labelComida } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
function parseHora24(hora24: string): number {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return 0
  return horas * 60 + minutos
}

function minutosDelDia(fecha: Date): number {
  return fecha.getHours() * 60 + fecha.getMinutes()
}

function hitoHora(comida: TiempoComida, hitoId: string): string | undefined {
  return mockParametrosTiempos.comidas
    .find((item) => item.id === comida)
    ?.hitos.find((hito) => hito.id === hitoId)?.hora
}

function comidasActivas() {
  return mockParametrosTiempos.comidas.filter((comida) => comida.activo)
}

export function resolverComidaOperativaActual(
  fecha = new Date(),
): TiempoComida {
  const ahora = minutosDelDia(fecha)
  const comidas = comidasActivas()

  const comidaEnCurso = comidas.find((comida) => {
    const inicio = parseHora24(hitoHora(comida.id, "solicitud") ?? "00:00")
    const fin = parseHora24(hitoHora(comida.id, "fin-dist") ?? "23:59")
    return ahora >= inicio && ahora <= fin
  })
  if (comidaEnCurso) return comidaEnCurso.id

  const comidaSiguiente = comidas.find((comida) => {
    const inicio = parseHora24(hitoHora(comida.id, "solicitud") ?? "00:00")
    return ahora < inicio
  })
  if (comidaSiguiente) return comidaSiguiente.id

  return comidas[comidas.length - 1]?.id ?? "almuerzo"
}

export function formatearPeriodoOperativo(fecha = new Date()): string {
  const comida = resolverComidaOperativaActual(fecha)
  const llegada = hitoHora(comida, "llegada")
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

export function resolverProximoCierre(fecha = new Date()) {
  const ahora = minutosDelDia(fecha)
  const comidas = comidasActivas()

  let proximo:
    | { comida: TiempoComida; minutosObjetivo: number; hora24: string; diaSiguiente: boolean }
    | undefined

  for (const comida of comidas) {
    const finDist = hitoHora(comida.id, "fin-dist")
    if (!finDist) continue

    const minutosObjetivo = parseHora24(finDist)
    if (minutosObjetivo <= ahora) continue

    if (!proximo || minutosObjetivo < proximo.minutosObjetivo) {
      proximo = { comida: comida.id, minutosObjetivo, hora24: finDist, diaSiguiente: false }
    }
  }

  if (!proximo) {
    const comida = comidas[0]
    const finDist = hitoHora(comida?.id ?? "desayuno", "fin-dist") ?? "09:30"
    proximo = {
      comida: comida?.id ?? "desayuno",
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
