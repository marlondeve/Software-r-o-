import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  formatearIdentificacionPaciente,
  formatearReferenciaIngreso,
  formatearUbicacionPaciente,
} from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
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

export function obtenerVentanaComida(comida: TiempoComida): string {
  const parametros = mockParametrosTiempos.comidas.find(
    (item) => item.id === comida,
  )
  if (!parametros) return "—"

  const { inicio, fin } = parametros.ventanaCambios
  return `${formatearHora12(inicio)} - ${formatearHora12(fin)}`
}
