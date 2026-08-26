import type { EstadoCocina, EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import {
  labelEstadoCocina,
  labelEstadoDieta,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

/** Detecta cancelación automática por salida clínica / egreso (textos actuales y legados). */
export function esCancelacionSalidaClinica(
  observaciones?: string | null,
  cancelacionPorSalidaClinica?: boolean,
): boolean {
  if (cancelacionPorSalidaClinica === true) return true
  if (!observaciones) return false
  const texto = observaciones
  return (
    /salida\s*cl[ií]nica/i.test(texto) ||
    /IngInSlC\s*=\s*S/i.test(texto) ||
    /egreso\s+del\s+paciente/i.test(texto) ||
    /egresado\s+del\s+censo/i.test(texto) ||
    /paciente\s+egresado/i.test(texto) ||
    (/cancelad[ao]\s+autom[aá]ticamente/i.test(texto) && /egreso/i.test(texto))
  )
}

/** Etiqueta legible del estado de dieta (evita «Cancelada» en salidas clínicas). */
export function labelEstadoDietaVisible(
  estado: EstadoDieta,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
  },
): string {
  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
    )
  ) {
    return "Salida clínica"
  }
  return labelEstadoDieta(estado)
}

/** Etiqueta legible del estado de cocina. */
export function labelEstadoCocinaVisible(
  estado: EstadoCocina,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
  },
): string {
  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
    )
  ) {
    return "Salida clínica"
  }
  return labelEstadoCocina(estado)
}
