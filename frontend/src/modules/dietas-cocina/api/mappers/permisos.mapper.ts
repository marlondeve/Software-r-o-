import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { mapRolDominioAApi } from "@/modules/dietas-cocina/api/mappers/usuarios.mapper"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS, ROLES_DIETAS } from "@/lib/configAccesoModulos"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { RolDietas } from "@/modules/dietas-cocina/types/enums"

/** Permisos granulares API (`RutaDietas`) agrupados por sección del sidebar UI. */
const RUTA_UI_A_API: Record<RutaDietasConfig, number[]> = {
  inicio: [40],
  dietas: [1, 2, 3, 4],
  "dietas-tarifas": [3],
  cocina: [10, 11, 12, 13],
  etiquetas: [20, 21],
  conciliacion: [30, 31, 32],
  reportes: [41],
  parametros: [50, 51],
  auditoria: [60],
  usuarios: [70, 71],
}

const ROL_API_A_DOMINIO_PERMISOS: Record<string, RolDietas> = {
  admin: "Administrador",
  nutricionista: "Nutricionista",
  cocinero: "Proveedor",
  enfermera: "Enfermera",
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

function mapRolApiPermisosADominio(rolApi: string): RolDietas | null {
  const clave = rolApi.trim().toLowerCase()
  return ROL_API_A_DOMINIO_PERMISOS[clave] ?? null
}

/** Convierte `GET /roles/permisos` → lista UI `{ rol, permisos }`. */
export function mapMatrizPermisosResponse(payload: unknown): PermisoRolDto[] {
  const registro = asRecord(payload) ?? {}
  const matrizRaw =
    normalizarClave(registro, "data", "Data") ?? registro

  const matriz = asRecord(matrizRaw) ?? {}
  const porRol = new Map<RolDietas, Record<string, boolean>>()

  for (const [rolApi, rutasRaw] of Object.entries(matriz)) {
    const rolDominio = mapRolApiPermisosADominio(rolApi)
    if (!rolDominio) continue
    porRol.set(rolDominio, permisosUiDesdeRutasApi(normalizarRutasApi(rutasRaw)))
  }

  const nutricionista = porRol.get("Nutricionista")

  return ROLES_DIETAS.map((rol) => ({
    rol,
    permisos:
      rol === "Doctor" && nutricionista
        ? { ...nutricionista }
        : porRol.get(rol) ?? permisosUiDesdeRutasApi([]),
  }))
}

/** Convierte toggles UI → body `PUT /roles/{rol}/permisos`. */
export function mapPermisosUiToActualizarRequest(
  permisos: Record<string, boolean>,
): { rutas: number[] } {
  return { rutas: rutasApiDesdePermisosUi(permisos) }
}

export function rolPermisosParaApi(rol: RolDietas): string {
  return mapRolDominioAApi(rol === "Doctor" ? "Nutricionista" : rol)
}
