import type {
  EstadoUsuario,
  OrigenUsuario,
} from "@/modules/dietas-cocina/types/enums"

export interface UsuarioModulo {
  id: string
  nombre: string
  usuario: string
  correo: string
  rolId: string
  rol: string
  servicioArea: string
  orgProveedora: string | null
  estado: EstadoUsuario
  ultimoAcceso: string
  origen: OrigenUsuario
}
