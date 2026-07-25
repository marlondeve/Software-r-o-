import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export interface CensoRepository {
  obtenerPacientesHospitalizados(comida?: TiempoComida): Promise<Omit<FilaDieta, "id">[]>
}
