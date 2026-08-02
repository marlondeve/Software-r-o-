import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

const MERIENDAS = new Set<TiempoComida>([
  "merienda-manana",
  "merienda-tarde",
  "merienda-noche",
])

const TIPO_DIETA_MERIENDA_POR_COMIDA: Partial<Record<TiempoComida, string>> = {
  "merienda-manana": "Merienda mañana",
  "merienda-tarde": "Merienda tarde",
  "merienda-noche": "Merienda noche",
}

export function esMerienda(comida: TiempoComida): boolean {
  return MERIENDAS.has(comida)
}

export function requiereConsistencia(comida: TiempoComida): boolean {
  return !esMerienda(comida)
}

export function esTipoDietaMerienda(nombre: string): boolean {
  return nombre.trim().toLowerCase().startsWith("merienda")
}

/** Tipo de dieta FCR sugerido al solicitar una merienda. */
export function tipoDietaPredeterminadoMerienda(comida: TiempoComida): string | null {
  return TIPO_DIETA_MERIENDA_POR_COMIDA[comida] ?? null
}

export function normalizarConsistenciaParaComida(
  comida: TiempoComida,
  consistencia: string,
): string | null {
  if (!requiereConsistencia(comida)) return null
  const valor = consistencia.trim()
  return valor.length > 0 ? valor : null
}

export function etiquetaConsistenciaEnTabla(
  comida: TiempoComida,
  consistencia: string | null | undefined,
): string {
  if (!requiereConsistencia(comida)) return "No aplica"
  return consistencia ?? "Sin asignar"
}
