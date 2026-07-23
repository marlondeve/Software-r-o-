import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

export type FiltroSeguimientoCocina =
  | "Todos"
  | "en_transito"
  | "pre_entregada"
  | "entregada"
  | "devuelta"

export function resolverEstadoLogisticaOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): EstadoLogisticaEtiqueta | undefined {
  return etiqueta?.estadoLogistica ?? orden.estadoLogistica
}

export function ordenEnTransito(orden: OrdenCocina, etiqueta?: EtiquetaEnfermera): boolean {
  if (orden.estadoCocina !== "despachada") return false
  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)
  return !logistica || logistica === "impresa" || logistica === "generada"
}

export function ordenCoincideSeguimiento(
  orden: OrdenCocina,
  filtro: FiltroSeguimientoCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  if (filtro === "Todos") return true

  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)

  switch (filtro) {
    case "en_transito":
      return ordenEnTransito(orden, etiqueta)
    case "pre_entregada":
      return logistica === "pre_entregada"
    case "entregada":
      return logistica === "entregada"
    case "devuelta":
      return logistica === "devuelta"
  }
}
