import type {
  EstadoCocina,
  EstadoLogisticaEtiqueta,
  FiltroSeguimientoCocina,
  TiempoComida,
} from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

export interface ChecklistItem {
  id: string
  label: string
  obligatorio: boolean
  completado: boolean
}

export interface OrdenCocina {
  id: string
  /** ID de la orden en Bital.ApiNegocio (`OrdenesCocina`), distinto del id de fila dieta. */
  ordenCocinaApiId?: string
  etiquetaId?: string
  pacienteId: string
  paciente: string
  edad: number
  pabellon: string
  habitacion: string
  cama?: string
  servicio?: string
  tipoDieta: string
  consistencia: string
  comida: TiempoComida
  aislado: boolean
  alergias: string[]
  observaciones: string
  estadoCocina: EstadoCocina
  estadoLogistica?: EstadoLogisticaEtiqueta
  etiquetaImpresa: boolean
  etiquetaGenerada: boolean
  checklist: ChecklistItem[]
}

export interface KpiCocina {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive" | "warning" | "muted"
}

export interface FiltrosCocina {
  pabellon: string
  habitacion: string
  tipoDieta: string
  consistencia: string
  estadoCocina: string
  seguimiento: FiltroSeguimientoCocina
  soloAislados: boolean
  busqueda: string
}

export type ResolverEtiquetaOrden = (ordenId: string) => EtiquetaEnfermera | undefined
