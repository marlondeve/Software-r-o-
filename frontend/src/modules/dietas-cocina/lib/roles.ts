import { obtenerRolEnModulo } from "@/lib/modulos"
import type { Usuario } from "@/types/user"
import type { RolDietas } from "@/modules/dietas-cocina/types/enums"

export type { RolDietas }

const ROLES_DIETAS: RolDietas[] = [
  "Administrador",
  "Nutricionista",
  "Doctor",
  "Proveedor",
  "Enfermera",
  "Auxiliar de Cocina",
]

const ALIAS_ROLES: Record<string, RolDietas> = {
  "Operador de dietas": "Proveedor",
}

export function esRolDietas(rol: string): rol is RolDietas {
  return ROLES_DIETAS.includes(rol as RolDietas)
}

export function normalizarRolDietas(rol: string | null): RolDietas | null {
  if (!rol) return null
  if (esRolDietas(rol)) return rol
  return ALIAS_ROLES[rol] ?? null
}

export function obtenerRolDietas(usuario: Usuario | null): RolDietas | null {
  const rol = obtenerRolEnModulo(usuario, "dietas-cocina")
  return normalizarRolDietas(rol)
}

export function obtenerNombreRolDietas(usuario: Usuario | null): string | null {
  return obtenerRolEnModulo(usuario, "dietas-cocina")
}

export function esRolAdministrador(rol: string | null | undefined): boolean {
  return rol?.trim().toLowerCase() === "administrador"
}

export function comparteDashboardNutricion(rol: RolDietas | string | null): boolean {
  if (!rol) return false
  const clave = rol.toLowerCase()
  return (
    clave === "nutricionista" ||
    clave === "doctor" ||
    clave === "administrador"
  )
}

export function resolverRolPermisos(rol: RolDietas): RolDietas {
  if (rol === "Doctor") return "Nutricionista"
  if (rol === "Administrador") return "Administrador"
  return rol
}
