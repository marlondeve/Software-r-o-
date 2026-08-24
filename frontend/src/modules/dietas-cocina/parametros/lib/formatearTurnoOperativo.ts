import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { formatearRangoHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function labelComida(comida: TiempoComida): string {
  return COMIDAS_TABS.find((c) => c.id === comida)?.label ?? comida
}

/** Etiqueta operativa del turno, p. ej. "Almuerzo (12:00 p. m. – 01:30 p. m.)". */
export function formatearTurnoOperativo(comida: TiempoComida): string {
  const label = labelComida(comida)
  const parametros = mockParametrosTiempos.comidas.find((item) => item.id === comida)
  if (!parametros) return label

  const inicio = parametros.hitos.find((h) => h.id === "inicio-dist")?.hora
  const fin = parametros.hitos.find((h) => h.id === "fin-dist")?.hora
  if (!inicio || !fin) return label

  return `${label} (${formatearRangoHora12(inicio, fin)})`
}
