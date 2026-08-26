import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"

function compararTextoEstable(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
}

/**
 * Criterio de ubicación (solo para la siembra inicial y bandejas nuevas).
 * pabellón → habitación → paciente → id.
 */
export function compararOrdenesCocinaEstable(
  a: OrdenCocina,
  b: OrdenCocina,
): number {
  const pabellon = compararTextoEstable(a.pabellon ?? "", b.pabellon ?? "")
  if (pabellon !== 0) return pabellon

  const habitacion = compararTextoEstable(a.habitacion ?? "", b.habitacion ?? "")
  if (habitacion !== 0) return habitacion

  const paciente = compararTextoEstable(a.paciente ?? "", b.paciente ?? "")
  if (paciente !== 0) return paciente

  return compararTextoEstable(a.id, b.id)
}

/** Índice fijo por id de orden: no se mueve aunque cambie cama/pabellón en el censo. */
export type OrdenListaCocina = Map<string, number>

/**
 * Conserva posiciones ya conocidas. Las bandejas nuevas se insertan al final,
 * ordenadas entre sí por ubicación (una sola vez).
 */
export function sincronizarOrdenListaCocina(
  ordenes: OrdenCocina[],
  ordenLista: OrdenListaCocina,
): OrdenListaCocina {
  const next = new Map(ordenLista)

  if (next.size === 0) {
    const iniciales = [...ordenes].sort(compararOrdenesCocinaEstable)
    iniciales.forEach((orden, indice) => next.set(orden.id, indice))
    return next
  }

  const nuevas = ordenes
    .filter((orden) => !next.has(orden.id))
    .sort(compararOrdenesCocinaEstable)

  if (nuevas.length === 0) return next

  let cursor = Math.max(-1, ...next.values()) + 1
  for (const orden of nuevas) {
    next.set(orden.id, cursor++)
  }
  return next
}

/** Orden de pantalla: índice fijo primero; desempate por ubicación/id. */
export function ordenarOrdenesCocinaConListaFija(
  ordenes: OrdenCocina[],
  ordenLista: OrdenListaCocina,
): OrdenCocina[] {
  return [...ordenes].sort((a, b) => {
    const indiceA = ordenLista.get(a.id)
    const indiceB = ordenLista.get(b.id)

    if (indiceA != null && indiceB != null && indiceA !== indiceB) {
      return indiceA - indiceB
    }
    if (indiceA != null && indiceB == null) return -1
    if (indiceA == null && indiceB != null) return 1

    return compararOrdenesCocinaEstable(a, b)
  })
}

/** Siembra + ordena en un paso (útil en tests y primera carga). */
export function ordenarOrdenesCocinaEstable(
  ordenes: OrdenCocina[],
  ordenLista?: OrdenListaCocina,
): OrdenCocina[] {
  const lista = sincronizarOrdenListaCocina(ordenes, ordenLista ?? new Map())
  return ordenarOrdenesCocinaConListaFija(ordenes, lista)
}
