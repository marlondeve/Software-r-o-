import { getAtencionesByPaciente, searchPacientes } from "@/api"
import type { PacientesRepository } from "@/modules/encuestas/api/pacientesRepository"

export const pacientesRepositoryHttp: PacientesRepository = {
  async buscarPacientes(termino: string) {
    return searchPacientes(termino)
  },

  async obtenerAtencionesPaciente(cedula: string, tipoDocumento: string) {
    return getAtencionesByPaciente(cedula, tipoDocumento)
  },
}
