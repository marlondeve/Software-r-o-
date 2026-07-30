import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
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
  tipoCancelacion: TipoCancelacionDieta | null
  requiereAceptacionCosto: boolean
  cancelacionEnPreparacion: boolean
  ventanaAbierta: boolean
  motivoBloqueoNovedad?: string
  motivoBloqueoCancelacion?: string
}

export function tituloSolicitudDieta(fila: FilaDieta): string {
  if (fila.estado === "no-solicitada") return "Nueva Solicitud de Dieta"
  if (fila.estado === "guardado") return "Editar Solicitud de Dieta"
  return "Detalle de Solicitud de Dieta"
}

export function esSolicitudEditable(fila: FilaDieta): boolean {
  return fila.estado === "no-solicitada" || fila.estado === "guardado"
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
    tipoDieta: string
    consistencia: string
  },
): boolean {
  return (
    datos.tipoDieta.trim().length > 0 &&
    datos.consistencia.trim().length > 0 &&
    validarCondicionesClinicasFormulario(datos).valido
  )
}

export function evaluarAccionesDietaClinica(
  ctx: ContextoAccionesDietaClinica,
): EvaluacionAccionesDietaClinica {
  const { estadoVisible, comida, rol = null, fecha = new Date() } = ctx
  const ventana = resolverEstadoVentanaComida(comida, fecha)
  const ventanaAbierta = ventana.ventanaAbierta

  const estadoPermiteNovedad = ESTADOS_NOVEDAD.has(estadoVisible)
  const mostrarRegistrarNovedad = estadoPermiteNovedad
  const puedeConfirmarNovedad = estadoPermiteNovedad && ventanaAbierta

  let tipoCancelacion: TipoCancelacionDieta | null = null
  let motivoBloqueoCancelacion: string | undefined

  if (ESTADOS_CANCELAR_NORMAL.has(estadoVisible)) {
    tipoCancelacion = "normal"
  } else if (
    ESTADOS_CANCELAR_TARDIA.has(estadoVisible) &&
    rol &&
    esRolAdministrador(rol)
  ) {
    tipoCancelacion = "tardia"
  } else if (
    ESTADOS_CANCELAR_TARDIA.has(estadoVisible) &&
    rol &&
    !esRolAdministrador(rol)
  ) {
    motivoBloqueoCancelacion =
      "Solo un Administrador puede cancelar una dieta ya confirmada o en cocina."
  }

  const cancelacionEnPreparacion =
    tipoCancelacion === "tardia" &&
    ESTADOS_CANCELAR_EN_PREPARACION.has(estadoVisible)

  return {
    mostrarRegistrarNovedad,
    puedeConfirmarNovedad,
    puedeCancelarDieta: tipoCancelacion !== null,
    tipoCancelacion,
    requiereAceptacionCosto: tipoCancelacion === "tardia",
    cancelacionEnPreparacion,
    ventanaAbierta,
    motivoBloqueoNovedad:
      estadoPermiteNovedad && !ventanaAbierta
        ? ventana.mensajeCierre
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

/** @deprecated Usar evaluarAccionesDietaClinica().puedeCancelarDieta */
export function puedeCancelarDieta(
  fila: FilaDieta,
  estadoVisible?: EstadoDieta,
  rol?: string | null,
): boolean {
  const estado = estadoVisible ?? fila.estado
  if (ESTADOS_CANCELAR_NORMAL.has(estado)) return true
  if (ESTADOS_CANCELAR_TARDIA.has(estado) && rol && esRolAdministrador(rol)) {
    return true
  }
  return false
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
