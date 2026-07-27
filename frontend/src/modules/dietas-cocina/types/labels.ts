import type {
  EstadoEtiqueta,
  EstadoLogisticaEtiqueta,
  MotivoDevolucion,
  TiempoComida,
} from "@/modules/dietas-cocina/types/enums"

export interface KpiEtiqueta {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive"
}

export interface EtiquetaDieta {
  id: string
  codigo: string
  pacienteId: string
  paciente: string
  documento: string
  edad: number
  aislamiento: boolean
  pabellon: string
  habitacion: string
  tipoDieta: string
  consistencia: string
  observaciones: string
  comida: TiempoComida
  fechaHora: string
  estado: EstadoEtiqueta
  qrPayload: string
}

export interface EtiquetaEnfermera extends EtiquetaDieta {
  estadoLogistica: EstadoLogisticaEtiqueta
  alergias?: string[]
  pabellonDetalle?: string
  cama?: string
  horaPreEntrega?: string
  horaEntrega?: string
  horaDevolucion?: string
  recibidoPor?: string
  motivoDevolucion?: MotivoDevolucion
  observacionesDevolucion?: string
  fotoDevolucion?: string
  ordenCocinaId?: string
  filaDietaId?: string
}

export interface KpiEnfermeraEtiqueta {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive"
}
