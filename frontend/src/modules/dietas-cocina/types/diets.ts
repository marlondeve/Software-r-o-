import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"

export interface ComidaTab {
  id: TiempoComida
  label: string
}

export interface KpiDieta {
  id: string
  label: string
  value: number
  variant?: "default" | "destructive" | "warning" | "success" | "info" | "muted"
}

export interface FilaDieta {
  id: string
  pacienteId: string
  /** Consecutivo del ingreso en el HIS (cuando viene del API). */
  idIngreso?: number
  cedula?: string
  tipoDocumento?: string
  paciente: string
  edad: number
  servicio: string
  pabellon: string
  habitacion: string
  consistencia: string | null
  tipoDieta: string | null
  aislado?: boolean
  aislamiento: string
  alergico: boolean
  alergias: string
  observacionAislamiento: string
  observaciones: string
  descripcionDieta?: string
  solicitadoPor?: string
  solicitadoEn?: string
  /** true cuando la cancelación ocurre fuera del horario de novedades */
  cancelacionTardia?: boolean
  /** true cuando la cancelación fue por salida clínica HIS */
  cancelacionPorSalidaClinica?: boolean
  /**
   * true cuando el paciente egresó pasado el límite de novedades: la dieta no se
   * cancela porque ya fue producida y el proveedor debe enviarla igual.
   */
  salidaClinicaSostenida?: boolean
  estado: EstadoDieta
  comida: TiempoComida
  ordenCocinaId?: string
}

export interface EventoTrazabilidad {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  activo?: boolean
}
