import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type {
  CrearOrdenDesdeDietaInput,
  EstadoCicloBandejas,
} from "@/modules/dietas-cocina/types/tray-cycle"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

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
  confirmarDieta(filaId: string): Promise<void>
  crearOrdenDesdeDieta(input: CrearOrdenDesdeDietaInput): Promise<string>
}
