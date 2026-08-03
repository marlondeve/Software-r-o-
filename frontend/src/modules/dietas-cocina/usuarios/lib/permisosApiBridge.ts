import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import { capacidadesDesdeRutasApi } from "@/modules/dietas-cocina/api/mappers/permisos.mapper"
import { CAPACIDADES_BANDEJAS_PISO } from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import { permisosPorRolNombreDesdeApi } from "@/modules/dietas-cocina/lib/permisosMatrizCache"

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
  rol: string,
): RutaDietasConfig[] {
  const entry = permisosApi.find(
    (item) => item.rol?.toLowerCase() === rol.trim().toLowerCase(),
  )
  if (entry?.permisos) return permisosRecordToRutas(entry.permisos)
  return permisosPorRolNombreDesdeApi(permisosApi, rol) as RutaDietasConfig[]
}

/** Flujos granulares de bandejas en piso según rutas API (23–25). */
export function capacidadesBandejasDesdePermisosApi(
  permisosApi: PermisoRolDto[],
  rol: string,
): CapacidadEtiquetas[] {
  const entry = permisosApi.find(
    (item) => item.rol?.toLowerCase() === rol.trim().toLowerCase(),
  )
  if (entry?.rutas?.length) {
    return capacidadesDesdeRutasApi(entry.rutas).filter((cap) =>
      CAPACIDADES_BANDEJAS_PISO.includes(cap),
    )
  }

  return []
}
