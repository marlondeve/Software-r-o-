import type {
  CanalCuestionario,
  EstadoCuestionario,
} from "@/modules/encuestas/types/enums"

export interface Cuestionario {
  id: string
  nombre: string
  descripcion: string
  canal: CanalCuestionario
  preguntas: number
  estado: EstadoCuestionario
  actualizadoEn: string
}
