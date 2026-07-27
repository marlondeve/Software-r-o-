import { obtenerCandidatosCensoDesdeAtenciones } from "@/modules/dietas-cocina/api/services/atenciones-censo.service"
import type { CensoRepository } from "@/modules/dietas-cocina/types/repositories"

export const censoRepositoryHttp: CensoRepository = {
  obtenerPacientesHospitalizados(comida = "almuerzo") {
    return obtenerCandidatosCensoDesdeAtenciones(comida)
  },
}
