import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"

export interface FilaConciliacion {
  id: string
  comida: string
  lineaFcr: string
  etiquetaPlanilla: string
  tarifa: number
  cantidadSistema: number
  cantidadCocina: number | null
  valorSistema: number
  valorCocina: number | null
  diferenciaCantidad: number
  diferenciaEconomica: number | null
  sinEtiqueta: number
  huerfanas: number
  estado: EstadoConciliacion
  motivo?: string | null
  observaciones?: string | null
  numeroFactura?: string | null
  periodoDesde?: string
  periodoHasta?: string
}

export interface RegistroSistema {
  fecha: string
  paciente: string
  cedula?: string
  pabellon?: string
  habitacion: string
  estado: string
  estadoOrden?: string
  tipoClinico?: string
  lineaFcr?: string
  tieneEtiqueta?: boolean
  esHuerfana?: boolean
  alertas?: string[]
}

export interface DetalleConciliacion {
  titulo: string
  codigo: string
  badge: string
  sistema: { unidades: number; valor: string }
  cocina: { unidades: number | null; valor: string }
  diferencia: string
  registros: RegistroSistema[]
  totalRegistros: number
  alertas: string[]
  recomendaciones: string[]
  puedeResolver?: boolean
}
