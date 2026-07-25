import type { CensoRepository } from "@/modules/dietas-cocina/api/censoRepository"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"

/** Pacientes nuevos del censo hospitalario (demo). */
const CENSO_NUEVOS: Omit<FilaDieta, "id">[] = [
  {
    pacienteId: "PAC-11001",
    paciente: "Salazar, L.",
    edad: 38,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    habitacion: "303-B",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "Ingreso reciente — pendiente valoración nutricional.",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    pacienteId: "PAC-11002",
    paciente: "Peña, R.",
    edad: 52,
    servicio: "Cirugía General",
    pabellon: "Pab. Norte",
    habitacion: "405-C",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    pacienteId: "PAC-11003",
    paciente: "Ortiz, M.",
    edad: 67,
    servicio: "UCI",
    pabellon: "Pab. Norte",
    habitacion: "316-A",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Contacto",
    alergico: true,
    alergias: "Penicilina",
    observacionAislamiento: "Precauciones de contacto.",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
]

export const censoRepositoryMock: CensoRepository = {
  async obtenerPacientesHospitalizados(comida = "almuerzo") {
    return CENSO_NUEVOS.map((fila) => ({ ...fila, comida }))
  },
}
