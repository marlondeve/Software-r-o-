import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FiltrosReportes } from "@/modules/dietas-cocina/types/reports"
import { labelComida } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import {
  filtrarEtiquetasDelPeriodoOperativo,
  resolverEtiquetaParaOrden,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

const PABELLON_POR_SERVICIO: Record<string, string> = {
  cardiologia: "Pab Central",
  pediatria: "Pab Norte",
  urgencias: "Pab Sur",
}

export function filtrarOrdenesReporte(
  ordenes: OrdenCocina[],
  filtros: FiltrosReportes,
): OrdenCocina[] {
  return ordenes.filter((orden) => {
    if (
      filtros.horario !== "todos" &&
      orden.comida !== (filtros.horario as TiempoComida)
    ) {
      return false
    }
    if (filtros.servicio !== "todos") {
      const pabellon = PABELLON_POR_SERVICIO[filtros.servicio]
      if (pabellon && orden.pabellon !== pabellon) return false
    }
    return true
  })
}

export function filtrarEtiquetasReporte(
  etiquetas: EtiquetaEnfermera[],
  ordenesFiltradas: OrdenCocina[],
  filtros?: FiltrosReportes,
): EtiquetaEnfermera[] {
  const comida =
    filtros?.horario !== "todos"
      ? (filtros?.horario as TiempoComida)
      : undefined
  const delPeriodo = filtrarEtiquetasDelPeriodoOperativo(etiquetas, { comida })

  return delPeriodo.filter((etiqueta) =>
    ordenesFiltradas.some(
      (orden) => resolverEtiquetaParaOrden(orden, [etiqueta])?.id === etiqueta.id,
    ),
  )
}

export function crearLookupEtiquetaOrden(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
) {
  const etiquetasPeriodo = filtrarEtiquetasDelPeriodoOperativo(etiquetas)

  return (ordenId: string) => {
    const orden = ordenes.find((item) => item.id === ordenId)
    if (!orden) return undefined
    return resolverEtiquetaParaOrden(orden, etiquetasPeriodo)
  }
}

export function contextoFiltroReporte(filtros: FiltrosReportes): string {
  const partes: string[] = []

  if (filtros.horario !== "todos") {
    partes.push(`turno ${labelComida(filtros.horario as TiempoComida)}`)
  }
  if (filtros.servicio !== "todos") {
    const pabellon = PABELLON_POR_SERVICIO[filtros.servicio]
    partes.push(pabellon ?? filtros.servicio)
  }

  return partes.length > 0 ? partes.join(" · ") : "todos los turnos y servicios"
}
