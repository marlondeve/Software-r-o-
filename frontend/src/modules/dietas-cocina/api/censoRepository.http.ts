import type { CensoRepository } from "@/modules/dietas-cocina/types/repositories"
import { cargarFilasCensoDesdeApi } from "@/modules/dietas-cocina/lib/cargarCensoHospitalario"

export const censoRepositoryHttp: CensoRepository = {
  async obtenerPacientesHospitalizados(comida = "almuerzo") {
    const { filas } = await cargarFilasCensoDesdeApi(comida)
    return filas.filter((fila) => fila.comida === comida)
  },
}
