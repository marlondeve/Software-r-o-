import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { FilaDieta, EventoTrazabilidad } from "@/modules/dietas-cocina/types/diets"
import type {
  CrearOrdenDesdeDietaInput,
  EstadoCicloBandejas,
} from "@/modules/dietas-cocina/types/tray-cycle"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FiltrosEtiquetas } from "@/modules/dietas-cocina/api/services/etiquetas.service"
import type { DatosSolicitudDietaInput } from "@/modules/dietas-cocina/api/mappers"

export interface CensoRepository {
  obtenerPacientesHospitalizados(comida?: TiempoComida): Promise<Omit<FilaDieta, "id">[]>
}

export interface CicloBandejasRepository {
  cargar(): Promise<EstadoCicloBandejas | null>
  guardar(estado: EstadoCicloBandejas): Promise<void>
  buscarEtiquetaPorCodigo(
    etiquetas: EtiquetaEnfermera[],
    codigo: string,
  ): EtiquetaEnfermera | undefined
}

export interface DietasRepository {
  confirmarDieta(filaId: string): Promise<FilaDieta>
  crearOrdenDesdeDieta(input: CrearOrdenDesdeDietaInput): Promise<string>
}

export interface CancelarDietaPayload {
  motivo: string
  justificacion: string
  aceptaFacturacion?: boolean
  rolUsuario?: string
}

export interface NovedadDietaPayload extends DatosSolicitudDietaInput {
  comida?: TiempoComida
  motivo?: string
}

export interface CatalogoDietaItem {
  id: string
  nombre: string
  descripcion?: string
}

export interface CensoOperativoResult {
  filas: FilaDieta[]
  ultimaSincronizacion?: string
}

export interface DietasOperativasRepository {
  obtenerCenso(fecha: string, comida: TiempoComida): Promise<CensoOperativoResult>
  obtenerDetalle(id: string): Promise<FilaDieta>
  obtenerHistorial(id: string): Promise<EventoTrazabilidad[]>
  guardarSolicitud(id: string, payload: DatosSolicitudDietaInput): Promise<FilaDieta>
  confirmar(id: string): Promise<FilaDieta>
  confirmarMasivo(ids: string[], usuario: string): Promise<void>
  cancelar(id: string, payload: CancelarDietaPayload): Promise<FilaDieta>
  registrarNovedad(id: string, payload: NovedadDietaPayload): Promise<FilaDieta>
  obtenerCatalogo(): Promise<CatalogoDietaItem[]>
}

export interface EtiquetasRepository {
  listar(filtros?: FiltrosEtiquetas): Promise<EtiquetaEnfermera[]>
  buscarPorCodigo(codigo: string): Promise<EtiquetaEnfermera>
  generar(body?: { ordenIds?: string[]; comida?: TiempoComida; fecha?: string }): Promise<EtiquetaEnfermera[]>
  marcarImpresas(etiquetaIds: string[]): Promise<void>
  marcarReimpresas(etiquetaIds: string[]): Promise<void>
  confirmarPreEntrega(etiquetaId: string, recibidoPor?: string): Promise<EtiquetaEnfermera>
  confirmarEntrega(etiquetaId: string): Promise<EtiquetaEnfermera>
  registrarDevolucion(etiquetaId: string, payload?: Record<string, unknown>): Promise<EtiquetaEnfermera>
  subirFotoDevolucion(etiquetaId: string, archivo: File): Promise<void>
  descargarPdf(params?: Record<string, string>): Promise<Blob>
}
