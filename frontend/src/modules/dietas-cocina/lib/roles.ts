import { obtenerRolEnModulo } from "@/lib/modulos"
import type { Usuario } from "@/types/user"

export type { RolDietas } from "@/modules/dietas-cocina/types/enums"

export function obtenerNombreRolDietas(usuario: Usuario | null): string | null {
  return obtenerRolEnModulo(usuario, "dietas-cocina")
}

/** @deprecated Use obtenerNombreRolDietas */
export function obtenerRolDietas(usuario: Usuario | null): string | null {
  return obtenerNombreRolDietas(usuario)
}

export function esRolAdministrador(rol: string | null | undefined): boolean {
  return rol?.trim().toLowerCase() === "administrador"
}
