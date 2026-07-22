import { obtenerRolEnModulo } from "@/lib/modulos"
import type { Usuario } from "@/tipos/usuario"

export type RolEncuestas = "Administrador" | "Encuestador"

export const ROLES_ENCUESTAS_MODULO: RolEncuestas[] = ["Administrador", "Encuestador"]

const ALIAS_ROLES: Record<string, RolEncuestas> = {
  "Analista SIAO": "Encuestador",
  "Operador de encuestas": "Encuestador",
}

export function esRolEncuestas(rol: string): rol is RolEncuestas {
  return ROLES_ENCUESTAS_MODULO.includes(rol as RolEncuestas)
}

export function normalizarRolEncuestas(rol: string | null): RolEncuestas | null {
  if (!rol) return null
  if (esRolEncuestas(rol)) return rol
  return ALIAS_ROLES[rol] ?? null
}

export function obtenerRolEncuestas(usuario: Usuario | null): RolEncuestas | null {
  const rol = obtenerRolEnModulo(usuario, "encuestas")
  return normalizarRolEncuestas(rol)
}
