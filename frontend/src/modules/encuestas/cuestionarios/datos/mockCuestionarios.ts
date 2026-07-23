export type EstadoCuestionario = "activo" | "inactivo" | "borrador"
export type CanalCuestionario = "presencial" | "telefonico" | "ambos"

export interface Cuestionario {
  id: string
  nombre: string
  descripcion: string
  canal: CanalCuestionario
  preguntas: number
  estado: EstadoCuestionario
  actualizadoEn: string
}

export const CANALES_CUESTIONARIO: { value: CanalCuestionario; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "telefonico", label: "Telefónico" },
  { value: "ambos", label: "Ambos canales" },
]

export const ESTADOS_CUESTIONARIO: { value: EstadoCuestionario; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "borrador", label: "Borrador" },
]

export const mockCuestionarios: Cuestionario[] = [
  {
    id: "1",
    nombre: "Satisfacción - Hospitalización",
    descripcion: "Evalúa la experiencia general durante la estancia hospitalaria.",
    canal: "ambos",
    preguntas: 12,
    estado: "activo",
    actualizadoEn: "20 Oct 2023",
  },
  {
    id: "2",
    nombre: "Satisfacción - Urgencias",
    descripcion: "Enfocada en tiempos de espera y atención inicial.",
    canal: "presencial",
    preguntas: 9,
    estado: "activo",
    actualizadoEn: "18 Oct 2023",
  },
  {
    id: "3",
    nombre: "NPS - Consulta Externa",
    descripcion: "Mide la recomendación del servicio de consulta externa.",
    canal: "telefonico",
    preguntas: 6,
    estado: "activo",
    actualizadoEn: "15 Oct 2023",
  },
  {
    id: "4",
    nombre: "Satisfacción - Cirugía Ambulatoria",
    descripcion: "Seguimiento post procedimiento quirúrgico ambulatorio.",
    canal: "telefonico",
    preguntas: 10,
    estado: "borrador",
    actualizadoEn: "12 Oct 2023",
  },
  {
    id: "5",
    nombre: "Satisfacción - UCI (Familiares)",
    descripcion: "Dirigida a acompañantes de pacientes en cuidados intensivos.",
    canal: "presencial",
    preguntas: 8,
    estado: "inactivo",
    actualizadoEn: "02 Sep 2023",
  },
]
