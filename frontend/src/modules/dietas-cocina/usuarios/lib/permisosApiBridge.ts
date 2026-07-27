import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"

export function permisosRecordToRutas(
  permisos: Record<string, boolean> | undefined,
): RutaDietasConfig[] {
  if (!permisos) return []
  return RUTAS_DIETAS.filter((ruta) => permisos[ruta.id]).map((ruta) => ruta.id)
}

export function rutasToPermisosRecord(
  rutas: RutaDietasConfig[],
): Record<string, boolean> {
  const activas = new Set(rutas)
  return Object.fromEntries(
    RUTAS_DIETAS.map((ruta) => [ruta.id, activas.has(ruta.id)]),
  )
}

export function contarPermisosActivos(
  permisos: Record<string, boolean> | undefined,
): number {
  return permisosRecordToRutas(permisos).length
}

export function permisosPorRolDesdeApi(
  permisosApi: Array<{ rol?: string; permisos?: Record<string, boolean> }>,
  rol: RolDietas,
): RutaDietasConfig[] {
  const entry = permisosApi.find((item) => item.rol === rol)
  return permisosRecordToRutas(entry?.permisos)
}
