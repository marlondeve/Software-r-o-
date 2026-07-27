import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { resolverComidaOperativaActual } from "@/modules/dietas-cocina/lib/resolverPeriodoOperativoNutricionista"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

/** @deprecated Usar obtenerComidaActivaOperativa() según la hora del sistema. */
export const COMIDA_ACTIVA_DEFAULT: TiempoComida = "almuerzo"
export const COMIDAS_OPERATIVAS = COMIDAS_TABS

/** Turno/comida operativa según la hora local del sistema y ventanas configuradas. */
export function obtenerComidaActivaOperativa(fecha = new Date()): TiempoComida {
  return resolverComidaOperativaActual(fecha)
}

export function subtituloFechaOperativa(fecha = new Date()): string {
  return fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
