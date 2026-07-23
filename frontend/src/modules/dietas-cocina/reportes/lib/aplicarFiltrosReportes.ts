export interface FiltrosReportes {
  desde: string
  hasta: string
  servicio: string
  horario: string
}

export interface ReportesKpi {
  label: string
  value: string
  detalle?: string
  detalleVariant: "positive" | "negative" | "neutral"
}

export interface ReportesChartItem {
  label: string
  value: number
  color: string
}

export interface ReportesSegmento {
  label: string
  value: number
  color: string
}

export interface ReportesEstadoDietas {
  total: string
  totalNumerico: number
  segmentos: ReportesSegmento[]
}

export interface ReportesHito {
  etapa: string
  tiempo: string
  tendencia: string
  tendenciaVariant: "positive" | "negative" | "neutral"
}

interface ReportesBase {
  kpis: ReportesKpi[]
  hitos: ReportesHito[]
  estadoDietas: ReportesEstadoDietas
  tiposDieta: ReportesChartItem[]
  motivosDevolucion: ReportesChartItem[]
  distribucionServicio: ReportesChartItem[]
}

function parseNumero(valor: string): number {
  return Number.parseFloat(valor.replace(/[^0-9.-]/g, "")) || 0
}

function formatearEntero(n: number): string {
  return Math.round(n).toLocaleString("es-CO")
}

function formatearMoneda(n: number): string {
  return `$${n.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function factorFechas(desde: string, hasta: string): number {
  const inicio = new Date(desde).getTime()
  const fin = new Date(hasta).getTime()
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin < inicio) return 1
  const dias = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1)
  return Math.min(1.2, Math.max(0.35, dias / 24))
}

function factorServicio(servicio: string): number {
  switch (servicio) {
    case "cardiologia":
      return 0.72
    case "pediatria":
      return 0.58
    case "urgencias":
      return 0.85
    default:
      return 1
  }
}

function factorHorario(horario: string): number {
  switch (horario) {
    case "desayuno":
      return 0.82
    case "almuerzo":
      return 1
    case "cena":
      return 0.91
    default:
      return 1
  }
}

function calcularFactor(filtros: FiltrosReportes): number {
  return (
    factorFechas(filtros.desde, filtros.hasta) *
    factorServicio(filtros.servicio) *
    factorHorario(filtros.horario)
  )
}

function escalarItems(
  items: ReportesChartItem[],
  factor: number,
): ReportesChartItem[] {
  return items.map((item) => ({
    ...item,
    value: Math.max(1, Math.round(item.value * factor)),
  }))
}

function escalarSegmentos(
  segmentos: ReportesSegmento[],
  factor: number,
): ReportesSegmento[] {
  return segmentos.map((segmento) => ({
    ...segmento,
    value: Math.max(1, Math.round(segmento.value * factor)),
  }))
}

export function aplicarFiltrosReportes<T extends ReportesBase>(
  data: T,
  filtros: FiltrosReportes,
): T {
  const factor = calcularFactor(filtros)

  const kpis = data.kpis.map((kpi) => {
    const numerico = parseNumero(kpi.value)
    if (kpi.label.toLowerCase().includes("costo")) {
      return { ...kpi, value: formatearMoneda(numerico * factor) }
    }
    return { ...kpi, value: formatearEntero(numerico * factor) }
  })

  const segmentos = escalarSegmentos(data.estadoDietas.segmentos, factor)
  const totalNumerico = segmentos.reduce((sum, s) => sum + s.value, 0)

  const hitos = data.hitos.map((hito) => {
    const minutos = parseNumero(hito.tiempo)
    const ajustado = Math.max(1, Math.round(minutos * (2 - factor * 0.5)))
    return { ...hito, tiempo: `${ajustado} min` }
  })

  return {
    ...data,
    kpis,
    hitos,
    estadoDietas: {
      total: totalNumerico >= 1000 ? `${(totalNumerico / 1000).toFixed(1)}k` : String(totalNumerico),
      totalNumerico,
      segmentos,
    },
    tiposDieta: escalarItems(data.tiposDieta, factor),
    motivosDevolucion: escalarItems(data.motivosDevolucion, factor),
    distribucionServicio: escalarItems(data.distribucionServicio, factor),
  }
}
