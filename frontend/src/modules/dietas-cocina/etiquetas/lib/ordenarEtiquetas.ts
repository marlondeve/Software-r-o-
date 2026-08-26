import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

function compararTextoEstable(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
}

/**
 * Criterio de ubicación (siembra inicial y etiquetas nuevas).
 * pabellón → habitación → paciente → id.
 */
export function compararEtiquetasPorUbicacion(
  a: EtiquetaEnfermera,
  b: EtiquetaEnfermera,
): number {
  const pabellon = compararTextoEstable(a.pabellon ?? "", b.pabellon ?? "")
  if (pabellon !== 0) return pabellon

  const habitacion = compararTextoEstable(a.habitacion ?? "", b.habitacion ?? "")
  if (habitacion !== 0) return habitacion

  const paciente = compararTextoEstable(a.paciente ?? "", b.paciente ?? "")
  if (paciente !== 0) return paciente

  return compararTextoEstable(a.id, b.id)
}

/** Índice fijo por id de etiqueta: no se mueve aunque sync cambie cama/estado. */
export type OrdenListaEtiquetas = Map<string, number>

/**
 * Conserva posiciones ya conocidas. Las etiquetas nuevas van al final,
 * ordenadas entre sí por ubicación (una sola vez).
 */
export function sincronizarOrdenListaEtiquetas(
  etiquetas: EtiquetaEnfermera[],
  ordenLista: OrdenListaEtiquetas,
): OrdenListaEtiquetas {
  const next = new Map(ordenLista)

  if (next.size === 0) {
    const iniciales = [...etiquetas].sort(compararEtiquetasPorUbicacion)
    iniciales.forEach((etiqueta, indice) => next.set(etiqueta.id, indice))
    return next
  }

  const nuevas = etiquetas
    .filter((etiqueta) => !next.has(etiqueta.id))
    .sort(compararEtiquetasPorUbicacion)

  if (nuevas.length === 0) return next

  let cursor = Math.max(-1, ...next.values()) + 1
  for (const etiqueta of nuevas) {
    next.set(etiqueta.id, cursor++)
  }
  return next
}

/** Orden de pantalla: índice fijo; desempate por ubicación/id. */
export function ordenarEtiquetasConListaFija(
  etiquetas: EtiquetaEnfermera[],
  ordenLista: OrdenListaEtiquetas,
): EtiquetaEnfermera[] {
  return [...etiquetas].sort((a, b) => {
    const indiceA = ordenLista.get(a.id)
    const indiceB = ordenLista.get(b.id)

    if (indiceA != null && indiceB != null && indiceA !== indiceB) {
      return indiceA - indiceB
    }
    if (indiceA != null && indiceB == null) return -1
    if (indiceA == null && indiceB != null) return 1

    return compararEtiquetasPorUbicacion(a, b)
  })
}

/** Siembra + ordena (tests / primera carga sin mapa externo). */
export function ordenarEtiquetasPorUbicacion(
  etiquetas: EtiquetaEnfermera[],
  ordenLista?: OrdenListaEtiquetas,
): EtiquetaEnfermera[] {
  const lista = sincronizarOrdenListaEtiquetas(
    etiquetas,
    ordenLista ?? new Map(),
  )
  return ordenarEtiquetasConListaFija(etiquetas, lista)
}
