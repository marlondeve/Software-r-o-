import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export function tituloSolicitudDieta(fila: FilaDieta): string {
  if (fila.estado === "no-solicitada") return "Nueva Solicitud de Dieta"
  if (fila.estado === "guardado") return "Editar Solicitud de Dieta"
  return "Detalle de Solicitud de Dieta"
}

export function esSolicitudEditable(fila: FilaDieta): boolean {
  return fila.estado === "no-solicitada" || fila.estado === "guardado"
}

export function formatearContextoPaciente(fila: FilaDieta): string {
  return `${fila.servicio} | ${fila.pabellon} - Hab ${fila.habitacion}`
}

export function obtenerVentanaComida(comida: TiempoComida): string {
  const parametros = mockParametrosTiempos.comidas.find(
    (item) => item.id === comida,
  )
  if (!parametros) return "—"

  const { inicio, fin } = parametros.ventanaCambios
  return `${formatearHora12(inicio)} - ${formatearHora12(fin)}`
}
