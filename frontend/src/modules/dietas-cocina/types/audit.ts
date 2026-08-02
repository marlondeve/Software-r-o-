import type { ModuloAuditoria, ResultadoAuditoria } from "@/modules/dietas-cocina/types/enums"

export interface CambioLegible {
  campo: string
  anterior?: string
  nuevo?: string
}

export interface CambioAuditoria {
  tipo: "diff" | "texto"
  lineas?: { prefijo: "-" | "+"; texto: string }[]
  texto?: string
  resumen?: string
}

export interface FilaAuditoria {
  id: string
  codigoAuditoria: string
  fechaHora: string
  usuario: {
    nombre: string
    rol: string
    iniciales: string
    esSistema?: boolean
  }
  modulo: ModuloAuditoria
  accion: string
  registroId: string
  cambios: CambioAuditoria
  resultado: ResultadoAuditoria
}

export interface EventoHistorialAuditoria {
  titulo: string
  tiempo: string
  actual?: boolean
}

export interface DetalleAuditoria {
  codigoAuditoria: string
  usuario: {
    nombre: string
    area: string
    iniciales: string
    esSistema?: boolean
  }
  fechaHora: string
  entidad: {
    etiqueta: string
    estado?: string
  }
  parametro?: string
  valorAnterior?: string
  valorNuevo?: string
  cambiosLegibles?: CambioLegible[]
  resumenCambios?: string
  jsonTecnico?: { antes?: string; despues?: string }
  justificacion?: string
  impacto?: {
    riesgoClinico: string
    riesgoClinicoNivel: "alto" | "medio" | "bajo" | "ninguno"
    impactoTarifa: string
    impactoTarifaNivel: "ninguno" | "medio" | "alto"
  }
  metadatos: {
    ip: string
    dispositivo: string
    sistema: string
  }
  historial: EventoHistorialAuditoria[]
  mensajeError?: string
}
