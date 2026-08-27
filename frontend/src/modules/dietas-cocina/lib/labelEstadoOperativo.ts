import type { EstadoCocina, EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import {
  claseBadgeEstadoCocina,
  claseBadgeEstadoDieta,
  estadoBadgeTokens,
  labelEstadoCocina,
  labelEstadoDieta,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

/** Texto del distintivo y alertas cuando la dieta sigue activa tras egreso fuera del límite. */
export const TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA =
  "Salida clínica: enviar (asume la clínica)"

/** Tooltip del distintivo de salida clínica sostenida. */
export const TOOLTIP_SALIDA_CLINICA_SOSTENIDA =
  "Paciente con salida clínica pasada la hora límite de novedades. La dieta ya está en producción: el proveedor debe enviarla y la clínica asume el costo. Si el egreso ocurre dentro del límite, la dieta se cancela para evitar desperdicio."

/** La salida clínica se lee distinto de una cancelación manual. */
const CLASE_BADGE_SALIDA_CLINICA = estadoBadgeTokens.clinicalExit

/** Detecta cancelación automática por salida clínica / egreso (textos actuales y legados). */
export function esCancelacionSalidaClinica(
  observaciones?: string | null,
  cancelacionPorSalidaClinica?: boolean,
  salidaClinicaSostenida?: boolean,
  estado?: EstadoDieta | EstadoCocina,
): boolean {
  const dietaActiva = estado != null && estado !== "cancelada"
  if (
    dietaActiva &&
    (salidaClinicaSostenida === true ||
      esObservacionSalidaClinicaSostenida(observaciones))
  ) {
    return false
  }
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

const TEXTO_SALIDA_SOSTENIDA =
  /salida\s*cl[ií]nica\s+fuera\s+del\s+l[ií]mite\s+de\s+novedades/i

export function esObservacionSalidaClinicaSostenida(
  observaciones?: string | null,
): boolean {
  return !!observaciones && TEXTO_SALIDA_SOSTENIDA.test(observaciones)
}

export function esSalidaClinicaSostenida(fila: {
  estado?: EstadoDieta
  salidaClinicaSostenida?: boolean
  observaciones?: string | null
}): boolean {
  if (fila.estado === "cancelada") return false
  return (
    fila.salidaClinicaSostenida === true ||
    esObservacionSalidaClinicaSostenida(fila.observaciones)
  )
}

/** Etiqueta legible del estado de dieta. Salida clínica y cancelación manual van aparte. */
export function labelEstadoDietaVisible(
  estado: EstadoDieta,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
    salidaClinicaSostenida?: boolean
  },
): string {
  if (
    estado !== "cancelada" &&
    esSalidaClinicaSostenida({
      salidaClinicaSostenida: opciones?.salidaClinicaSostenida,
      observaciones: opciones?.observaciones,
    })
  ) {
    return "Salida clínica sostenida"
  }

  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
      opciones?.salidaClinicaSostenida,
      estado,
    )
  ) {
    return "Salida clínica"
  }

  return labelEstadoDieta(estado)
}

export function claseBadgeEstadoDietaVisible(
  estado: EstadoDieta,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
    salidaClinicaSostenida?: boolean
  },
): string {
  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
      opciones?.salidaClinicaSostenida,
      estado,
    )
  ) {
    return CLASE_BADGE_SALIDA_CLINICA
  }
  return claseBadgeEstadoDieta(estado)
}

export function claseBadgeEstadoCocinaVisible(
  estado: EstadoCocina,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
    salidaClinicaSostenida?: boolean
  },
): string {
  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
      opciones?.salidaClinicaSostenida,
      estado,
    )
  ) {
    return CLASE_BADGE_SALIDA_CLINICA
  }
  return claseBadgeEstadoCocina(estado)
}

export function esSalidaClinicaCancelada(fila: {
  estado: EstadoDieta
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  salidaClinicaSostenida?: boolean
}): boolean {
  return (
    fila.estado === "cancelada" &&
    esCancelacionSalidaClinica(
      fila.observaciones,
      fila.cancelacionPorSalidaClinica,
      fila.salidaClinicaSostenida,
      fila.estado,
    )
  )
}

export function esCanceladaManual(fila: {
  estado: EstadoDieta
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  salidaClinicaSostenida?: boolean
}): boolean {
  return fila.estado === "cancelada" && !esSalidaClinicaCancelada(fila)
}

export function filaCoincideFiltroEstado(
  filtroEstado: string,
  estadoVisible: EstadoDieta,
  fila: Pick<
    FilaDieta,
    "observaciones" | "cancelacionPorSalidaClinica" | "estado" | "salidaClinicaSostenida"
  >,
): boolean {
  if (filtroEstado === "todos") return true
  if (filtroEstado === "salida-clinica") {
    return esSalidaClinicaCancelada({ ...fila, estado: estadoVisible })
  }
  if (filtroEstado === "cancelada") {
    return esCanceladaManual({ ...fila, estado: estadoVisible })
  }
  return estadoVisible === filtroEstado
}

/** Etiqueta legible del estado de cocina. Salida clínica y cancelación manual van aparte. */
export function labelEstadoCocinaVisible(
  estado: EstadoCocina,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
    salidaClinicaSostenida?: boolean
  },
): string {
  if (
    estado === "cancelada" &&
    esCancelacionSalidaClinica(
      opciones?.observaciones,
      opciones?.cancelacionPorSalidaClinica,
      opciones?.salidaClinicaSostenida,
      estado,
    )
  ) {
    return "Salida clínica"
  }
  return labelEstadoCocina(estado)
}
