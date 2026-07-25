import type {
  EstadoUsuarioEncuestas,
  OrigenUsuarioEncuestas,
  RolEncuestas,
} from "@/modules/encuestas/types/enums"

export interface UsuarioEncuestasModulo {
  id: string
  nombre: string
  usuario: string
  correo: string
  rol: RolEncuestas
  servicioArea: string
  orgProveedora: string | null
  estado: EstadoUsuarioEncuestas
  ultimoAcceso: string
  origen: OrigenUsuarioEncuestas
}
