import { obtenerRolEnModulo } from "@/lib/modulos"
import type { Usuario } from "@/tipos/usuario"

export type RolDietas =
  | "Administrador"
  | "Nutricionista"
  | "Doctor"
  | "Proveedor"
  | "Enfermera"

const ROLES_DIETAS: RolDietas[] = [
  "Administrador",
  "Nutricionista",
  "Doctor",
  "Proveedor",
  "Enfermera",
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

export function comparteDashboardNutricion(rol: RolDietas | null): boolean {
  return (
    rol === "Nutricionista" || rol === "Doctor" || rol === "Administrador"
  )
}

export function resolverRolPermisos(rol: RolDietas): RolDietas {
  if (rol === "Doctor") return "Nutricionista"
  if (rol === "Administrador") return "Administrador"
  return rol
}
