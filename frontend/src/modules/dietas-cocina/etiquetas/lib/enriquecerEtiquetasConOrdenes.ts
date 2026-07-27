import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

function claveOrden(pacienteId: string, comida: string): string {
  return `${pacienteId}::${comida}`
}

function resolverOrdenParaEtiqueta(
  etiqueta: EtiquetaEnfermera,
  porFilaId: Map<string, OrdenCocina>,
  porClave: Map<string, OrdenCocina>,
): OrdenCocina | undefined {
  if (etiqueta.filaDietaId) {
    const porFila = porFilaId.get(etiqueta.filaDietaId)
    if (porFila) return porFila
  }
  return porClave.get(claveOrden(etiqueta.pacienteId, etiqueta.comida))
}

/** Completa aislamiento, observaciones y alergias desde la orden de cocina (censo). */
export function enriquecerEtiquetaConOrden(
  etiqueta: EtiquetaEnfermera,
  orden?: OrdenCocina,
): EtiquetaEnfermera {
  if (!orden) return etiqueta

  const observacionesOrden = orden.observaciones?.trim() ?? ""
  const observacionesEtiqueta = etiqueta.observaciones?.trim() ?? ""
  const alergiasOrden = orden.alergias?.length ? orden.alergias : undefined
  const alergiasEtiqueta = etiqueta.alergias?.length ? etiqueta.alergias : undefined

  return {
    ...etiqueta,
    aislamiento: etiqueta.aislamiento || orden.aislado,
    edad: etiqueta.edad || orden.edad,
    observaciones: observacionesEtiqueta || observacionesOrden,
    alergias: alergiasEtiqueta ?? alergiasOrden,
  }
}

export function enriquecerEtiquetasConOrdenes(
  etiquetas: EtiquetaEnfermera[],
  ordenes: OrdenCocina[],
): EtiquetaEnfermera[] {
  if (!ordenes.length) return etiquetas

  const porFilaId = new Map(ordenes.map((orden) => [orden.id, orden]))
  const porClave = new Map(
    ordenes.map((orden) => [claveOrden(orden.pacienteId, orden.comida), orden]),
  )

  return etiquetas.map((etiqueta) =>
    enriquecerEtiquetaConOrden(
      etiqueta,
      resolverOrdenParaEtiqueta(etiqueta, porFilaId, porClave),
    ),
  )
}
