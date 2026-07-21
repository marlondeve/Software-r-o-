import type { AccesoModulo } from "@/tipos/modulo"

export interface Usuario {
  id: string
  email: string
  nombre: string
  iniciales: string
  esAdministrador: boolean
  accesos: AccesoModulo[]
}
