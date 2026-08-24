import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { resolverContextoFilaDieta } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

function parseMsDesdeTexto(valor?: string): number {
  if (!valor?.trim()) return 0
  const parsed = Date.parse(valor.trim())
  return Number.isNaN(parsed) ? 0 : parsed
}

/** Marca temporal del último movimiento operativo conocido de la fila. */
export function obtenerMsUltimoCambioFila(
  fila: FilaDieta,
  etiqueta?: EtiquetaEnfermera,
): number {
  return Math.max(
    parseMsDesdeTexto(fila.solicitadoEn),
    parseMsDesdeTexto(etiqueta?.horaDevolucion),
    parseMsDesdeTexto(etiqueta?.horaEntrega),
    parseMsDesdeTexto(etiqueta?.horaPreEntrega),
    parseMsDesdeTexto(etiqueta?.fechaHora),
  )
}

function compararTextoEstable(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
}

/**
 * Orden operativo estable para la tabla de dietas:
 * 1. «Sin solicitud» siempre arriba.
 * 2. Resto por último cambio de estado (más reciente primero).
 * 3. Desempate fijo por habitación y paciente (evita saltos al sincronizar censo).
 */
export function compararFilasDietasOperativas(
  a: FilaDieta,
  b: FilaDieta,
  resolverEstadoVisible: (fila: FilaDieta) => EstadoDieta,
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): number {
  const estadoA = resolverEstadoVisible(a)
  const estadoB = resolverEstadoVisible(b)
  const prioridadA = estadoA === "no-solicitada" ? 0 : 1
  const prioridadB = estadoB === "no-solicitada" ? 0 : 1

  if (prioridadA !== prioridadB) return prioridadA - prioridadB

  if (prioridadA === 1) {
    const ctxA = resolverContextoFilaDieta(a, ordenes, etiquetas)
    const ctxB = resolverContextoFilaDieta(b, ordenes, etiquetas)
    const msA = obtenerMsUltimoCambioFila(a, ctxA.etiqueta)
    const msB = obtenerMsUltimoCambioFila(b, ctxB.etiqueta)
    if (msA !== msB) return msB - msA
  }

  const habitacion = compararTextoEstable(a.habitacion, b.habitacion)
  if (habitacion !== 0) return habitacion

  return compararTextoEstable(a.paciente, b.paciente)
}

export function ordenarFilasDietasOperativas(
  filas: FilaDieta[],
  resolverEstadoVisible: (fila: FilaDieta) => EstadoDieta,
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): FilaDieta[] {
  return [...filas].sort((a, b) =>
    compararFilasDietasOperativas(a, b, resolverEstadoVisible, ordenes, etiquetas),
  )
}
