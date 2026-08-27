import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { etiquetaPerteneceAFila } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import { esCancelacionSalidaClinica } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"

/** Motivo por el que una etiqueta impresa ya no cuenta en el flujo operativo. */
export type MotivoFueraFlujoEtiqueta =
  | "salida_clinica"
  | "cancelada"
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
 * Solo el estado explícito de la dieta saca del flujo; no encontrar fila
 * (censo parcial, otra comida, HIS caído) mantiene la etiqueta operativa.
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
    return { enFlujo: true }
  }

  if (fila.estado === "cancelada") {
    const salida = esCancelacionSalidaClinica(
      fila.observaciones,
      fila.cancelacionPorSalidaClinica,
      fila.salidaClinicaSostenida,
      fila.estado,
    )
    return {
      enFlujo: false,
      motivo: salida ? "salida_clinica" : "cancelada",
      fila,
    }
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
    case "salida_clinica":
      return "Dieta cancelada por salida clínica"
    case "cancelada":
      return "Dieta cancelada"
    case "sin_solicitud":
      return "Sin solicitud"
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
