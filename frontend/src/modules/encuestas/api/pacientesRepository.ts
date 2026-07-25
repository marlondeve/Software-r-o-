import type { Atencion, Paciente } from "@/api/types"

export interface PacientesRepository {
  buscarPacientes(termino: string): Promise<Paciente[]>
  obtenerAtencionesPaciente(
    cedula: string,
    tipoDocumento: string,
  ): Promise<Atencion[]>
}
