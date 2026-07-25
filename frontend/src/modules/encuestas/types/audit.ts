import type { ResultadoAuditoriaEncuestas } from "@/modules/encuestas/types/enums"

export type DetalleAuditoriaEncuesta =
  | { tipo: "texto"; texto: string }
  | { tipo: "diff"; antes: string; despues: string }

export interface FilaAuditoriaEncuesta {
  id: string
  idEvento: string
  fecha: string
  relativo: string
  usuarioNombre: string
  usuarioRol: string
  modulo: string
  accion: string
  accionAlerta?: boolean
  idRegistro: string
  idSecundario: string
  detalle: DetalleAuditoriaEncuesta
  resultado: ResultadoAuditoriaEncuestas
  origenIp: string
  origenDispositivo: string
}

export interface ContextoRelacionado {
  tipo: "encuesta" | "paciente"
  titulo: string
  subtitulo: string
}

export interface ModificacionRegla {
  valorAnterior: string
  valorNuevo: string
}

export interface DetalleAuditoriaExtendido {
  contexto: ContextoRelacionado[]
  modificacion?: ModificacionRegla
  motivo?: string
}
