import type {
  CanalEncuesta,
  EstadoEncuesta,
  EstadoSincronizacion,
  TonoRespuesta,
} from "@/modules/encuestas/types/enums"

export interface FilaEncuestaRealizada {
  id: string
  consecutivo: string
  fecha: string
  paciente: string
  documento: string
  entidad: string
  servicio: string
  puntoAtencion: string
  canal: CanalEncuesta
  encuestador: string
  sat: number | null
  nps: number | null
  estado: EstadoEncuesta
  comentarioNegativo?: boolean
  motivoAnulacion?: string
}

export interface RespuestaEncuestaDetalle {
  numero: number
  pregunta: string
  valor: number
  etiqueta: string
  tono: TonoRespuesta
  comentarioObligatorio?: string
}

export interface EventoHistorialEncuesta {
  titulo: string
  detalle: string
  actual?: boolean
}

export interface DetalleEncuestaRealizada {
  idCompleto: string
  canalDetalle: string
  estadoSincronizacion: EstadoSincronizacion
  respuestas: RespuestaEncuestaDetalle[]
  historial: EventoHistorialEncuesta[]
}
