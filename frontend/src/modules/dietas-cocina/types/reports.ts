export interface FiltrosReportes {
  desde: string
  hasta: string
  servicio: string
  horario: string
}

export interface ReportesKpi {
  clave?: string
  label: string
  value: string
  detalle?: string
  detalleVariant?: "positive" | "negative" | "neutral"
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
