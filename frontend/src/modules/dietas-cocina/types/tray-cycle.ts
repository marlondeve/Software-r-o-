import type { MotivoDevolucion, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { TipoDevolucionEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

export interface ConfirmarDevolucionInput {
  motivo: MotivoDevolucion | string
  observaciones?: string
  fotoDevolucion?: string
  fotoArchivo?: File
  tipoDevolucion?: TipoDevolucionEtiqueta
  estadoDieta?: string
}

export interface EstadoCicloBandejas {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}

export interface EstadoCicloBandejasPersistido {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}

export interface EstadoDietasPersistido {
  filas: FilaDieta[]
  ultimaSincronizacion: string
}

export interface CrearOrdenDesdeDietaInput {
  id?: string
  ordenCocinaApiId?: string
  pacienteId: string
  paciente: string
  edad: number
  pabellon: string
  habitacion: string
  cama?: string
  tipoDieta: string
  consistencia: string
  comida: TiempoComida
  aislado?: boolean
  alergias?: string[]
  observaciones?: string
}

export type CicloBandejasMutations = {
  marcarEnPreparacion: (ids: string[]) => void
  marcarComoLista: (ids: string[]) => void
  registrarDespacho: (ids: string[]) => void
  generarEtiquetas: (ordenIds: string[]) => Promise<string[]>
  marcarEtiquetasImpresas: (etiquetaIds: string[]) => void
  reimprimirEtiquetas: (etiquetaIds: string[]) => void
  crearOrdenDesdeDieta: (input: CrearOrdenDesdeDietaInput) => string
  confirmarPreEntrega: (ids: string[], recibidoPor?: string) => Promise<void>
  confirmarEntrega: (id: string) => void
  confirmarDevolucion: (id: string, input: ConfirmarDevolucionInput) => Promise<void>
  actualizarChecklist: (
    ordenId: string,
    checklistId: string,
    completado: boolean,
  ) => void
}
