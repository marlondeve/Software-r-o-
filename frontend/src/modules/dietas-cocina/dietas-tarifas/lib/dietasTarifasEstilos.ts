import type {
  DietaCatalogo,
  TarifaHistorico,
} from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"

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
  const partes = texto.trim().split(/\s+/)
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

export function validarSolapamientoVigencia(
  fechaInicio: string,
  dieta: DietaCatalogo,
): SolapamientoVigencia {
  if (!fechaInicio) return { solapa: false }

  const fecha = new Date(fechaInicio)
  if (Number.isNaN(fecha.getTime())) return { solapa: false }

  const vigente = dieta.historicoTarifas.find((t) => t.vigente)
  if (!vigente) return { solapa: false }

  const inicioVigente = parseFechaCatalogo(
    vigente.vigenciaDesde,
    vigente.anio,
  )
  const finVigente = parseFechaCatalogo(vigente.vigenciaHasta, vigente.anio)
  if (!inicioVigente || !finVigente) return { solapa: false }

  if (fecha >= inicioVigente && fecha <= finVigente) {
    return {
      solapa: true,
      rangoConflicto: `${formatearFechaCatalogo(inicioVigente)} - ${formatearFechaCatalogo(finVigente)}`,
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
  const h = fecha.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${f}, ${h}`
}
