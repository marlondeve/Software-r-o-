import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function compararTextoEstable(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
}

/**
 * Criterio de ubicación (solo siembra inicial y filas nuevas).
 * pabellón → habitación → paciente → id.
 */
export function compararFilasDietasPorUbicacion(a: FilaDieta, b: FilaDieta): number {
  const pabellon = compararTextoEstable(a.pabellon ?? "", b.pabellon ?? "")
  if (pabellon !== 0) return pabellon

  const habitacion = compararTextoEstable(a.habitacion ?? "", b.habitacion ?? "")
  if (habitacion !== 0) return habitacion

  const paciente = compararTextoEstable(a.paciente ?? "", b.paciente ?? "")
  if (paciente !== 0) return paciente

  return compararTextoEstable(a.id, b.id)
}

/** Índice fijo por id de fila: no se mueve aunque cambie cama o estado. */
export type OrdenListaDietas = Map<string, number>

/**
 * Conserva posiciones ya conocidas. Las filas nuevas van al final,
 * ordenadas entre sí por ubicación (una sola vez).
 */
export function sincronizarOrdenListaDietas(
  filas: FilaDieta[],
  ordenLista: OrdenListaDietas,
): OrdenListaDietas {
  const next = new Map(ordenLista)

  if (next.size === 0) {
    const iniciales = [...filas].sort(compararFilasDietasPorUbicacion)
    iniciales.forEach((fila, indice) => next.set(fila.id, indice))
    return next
  }

  const nuevas = filas
    .filter((fila) => !next.has(fila.id))
    .sort(compararFilasDietasPorUbicacion)

  if (nuevas.length === 0) return next

  let cursor = Math.max(-1, ...next.values()) + 1
  for (const fila of nuevas) {
    next.set(fila.id, cursor++)
  }
  return next
}

/** Orden de pantalla: índice fijo; desempate por ubicación/id. */
export function ordenarFilasDietasConListaFija(
  filas: FilaDieta[],
  ordenLista: OrdenListaDietas,
): FilaDieta[] {
  return [...filas].sort((a, b) => {
    const indiceA = ordenLista.get(a.id)
    const indiceB = ordenLista.get(b.id)

    if (indiceA != null && indiceB != null && indiceA !== indiceB) {
      return indiceA - indiceB
    }
    if (indiceA != null && indiceB == null) return -1
    if (indiceA == null && indiceB != null) return 1

    return compararFilasDietasPorUbicacion(a, b)
  })
}

/** Siembra + ordena (tests / primera carga sin mapa externo). */
export function ordenarFilasDietasOperativas(
  filas: FilaDieta[],
  ordenLista?: OrdenListaDietas,
): FilaDieta[] {
  const lista = sincronizarOrdenListaDietas(filas, ordenLista ?? new Map())
  return ordenarFilasDietasConListaFija(filas, lista)
}
