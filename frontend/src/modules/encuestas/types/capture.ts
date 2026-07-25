import type {
  EstadoLlamada,
  ResultadoLlamada,
  TipoPreguntaEncuesta,
  ValorSatisfaccion,
} from "@/modules/encuestas/types/enums"

export interface IntentoLlamada {
  resultado: string
  fecha: string
  gestor: string
  nota?: string
}

export interface FilaCapturaTelefonica {
  id: string
  paciente: string
  documento: string
  telefono: string
  puntoAtencion: string
  servicio: string
  especialidad: string
  eps: string
  fechaCita: string
  intentos: number
  intentosMax: number
  ultimoIntento?: string
  horaReintento?: string
  estado: EstadoLlamada
  historialIntentos: IntentoLlamada[]
}

export interface OpcionEscalaSatisfaccion {
  valor: ValorSatisfaccion
  label: string
}

export interface OpcionUnica {
  id: string
  label: string
}

export interface SeccionEncuesta {
  id: string
  numero: number
  titulo: string
  pregunta: string
  tipo: TipoPreguntaEncuesta
  opciones: OpcionUnica[]
  opcional?: boolean
}

export { type ResultadoLlamada }
