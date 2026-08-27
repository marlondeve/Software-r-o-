import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { requiereConsistencia } from "@/modules/dietas-cocina/lib/comidaOperativa"
import { esRolAdministrador } from "@/modules/dietas-cocina/lib/roles"
import {
  formatearIdentificacionPaciente,
  formatearReferenciaIngreso,
  formatearUbicacionPaciente,
} from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
import { resolverEstadoVentanaComida } from "@/modules/dietas-cocina/dietas/lib/ventanaSolicitudDieta"

export const ESTADOS_NOVEDAD = new Set<EstadoDieta>([
  "guardado",
  "confirmada",
  "por-iniciar",
  "en-preparacion",
  "devuelta",
])

export const ESTADOS_CANCELAR_NORMAL = new Set<EstadoDieta>(["guardado"])

export const ESTADOS_CANCELAR_TARDIA = new Set<EstadoDieta>([
  "confirmada",
  "por-iniciar",
  "en-preparacion",
  "lista-despacho",
])

export const ESTADOS_CANCELAR_EN_PREPARACION = new Set<EstadoDieta>([
  "por-iniciar",
  "en-preparacion",
  "lista-despacho",
])

export const ROLES_CANCELAR_TARDIA = new Set(["Administrador"])

export type TipoCancelacionDieta = "normal" | "tardia"

export interface ContextoAccionesDietaClinica {
  fila: FilaDieta
  estadoVisible: EstadoDieta
  comida: TiempoComida
  rol?: string | null
  fecha?: Date
}

export interface EvaluacionAccionesDietaClinica {
  mostrarRegistrarNovedad: boolean
  puedeConfirmarNovedad: boolean
  puedeCancelarDieta: boolean
  puedeReactivarCancelada: boolean
  tipoCancelacion: TipoCancelacionDieta | null
  requiereAceptacionCosto: boolean
  cancelacionEnPreparacion: boolean
  /** Cancelación pasada la hora límite de novedades: cocina ya inició producción. */
  cancelacionFueraDeVentana: boolean
  ventanaAbierta: boolean
  /** Límite de novedades vigente (sin extensión por carga anticipada). */
  ventanaNovedadesAbierta: boolean
  motivoBloqueoNovedad?: string
  motivoBloqueoCancelacion?: string
}

export function tituloSolicitudDieta(fila: FilaDieta): string {
  if (fila.estado === "cancelada") return "Solicitar dieta (reactivación)"
  if (fila.estado === "no-solicitada") return "Nueva Solicitud de Dieta"
  if (fila.estado === "guardado") return "Editar Solicitud de Dieta"
  return "Detalle de Solicitud de Dieta"
}

export function esSolicitudEditable(fila: FilaDieta): boolean {
  return (
    fila.estado === "no-solicitada" ||
    fila.estado === "guardado" ||
    fila.estado === "cancelada"
  )
}

/** Dieta cancelada que el usuario puede devolver al flujo operativo. */
export function puedeReactivarCancelada(
  estadoVisible?: EstadoDieta,
  estadoFila?: EstadoDieta,
): boolean {
  return estadoVisible === "cancelada" || estadoFila === "cancelada"
}

export interface CondicionesClinicasFormulario {
  pacienteAislado: boolean
  observacionAislamiento: string
  alergico: boolean
  alergias: string
}

export function validarCondicionesClinicasFormulario(
  datos: CondicionesClinicasFormulario,
): { valido: boolean; mensaje?: string } {
  if (datos.pacienteAislado && !datos.observacionAislamiento.trim()) {
    return {
      valido: false,
      mensaje: "Indique la observación de aislamiento para que cocina pueda preparar la bandeja.",
    }
  }
  if (datos.alergico && !datos.alergias.trim()) {
    return {
      valido: false,
      mensaje: "Indique a qué es alérgico el paciente.",
    }
  }
  return { valido: true }
}

export function esFormularioSolicitudDietaValido(
  datos: CondicionesClinicasFormulario & {
    comida: TiempoComida
    tipoDieta: string
    consistencia: string
  },
): boolean {
  const consistenciaValida =
    !requiereConsistencia(datos.comida) || datos.consistencia.trim().length > 0

  return (
    datos.tipoDieta.trim().length > 0 &&
    consistenciaValida &&
    validarCondicionesClinicasFormulario(datos).valido
  )
}

export function evaluarAccionesDietaClinica(
  ctx: ContextoAccionesDietaClinica,
): EvaluacionAccionesDietaClinica {
  const { estadoVisible, comida, rol = null, fecha = new Date() } = ctx
  const ventana = resolverEstadoVentanaComida(comida, fecha)
  const ventanaAbierta = ventana.ventanaAbierta
  const ventanaNovedadesAbierta = ventana.ventanaNovedadesAbierta
  const mensajeLimiteNovedades = `Pasó el límite de novedades (${ventana.horaLimiteNovedades}): cocina ya inició la producción.`

  const estadoPermiteNovedad = ESTADOS_NOVEDAD.has(estadoVisible)
  const mostrarRegistrarNovedad = estadoPermiteNovedad
  const puedeConfirmarNovedad = estadoPermiteNovedad && ventanaNovedadesAbierta

  const esAdministrador = !!rol && esRolAdministrador(rol)
  const estadoSolicitado =
    ESTADOS_CANCELAR_NORMAL.has(estadoVisible) ||
    ESTADOS_CANCELAR_TARDIA.has(estadoVisible)

  let tipoCancelacion: TipoCancelacionDieta | null = null
  let motivoBloqueoCancelacion: string | undefined

  if (ventanaNovedadesAbierta && ESTADOS_CANCELAR_NORMAL.has(estadoVisible)) {
    tipoCancelacion = "normal"
  } else if (estadoSolicitado && esAdministrador) {
    // Fuera del límite la dieta ya está en producción aunque el proveedor no haya
    // movido el estado: cancelar siempre factura y queda solo en manos del Administrador.
    tipoCancelacion = "tardia"
  } else if (estadoSolicitado) {
    motivoBloqueoCancelacion = ventanaNovedadesAbierta
      ? "Solo un Administrador puede cancelar una dieta ya confirmada o en cocina."
      : `${mensajeLimiteNovedades} Solo un Administrador puede cancelar la dieta.`
  }

  const cancelacionEnPreparacion =
    tipoCancelacion === "tardia" &&
    ESTADOS_CANCELAR_EN_PREPARACION.has(estadoVisible)

  return {
    mostrarRegistrarNovedad,
    puedeConfirmarNovedad,
    puedeCancelarDieta: tipoCancelacion !== null,
    puedeReactivarCancelada: puedeReactivarCancelada(
      estadoVisible,
      ctx.fila.estado,
    ),
    tipoCancelacion,
    requiereAceptacionCosto: tipoCancelacion === "tardia",
    cancelacionEnPreparacion,
    cancelacionFueraDeVentana:
      tipoCancelacion === "tardia" && !ventanaNovedadesAbierta,
    ventanaAbierta,
    ventanaNovedadesAbierta,
    motivoBloqueoNovedad:
      estadoPermiteNovedad && !ventanaNovedadesAbierta
        ? ventanaAbierta
          ? mensajeLimiteNovedades
          : ventana.mensajeCierre
        : undefined,
    motivoBloqueoCancelacion,
  }
}

/** @deprecated Usar evaluarAccionesDietaClinica().mostrarRegistrarNovedad */
export function puedeRegistrarNovedad(
  fila: FilaDieta,
  estadoVisible?: EstadoDieta,
): boolean {
  const estado = estadoVisible ?? fila.estado
  return ESTADOS_NOVEDAD.has(estado)
}

/** Cancelación tardía o en preparación — requiere checkbox de costo. */
export function esCancelacionTardia(
  tipoCancelacion: TipoCancelacionDieta | null | undefined,
): boolean {
  return tipoCancelacion === "tardia"
}

export interface LineasContextoPaciente {
  identificacion: string
  ubicacion: string
  ingreso: string | null
}

export function obtenerLineasContextoPaciente(
  fila: FilaDieta,
): LineasContextoPaciente {
  return {
    identificacion: formatearIdentificacionPaciente(fila),
    ubicacion: formatearUbicacionPaciente(fila),
    ingreso: formatearReferenciaIngreso(fila),
  }
}

/** @deprecated Usar obtenerLineasContextoPaciente para evitar textos duplicados. */
export function formatearContextoPaciente(fila: FilaDieta): string {
  const { identificacion, ubicacion, ingreso } = obtenerLineasContextoPaciente(fila)
  return [identificacion, ubicacion, ingreso].filter(Boolean).join(" · ")
}

export { obtenerVentanaComida, resolverEstadoVentanaComida } from "@/modules/dietas-cocina/dietas/lib/ventanaSolicitudDieta"
