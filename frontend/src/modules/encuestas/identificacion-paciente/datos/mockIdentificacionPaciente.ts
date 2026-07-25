import type { PacienteEncontrado } from "@/modules/encuestas/types/patients"

export const TIPOS_DOCUMENTO = [
  "Cédula de Ciudadanía (CC)",
  "Tarjeta de Identidad (TI)",
  "Cédula de Extranjería (CE)",
  "Pasaporte",
]

export const mockPacienteEncontrado: PacienteEncontrado = {
  nombre: "Carlos Alberto Ramírez",
  documento: "CC: 1.023.456.789",
  edad: 45,
  sexo: "Masculino",
  elegible: true,
  canal: "telefonica",
  entidadEps: "SURA EPS",
  contrato: "Capita Integral 2023",
  servicio: "Urgencias Adultos",
  puntoAtencion: "Sede Principal",
  fechaAtencion: "15 Oct 2023, 08:45 AM",
  fechaRelativa: "Hace 3 días",
}
