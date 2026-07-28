import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"

/** Permisos granulares API (`RutaDietas`) agrupados por sección del sidebar UI. */
const RUTA_UI_A_API: Record<RutaDietasConfig, number[]> = {
  inicio: [40],
  dietas: [1, 2, 3, 4],
  "dietas-tarifas": [5, 6, 7, 8],
  cocina: [10, 11, 12, 13],
  etiquetas: [20, 21],
  conciliacion: [30, 31, 32],
  reportes: [41],
  parametros: [50, 51],
  auditoria: [60],
  usuarios: [70, 71],
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizarRutasApi(valor: unknown): number[] {
  if (!Array.isArray(valor)) return []
  return valor
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
}

function permisosUiDesdeRutasApi(rutasApi: number[]): Record<string, boolean> {
  const setApi = new Set(rutasApi)
  return Object.fromEntries(
    RUTAS_DIETAS.map((ruta) => [
      ruta.id,
      RUTA_UI_A_API[ruta.id].some((codigo) => setApi.has(codigo)),
    ]),
  )
}

function rutasApiDesdePermisosUi(permisos: Record<string, boolean>): number[] {
  const codigos = new Set<number>()
  for (const ruta of RUTAS_DIETAS) {
    if (!permisos[ruta.id]) continue
    for (const codigo of RUTA_UI_A_API[ruta.id]) {
      codigos.add(codigo)
    }
  }
  if (codigos.size > 0) {
    codigos.add(40)
  }
  return Array.from(codigos).sort((a, b) => a - b)
}

function mapEntradaPermisos(item: Record<string, unknown>): PermisoRolDto | null {
  const rolId = String(normalizarClave(item, "id", "Id", "rolId", "RolId") ?? "")
  const rol = String(normalizarClave(item, "nombre", "Nombre", "rol", "Rol") ?? "")
  const rutasRaw = normalizarClave(item, "rutas", "Rutas")

  if (rutasRaw != null) {
    return {
      rolId: rolId || undefined,
      rol: rol || undefined,
      permisos: permisosUiDesdeRutasApi(normalizarRutasApi(rutasRaw)),
      rutas: normalizarRutasApi(rutasRaw),
    }
  }

  const permisosRaw = normalizarClave(item, "permisos", "Permisos")
  if (permisosRaw && typeof permisosRaw === "object") {
    return {
      rolId: rolId || undefined,
      rol: rol || undefined,
      permisos: permisosRaw as Record<string, boolean>,
    }
  }

  if (!rol && !rolId) return null

  return {
    rolId: rolId || undefined,
    rol: rol || undefined,
    permisos: permisosUiDesdeRutasApi([]),
  }
}

/** Convierte `GET /roles/permisos` → lista UI `{ rolId, rol, permisos }`. */
export function mapMatrizPermisosResponse(payload: unknown): PermisoRolDto[] {
  const registro = asRecord(payload) ?? {}
  const dataRaw = normalizarClave(registro, "data", "Data") ?? registro

  if (Array.isArray(dataRaw)) {
    return dataRaw
      .map((item) => mapEntradaPermisos(asRecord(item) ?? {}))
      .filter((item): item is PermisoRolDto => item != null)
  }

  const matriz = asRecord(dataRaw) ?? {}
  return Object.entries(matriz).map(([clave, rutasRaw]) => ({
    rol: clave,
    permisos: permisosUiDesdeRutasApi(normalizarRutasApi(rutasRaw)),
    rutas: normalizarRutasApi(rutasRaw),
  }))
}

/** Convierte toggles UI → body `PUT /roles/{id}/permisos`. */
export function mapPermisosUiToActualizarRequest(
  permisos: Record<string, boolean>,
): { rutas: number[] } {
  return { rutas: rutasApiDesdePermisosUi(permisos) }
}

export { rutasApiDesdePermisosUi, permisosUiDesdeRutasApi, RUTA_UI_A_API }
