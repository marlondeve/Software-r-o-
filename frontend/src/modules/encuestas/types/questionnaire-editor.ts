import type { TipoRespuesta } from "@/modules/encuestas/types/enums"

export interface OpcionRespuesta {
  id: string
  texto: string
  esNegativa: boolean
}

export interface CondicionLogica {
  id: string
  variable: string
  operador: string
  valor: string
}

export interface LogicaCondicional {
  activa: boolean
  condiciones: CondicionLogica[]
}

export interface PreguntaEditor {
  id: string
  codigoInterno: string
  texto: string
  descripcion: string
  tipoRespuesta: TipoRespuesta
  tipoBadgeLabel: string
  requerida: boolean
  habilitada: boolean
  opciones: OpcionRespuesta[]
  servicioAplicable: string
  canalCaptura: "presencial" | "llamada"
  logica: LogicaCondicional
  comportamientoAlerta: string
}

export interface SeccionEditor {
  id: string
  titulo: string
  preguntas: PreguntaEditor[]
}
