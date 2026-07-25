import { mockPacienteEncontrado } from "@/modules/encuestas/identificacion-paciente/datos/mockIdentificacionPaciente"
import type { PacientesRepository } from "@/modules/encuestas/api/pacientesRepository"
import type { Atencion, Paciente } from "@/api/types"

const MOCK_PACIENTES: Paciente[] = [
  {
    cedula: "1023456789",
    tipoDocumento: "CC",
    nombreCompleto: mockPacienteEncontrado.nombre,
    edad: mockPacienteEncontrado.edad,
    sexo: "M",
  },
]

const MOCK_ATENCIONES: Atencion[] = [
  {
    cedula: "1023456789",
    tipoDocumento: "CC",
    consecutivo: 1,
    paciente: {
      cedula: "1023456789",
      tipoDocumento: "CC",
      nombreCompleto: mockPacienteEncontrado.nombre,
      edad: mockPacienteEncontrado.edad,
      sexo: "M",
    },
    claseProcedimiento: mockPacienteEncontrado.servicio,
    estadoActual: "Activo",
    estaActivo: true,
  },
]

export const pacientesRepositoryMock: PacientesRepository = {
  async buscarPacientes(termino: string) {
    const q = termino.trim().toLowerCase()
    if (!q) return []
    return MOCK_PACIENTES.filter(
      (p) =>
        p.nombreCompleto.toLowerCase().includes(q) ||
        p.cedula.includes(q),
    )
  },

  async obtenerAtencionesPaciente(cedula: string, tipoDocumento: string) {
    return MOCK_ATENCIONES.filter(
      (a) => a.cedula === cedula && a.tipoDocumento === tipoDocumento,
    )
  },
}
