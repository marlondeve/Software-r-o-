import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FiltrosReportes } from "@/modules/dietas-cocina/types/reports"
import { labelComida } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import {
  filtrarEtiquetasDelPeriodoOperativo,
  resolverEtiquetaParaOrden,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

function normalizarFechaOperativa(valor: string): string | undefined {
  const iso = valor.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]

  const latam = valor.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (latam) {
    const [, day, month, year] = latam
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const parsed = Date.parse(valor)
  if (!Number.isNaN(parsed)) {
    const fecha = new Date(parsed)
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, "0")
    const day = String(fecha.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return undefined
}

function fechaEnRangoReporte(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta
}

export function filtrarEtiquetasPorRangoReporte(
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
): EtiquetaEnfermera[] {
  const comida =
    filtros.horario !== "todos" ? (filtros.horario as TiempoComida) : undefined

  return etiquetas.filter((etiqueta) => {
    if (comida && etiqueta.comida !== comida) return false
    const ref = etiqueta.fechaHora?.trim()
    if (!ref) return false
    const fecha = normalizarFechaOperativa(ref)
    if (!fecha) return false
    return fechaEnRangoReporte(fecha, filtros.desde, filtros.hasta)
  })
}

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
  const delPeriodo = filtros
    ? filtrarEtiquetasPorRangoReporte(etiquetas, filtros)
    : filtrarEtiquetasDelPeriodoOperativo(etiquetas)

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

  if (filtros.desde === filtros.hasta) {
    partes.push(`el ${filtros.desde}`)
  } else {
    partes.push(`del ${filtros.desde} al ${filtros.hasta}`)
  }

  if (filtros.horario !== "todos") {
    partes.push(`turno ${labelComida(filtros.horario as TiempoComida)}`)
  }
  if (filtros.servicio !== "todos") {
    const pabellon = PABELLON_POR_SERVICIO[filtros.servicio]
    partes.push(pabellon ?? filtros.servicio)
  }

  return partes.join(" · ")
}
