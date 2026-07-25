import type { AccesoModulo } from "@/types/module"

export interface Usuario {
  id: string
  email: string
  nombre: string
  iniciales: string
  esAdministrador: boolean
  accesos: AccesoModulo[]
}
