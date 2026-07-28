import type { LucideIcon } from "lucide-react"
import { ClipboardList, UtensilsCrossed } from "lucide-react"

import type { ModuloId } from "@/types/module"
import type { Usuario } from "@/types/user"

import { moduloHabilitado, omitirSeleccionModulo } from "@/lib/modulosFlags"

export interface ModuloConfig {
  id: ModuloId
  titulo: string
  descripcion: string
  rutaInicio: string
  icon: LucideIcon
}

export const modulosConfig: Record<ModuloId, ModuloConfig> = {
  "dietas-cocina": {
    id: "dietas-cocina",
    titulo: "Dietas y Cocina",
    descripcion: "Gestión de dietas, cocina, etiquetas y conciliación.",
    rutaInicio: "/dietas-cocina/inicio",
    icon: UtensilsCrossed,
  },
  encuestas: {
    id: "encuestas",
    titulo: "Encuestas SIAO",
    descripcion: "Captura, indicadores y análisis de encuestas institucionales.",
    rutaInicio: "/encuestas/inicio",
    icon: ClipboardList,
  },
}

const MODULO_ACTIVO_KEY = "bital:modulo-activo"

export function usuarioTieneAcceso(
  usuario: Usuario | null,
  moduloId: ModuloId,
): boolean {
  if (!moduloHabilitado(moduloId)) return false
  return usuario?.accesos.some((acceso) => acceso.moduloId === moduloId) ?? false
}

export function usuarioEsAdministrador(usuario: Usuario | null): boolean {
  return usuario?.esAdministrador ?? false
}

export function obtenerRolEnModulo(
  usuario: Usuario | null,
  moduloId: ModuloId,
): string | null {
  if (usuarioEsAdministrador(usuario)) {
    return "Administrador"
  }

  return (
    usuario?.accesos.find((acceso) => acceso.moduloId === moduloId)?.rol ?? null
  )
}

export function obtenerModulosDisponibles(usuario: Usuario | null): ModuloConfig[] {
  if (!usuario) return []

  return usuario.accesos
    .filter((acceso) => moduloHabilitado(acceso.moduloId))
    .map((acceso) => modulosConfig[acceso.moduloId])
    .filter(Boolean)
}

export function obtenerDestinoPostLogin(usuario: Usuario): string {
  const modulos = obtenerModulosDisponibles(usuario)
  if (modulos.length === 0) return "/login"

  if (modulos.length === 1 || omitirSeleccionModulo()) {
    const modulo = modulos[0]
    guardarModuloActivo(modulo.id)
    return modulo.rutaInicio
  }

  return "/modulos"
}

export function requiereSeleccionModulo(usuario: Usuario): boolean {
  return obtenerDestinoPostLogin(usuario) === "/modulos"
}

export function esRutaDeModulo(pathname: string): ModuloId | null {
  if (pathname.startsWith("/dietas-cocina")) return "dietas-cocina"
  if (pathname.startsWith("/encuestas") && moduloHabilitado("encuestas")) {
    return "encuestas"
  }
  return null
}

export function obtenerModuloActivo(): ModuloId | null {
  const value = sessionStorage.getItem(MODULO_ACTIVO_KEY)
  if (value === "dietas-cocina") return value
  if (value === "encuestas" && moduloHabilitado("encuestas")) return value
  return null
}

export function guardarModuloActivo(moduloId: ModuloId): void {
  sessionStorage.setItem(MODULO_ACTIVO_KEY, moduloId)
}

export function limpiarModuloActivo(): void {
  sessionStorage.removeItem(MODULO_ACTIVO_KEY)
}

export function resolverModuloActivo(usuario: Usuario | null): ModuloId {
  const guardado = obtenerModuloActivo()
  if (guardado && usuarioTieneAcceso(usuario, guardado)) {
    return guardado
  }

  return usuario?.accesos[0]?.moduloId ?? "dietas-cocina"
}
