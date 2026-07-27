import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { etiquetaPerteneceAOrden } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

function resolverOrdenParaEtiqueta(
  etiqueta: EtiquetaEnfermera,
  ordenes: OrdenCocina[],
): OrdenCocina | undefined {
  if (etiqueta.filaDietaId) {
    const porFila = ordenes.find((orden) => orden.id === etiqueta.filaDietaId)
    if (porFila && etiquetaPerteneceAOrden(porFila, etiqueta)) return porFila
  }

  if (etiqueta.ordenCocinaId) {
    const porApi = ordenes.find(
      (orden) => orden.ordenCocinaApiId === etiqueta.ordenCocinaId,
    )
    if (porApi && etiquetaPerteneceAOrden(porApi, etiqueta)) return porApi
  }

  return undefined
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

  return etiquetas.map((etiqueta) =>
    enriquecerEtiquetaConOrden(
      etiqueta,
      resolverOrdenParaEtiqueta(etiqueta, ordenes),
    ),
  )
}
