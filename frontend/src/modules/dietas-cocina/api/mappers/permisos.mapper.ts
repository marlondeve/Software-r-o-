import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"

/** Rutas API granulares por capacidad operativa de etiquetas. */
export const CAPACIDAD_A_RUTA_API: Record<CapacidadEtiquetas, number> = {
  impresion_proveedor: 21,
  recepcion_proveedor: 22,
  entrega_paciente: 23,
  rechazo_antes_entrega: 24,
  recogida_bandeja: 25,
}

const RUTAS_CAPACIDAD_ETIQUETAS = Object.values(CAPACIDAD_A_RUTA_API)
const RUTA_LISTAR_ETIQUETAS = 20

/** Permisos granulares API (`RutaDietas`) agrupados por sección del sidebar UI. */
const RUTA_UI_A_API: Record<RutaDietasConfig, number[]> = {
  inicio: [40],
  dietas: [1, 2, 3, 4],
  "dietas-tarifas": [5, 6, 7, 8],
  cocina: [10, 11, 12, 13],
  etiquetas: [RUTA_LISTAR_ETIQUETAS],
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

export function capacidadesDesdeRutasApi(rutas: number[]): CapacidadEtiquetas[] {
  const caps: CapacidadEtiquetas[] = []
  for (const [capacidad, codigo] of Object.entries(CAPACIDAD_A_RUTA_API) as [
    CapacidadEtiquetas,
    number,
  ][]) {
    if (rutas.includes(codigo)) caps.push(capacidad)
  }
  return caps
}

export function rutasApiDesdeCapacidadesEtiquetas(
  capacidades: CapacidadEtiquetas[],
): number[] {
  const codigos = new Set<number>([RUTA_LISTAR_ETIQUETAS])
  for (const capacidad of capacidades) {
    codigos.add(CAPACIDAD_A_RUTA_API[capacidad])
  }
  return Array.from(codigos)
}

function permisosUiDesdeRutasApi(rutasApi: number[]): Record<string, boolean> {
  const setApi = new Set(rutasApi)
  const tieneEtiquetas =
    setApi.has(RUTA_LISTAR_ETIQUETAS) ||
    RUTAS_CAPACIDAD_ETIQUETAS.some((codigo) => setApi.has(codigo))

  return Object.fromEntries(
    RUTAS_DIETAS.map((ruta) => {
      if (ruta.id === "etiquetas") {
        return [ruta.id, tieneEtiquetas]
      }
      return [
        ruta.id,
        RUTA_UI_A_API[ruta.id].some((codigo) => setApi.has(codigo)),
      ]
    }),
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
  capacidadesEtiquetas?: CapacidadEtiquetas[],
): { rutas: number[] } {
  let rutas = rutasApiDesdePermisosUi(permisos)

  if (permisos.etiquetas) {
    rutas = rutas.filter(
      (codigo) =>
        codigo !== RUTA_LISTAR_ETIQUETAS &&
        !RUTAS_CAPACIDAD_ETIQUETAS.includes(codigo),
    )
    rutas.push(...rutasApiDesdeCapacidadesEtiquetas(capacidadesEtiquetas ?? []))
  } else {
    rutas = rutas.filter(
      (codigo) =>
        codigo !== RUTA_LISTAR_ETIQUETAS &&
        !RUTAS_CAPACIDAD_ETIQUETAS.includes(codigo),
    )
  }

  return { rutas: Array.from(new Set(rutas)).sort((a, b) => a - b) }
}

export { rutasApiDesdePermisosUi, permisosUiDesdeRutasApi, RUTA_UI_A_API }
