import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"

export interface FilaConciliacion {
  id: string
  tipo: string
  consistencia: string
  tiempo: string
  tarifa: string
  tarifaAlerta?: boolean
  cantSist: number
  cantFact: number
  difCant: number
  difEconomica: string
  estado: EstadoConciliacion
  /** Registros del sistema usados en el detalle (generados desde el ciclo). */
  registros?: RegistroSistema[]
}

export interface RegistroSistema {
  fecha: string
  paciente: string
  habitacion: string
  estado: string
}

export interface DetalleConciliacion {
  titulo: string
  codigo: string
  badge: string
  bital: { unidades: number; valor: string }
  proveedor: { unidades: number; valor: string }
  diferencia: string
  registros: RegistroSistema[]
  totalRegistros: number
}
