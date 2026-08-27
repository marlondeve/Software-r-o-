import type { EstadoCocina, EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import {
  claseBadgeEstadoCocina,
  claseBadgeEstadoDieta,
  estadoBadgeTokens,
  labelEstadoCocina,
  labelEstadoDieta,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

/** Badge único cuando la dieta se sostiene y la clínica asume el costo. */
export const TEXTO_SALIDA_CLINICA_ASUME =
  "Salida clínica · asume la clínica"

/** @deprecated Usar TEXTO_SALIDA_CLINICA_ASUME */
export const TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA = TEXTO_SALIDA_CLINICA_ASUME

/** Tooltip del badge de salida clínica con envío a cargo de la clínica. */
export const TOOLTIP_SALIDA_CLINICA_SOSTENIDA =
  "Paciente con salida clínica y dieta ya preparada o fuera del límite de novedades: el proveedor la envía y la clínica asume el costo."

/** La salida clínica se lee distinto de una cancelación manual. */
const CLASE_BADGE_SALIDA_CLINICA = estadoBadgeTokens.clinicalExit

/** Estilo del badge único «asume la clínica» (borde ámbar + fondo suave). */
export const CLASE_BADGE_SALIDA_CLINICA_ASUME =
  "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"

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
    esSalidaClinicaSostenida({
      estado,
      salidaClinicaSostenida,
      observaciones,
    })
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
  /salida\s*cl[ií]nica\s+fuera\s+del\s+l[ií]mite\s+de\s+novedades|proveedor\s+la\s+env[ií]a|asume\s+la\s+cl[ií]nica/i

export function esObservacionSalidaClinicaSostenida(
  observaciones?: string | null,
): boolean {
  return !!observaciones && TEXTO_SALIDA_SOSTENIDA.test(observaciones)
}

/** Estados con orden/cocina: solo ahí aplica «asume la clínica». */
const ESTADOS_SOSTENIBLE_COCINA = new Set<EstadoDieta | EstadoCocina>([
  "confirmada",
  "por-iniciar",
  "preparando",
  "en-preparacion",
  "lista-despacho",
  "despachada",
  "recibida",
  "devuelta",
  "recogida",
  "en_preparacion",
  "lista",
])

export function esSalidaClinicaSostenida(fila: {
  estado?: EstadoDieta | EstadoCocina
  salidaClinicaSostenida?: boolean
  observaciones?: string | null
}): boolean {
  if (fila.estado === "cancelada") return false
  // Guardado / sin solicitud / etc.: flag o texto legado no cuentan como sostenida.
  if (fila.estado != null && !ESTADOS_SOSTENIBLE_COCINA.has(fila.estado)) {
    return false
  }
  return (
    fila.salidaClinicaSostenida === true ||
    esObservacionSalidaClinicaSostenida(fila.observaciones)
  )
}

/** Etiqueta legible del estado de dieta. Un solo badge para salida clínica. */
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
      estado,
      salidaClinicaSostenida: opciones?.salidaClinicaSostenida,
      observaciones: opciones?.observaciones,
    })
  ) {
    return TEXTO_SALIDA_CLINICA_ASUME
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
    estado !== "cancelada" &&
    esSalidaClinicaSostenida({
      estado,
      salidaClinicaSostenida: opciones?.salidaClinicaSostenida,
      observaciones: opciones?.observaciones,
    })
  ) {
    return CLASE_BADGE_SALIDA_CLINICA_ASUME
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
    estado !== "cancelada" &&
    esSalidaClinicaSostenida({
      estado,
      salidaClinicaSostenida: opciones?.salidaClinicaSostenida,
      observaciones: opciones?.observaciones,
    })
  ) {
    return CLASE_BADGE_SALIDA_CLINICA_ASUME
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
  if (filtroEstado === "asume-clinica") {
    return esSalidaClinicaSostenida({
      estado: estadoVisible,
      salidaClinicaSostenida: fila.salidaClinicaSostenida,
      observaciones: fila.observaciones,
    })
  }
  if (filtroEstado === "cancelada") {
    return esCanceladaManual({ ...fila, estado: estadoVisible })
  }
  return estadoVisible === filtroEstado
}

/** Etiqueta legible del estado de cocina. Un solo badge para salida clínica. */
export function labelEstadoCocinaVisible(
  estado: EstadoCocina,
  opciones?: {
    observaciones?: string | null
    cancelacionPorSalidaClinica?: boolean
    salidaClinicaSostenida?: boolean
  },
): string {
  if (
    estado !== "cancelada" &&
    esSalidaClinicaSostenida({
      estado,
      salidaClinicaSostenida: opciones?.salidaClinicaSostenida,
      observaciones: opciones?.observaciones,
    })
  ) {
    return TEXTO_SALIDA_CLINICA_ASUME
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
  return labelEstadoCocina(estado)
}
