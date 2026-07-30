import type { DietaCatalogo, TarifaHistorico } from "@/modules/dietas-cocina/types/catalog"
import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
const formatoMonedaCop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatearMonedaTarifa(monto: number): string {
  return formatoMonedaCop.format(monto)
}

export function formatearMonedaTarifaGrande(monto: number): string {
  return formatoMonedaCop.format(monto)
}

export interface SolapamientoVigencia {
  solapa: boolean
  rangoConflicto?: string
}

const MESES_CATALOGO: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
}

function parseFechaCatalogo(texto: string, anioFallback?: number): Date | null {
  const trimmed = texto.trim()
  if (!trimmed || trimmed === "—") return null

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const fecha = new Date(`${trimmed.slice(0, 10)}T12:00:00`)
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }

  const formatoEsCo = trimmed.match(
    /^(\d{1,2})\s+de\s+(\p{L}{3,4})\.?\s+de\s+(\d{4})$/iu,
  )
  if (formatoEsCo) {
    const dia = Number.parseInt(formatoEsCo[1], 10)
    const mes = MESES_CATALOGO[formatoEsCo[2].toLowerCase().slice(0, 3)]
    const anio = Number.parseInt(formatoEsCo[3], 10)
    if (!Number.isNaN(dia) && mes !== undefined && !Number.isNaN(anio)) {
      return new Date(anio, mes, dia)
    }
  }

  const formatoSlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (formatoSlash) {
    const dia = Number.parseInt(formatoSlash[1], 10)
    const mes = Number.parseInt(formatoSlash[2], 10) - 1
    const anio = Number.parseInt(formatoSlash[3], 10)
    if (!Number.isNaN(dia) && mes >= 0 && mes <= 11 && !Number.isNaN(anio)) {
      return new Date(anio, mes, dia)
    }
  }

  const partes = trimmed.split(/\s+/)
  if (partes.length >= 3) {
    const dia = Number.parseInt(partes[0], 10)
    const mes = MESES_CATALOGO[partes[1].toLowerCase().slice(0, 3)]
    const anio = Number.parseInt(partes[2], 10)
    if (!Number.isNaN(dia) && mes !== undefined && !Number.isNaN(anio)) {
      return new Date(anio, mes, dia)
    }
  }
  if (partes.length >= 2 && anioFallback !== undefined) {
    const dia = Number.parseInt(partes[0], 10)
    const mes = MESES_CATALOGO[partes[1].toLowerCase().slice(0, 3)]
    if (!Number.isNaN(dia) && mes !== undefined) {
      return new Date(anioFallback, mes, dia)
    }
  }
  return null
}

export function fechaCatalogoAISO(texto: string, anioFallback?: number): string {
  const fecha = parseFechaCatalogo(texto, anioFallback)
  if (!fecha) return ""
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function finAnioCatalogoISO(fechaInicioIso: string): string {
  const anio = new Date(`${fechaInicioIso}T12:00:00`).getFullYear()
  return `${anio}-12-31`
}

export function validarSolapamientoVigencia(
  fechaInicio: string,
  dieta: DietaCatalogo,
): SolapamientoVigencia {
  if (!fechaInicio) return { solapa: false }

  const fecha = new Date(`${fechaInicio}T12:00:00`)
  if (Number.isNaN(fecha.getTime())) return { solapa: false }

  const hoy = new Date()
  hoy.setHours(12, 0, 0, 0)
  if (fecha < hoy) {
    return {
      solapa: true,
      rangoConflicto: "La fecha de inicio debe ser hoy o posterior.",
    }
  }

  const vigenciaHastaNueva = new Date(`${finAnioCatalogoISO(fechaInicio)}T12:00:00`)

  for (const tarifa of dieta.historicoTarifas.filter((t) => t.vigente)) {
    const inicioExistente = parseFechaCatalogo(tarifa.vigenciaDesde, tarifa.anio)
    const finExistente = parseFechaCatalogo(tarifa.vigenciaHasta, tarifa.anio)
    if (!inicioExistente || !finExistente) continue

    if (fecha.getTime() === inicioExistente.getTime()) {
      return {
        solapa: true,
        rangoConflicto: `${formatearFechaCatalogo(inicioExistente)} - ${formatearFechaCatalogo(finExistente)}`,
      }
    }

    const solapa =
      fecha <= finExistente && vigenciaHastaNueva >= inicioExistente
    const cierreAutomatico =
      fecha > inicioExistente && fecha <= finExistente && fecha > hoy

    if (solapa && !cierreAutomatico) {
      return {
        solapa: true,
        rangoConflicto: `${formatearFechaCatalogo(inicioExistente)} - ${formatearFechaCatalogo(finExistente)}`,
      }
    }
  }

  return { solapa: false }
}

export function obtenerTarifaVigente(
  historico: TarifaHistorico[],
): TarifaHistorico | undefined {
  return historico.find((t) => t.vigente)
}

export function formatearFechaCatalogo(fecha: Date): string {
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatearFechaHoraCatalogo(fecha: Date): string {
  const f = fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const h = formatearHoraDesdeFecha(fecha)
  return `${f}, ${h}`
}
