import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import {
  formatearIdentificacionPaciente,
  formatearReferenciaIngreso,
  formatearUbicacionPaciente,
} from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
export function tituloSolicitudDieta(fila: FilaDieta): string {
  if (fila.estado === "no-solicitada") return "Nueva Solicitud de Dieta"
  if (fila.estado === "guardado") return "Editar Solicitud de Dieta"
  return "Detalle de Solicitud de Dieta"
}

export function esSolicitudEditable(fila: FilaDieta): boolean {
  return fila.estado === "no-solicitada" || fila.estado === "guardado"
}

export function puedeRegistrarNovedad(fila: FilaDieta): boolean {
  return fila.estado === "confirmada" || fila.estado === "devuelta"
}

export function puedeCancelarDieta(fila: FilaDieta): boolean {
  return fila.estado === "confirmada"
}

/** Fuera del horario de novedades (p. ej. después del límite de cambios). */
export function esCancelacionTardia(fila: FilaDieta): boolean {
  return fila.cancelacionTardia ?? false
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
