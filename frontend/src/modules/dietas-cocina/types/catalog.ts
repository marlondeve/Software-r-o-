import type { EstadoDietaCatalogo } from "@/modules/dietas-cocina/types/enums"

export interface TarifaHistorico {
  id: string
  anio: number
  monto: number
  vigenciaDesde: string
  vigenciaHasta: string
  registradoPor: string
  motivoCambio: string
  creadoEn: string
  vigente: boolean
}

export interface DietaCatalogo {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoDietaCatalogo
  tarifaVigente: number
  fechaInicio: string
  fechaFin: string | null
  ultimaActualizacion: string
  usuario: string
  activa: boolean
  historicoTarifas: TarifaHistorico[]
}
