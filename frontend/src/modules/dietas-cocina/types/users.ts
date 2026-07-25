import type {
  EstadoUsuario,
  OrigenUsuario,
  RolDietas,
} from "@/modules/dietas-cocina/types/enums"

export interface UsuarioModulo {
  id: string
  nombre: string
  usuario: string
  correo: string
  rol: RolDietas
  servicioArea: string
  orgProveedora: string | null
  estado: EstadoUsuario
  ultimoAcceso: string
  origen: OrigenUsuario
}
