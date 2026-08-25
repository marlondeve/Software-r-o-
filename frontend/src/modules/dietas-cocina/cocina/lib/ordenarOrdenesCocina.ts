import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"

function compararTextoEstable(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
}

/**
 * Orden fijo de la tabla cocina (no depende del orden del sync/censo):
 * pabellón → habitación → paciente → id.
 */
export function compararOrdenesCocinaEstable(
  a: OrdenCocina,
  b: OrdenCocina,
): number {
  const pabellon = compararTextoEstable(a.pabellon, b.pabellon)
  if (pabellon !== 0) return pabellon

  const habitacion = compararTextoEstable(a.habitacion, b.habitacion)
  if (habitacion !== 0) return habitacion

  const paciente = compararTextoEstable(a.paciente, b.paciente)
  if (paciente !== 0) return paciente

  return compararTextoEstable(a.id, b.id)
}

export function ordenarOrdenesCocinaEstable(
  ordenes: OrdenCocina[],
): OrdenCocina[] {
  return [...ordenes].sort(compararOrdenesCocinaEstable)
}
