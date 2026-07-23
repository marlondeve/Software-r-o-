import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { CrearOrdenDesdeDietaInput } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import type { MotivoDevolucion } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

export interface ConfirmarDevolucionInput {
  motivo: MotivoDevolucion
  observaciones?: string
  fotoDevolucion?: string
}

export interface EstadoCicloBandejas {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}

export interface CicloBandejasRepository {
  cargar(): Promise<EstadoCicloBandejas | null>
  guardar(estado: EstadoCicloBandejas): Promise<void>
  buscarEtiquetaPorCodigo(
    etiquetas: EtiquetaEnfermera[],
    codigo: string,
  ): EtiquetaEnfermera | undefined
}

export type CicloBandejasMutations = {
  marcarEnPreparacion: (ids: string[]) => void
  marcarComoLista: (ids: string[]) => void
  registrarDespacho: (ids: string[]) => void
  generarEtiquetas: (ordenIds: string[]) => string[]
  marcarEtiquetasImpresas: (etiquetaIds: string[]) => void
  reimprimirEtiquetas: (etiquetaIds: string[]) => void
  crearOrdenDesdeDieta: (input: CrearOrdenDesdeDietaInput) => string
  confirmarPreEntrega: (ids: string[], recibidoPor?: string) => void
  confirmarEntrega: (id: string) => void
  confirmarDevolucion: (id: string, input: ConfirmarDevolucionInput) => void
  actualizarChecklist: (
    ordenId: string,
    checklistId: string,
    completado: boolean,
  ) => void
}
