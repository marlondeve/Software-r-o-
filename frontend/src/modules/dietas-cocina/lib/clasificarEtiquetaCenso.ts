import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { etiquetaPerteneceAFila } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

/** Motivo por el que una etiqueta impresa ya no cuenta en el flujo operativo. */
export type MotivoFueraFlujoEtiqueta =
  | "cancelada"
  | "fuera_de_censo"
  | "sin_solicitud"

export type ClasificacionEtiquetaCenso = {
  /** Alineada con Cocina: hay fila activa en censo (no cancelada / sin solicitud). */
  enFlujo: boolean
  motivo?: MotivoFueraFlujoEtiqueta
  fila?: FilaDieta
}

/**
 * Clasifica una etiqueta respecto al censo vigente.
 * No elimina ni oculta: solo distingue operativas vs historial del turno.
 * Si aún no hay filas cargadas, no degrada (evita falsos "fuera de censo").
 */
export function clasificarEtiquetaRespectoCenso(
  etiqueta: EtiquetaEnfermera,
  filas: FilaDieta[],
): ClasificacionEtiquetaCenso {
  if (filas.length === 0) {
    return { enFlujo: true }
  }

  const fila =
    (etiqueta.filaDietaId
      ? filas.find(
          (item) =>
            item.id === etiqueta.filaDietaId && item.comida === etiqueta.comida,
        )
      : undefined) ??
    filas.find((item) => etiquetaPerteneceAFila(item, etiqueta))

  if (!fila) {
    return { enFlujo: false, motivo: "fuera_de_censo" }
  }

  if (fila.estado === "cancelada") {
    return { enFlujo: false, motivo: "cancelada", fila }
  }

  if (fila.estado === "no-solicitada" || fila.estado === "guardado") {
    return { enFlujo: false, motivo: "sin_solicitud", fila }
  }

  return { enFlujo: true, fila }
}

export function etiquetaEnFlujoCenso(
  etiqueta: EtiquetaEnfermera,
  filas: FilaDieta[],
): boolean {
  return clasificarEtiquetaRespectoCenso(etiqueta, filas).enFlujo
}

export function etiquetaFueraFlujoCensoLabel(
  motivo: MotivoFueraFlujoEtiqueta | undefined,
): string {
  switch (motivo) {
    case "cancelada":
      return "Dieta cancelada"
    case "sin_solicitud":
      return "Sin solicitud"
    case "fuera_de_censo":
      return "Fuera de censo"
    default:
      return "Fuera de flujo"
  }
}

export function filtrarEtiquetasEnFlujoCenso(
  etiquetas: EtiquetaEnfermera[],
  filas: FilaDieta[],
): EtiquetaEnfermera[] {
  return etiquetas.filter((etiqueta) => etiquetaEnFlujoCenso(etiqueta, filas))
}

export function filtrarEtiquetasFueraFlujoCenso(
  etiquetas: EtiquetaEnfermera[],
  filas: FilaDieta[],
): EtiquetaEnfermera[] {
  return etiquetas.filter((etiqueta) => !etiquetaEnFlujoCenso(etiqueta, filas))
}
