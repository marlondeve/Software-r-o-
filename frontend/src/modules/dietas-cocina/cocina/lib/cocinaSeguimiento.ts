import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import { resolverEstadoLogisticaOrden } from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

export const PASOS_SEGUIMIENTO = [
  { id: "solicitud", label: "Solicitud" },
  { id: "confirmada", label: "Confirmada" },
  { id: "preparacion", label: "Preparación" },
  { id: "etiqueta", label: "Etiqueta" },
  { id: "despacho", label: "Despacho" },
  { id: "llegada", label: "Llegada" },
  { id: "entrega", label: "Entrega" },
  { id: "recogida", label: "Recogida" },
] as const

export function indicePasoActivoSeguimiento(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): number {
  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)
  if (logistica === "devuelta") return 7
  if (logistica === "entregada") return 6
  if (logistica === "pre_entregada") return 5
  if (orden.estadoCocina === "despachada") return 4
  if (orden.etiquetaImpresa || orden.etiquetaGenerada) return 3
  if (orden.estadoCocina === "lista") return 3
  if (orden.estadoCocina === "en_preparacion") return 2
  if (orden.estadoCocina === "por_iniciar") return 1
  if (orden.estadoCocina === "cancelada") return 0
  return 1
}

export function puedeContinuarPreparacion(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  const paso = indicePasoActivoSeguimiento(orden, etiqueta)
  return (
    paso <= 2 &&
    (orden.estadoCocina === "por_iniciar" ||
      orden.estadoCocina === "en_preparacion")
  )
}

export function enPasoEtiquetaSeguimiento(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  return indicePasoActivoSeguimiento(orden, etiqueta) === 3
}
