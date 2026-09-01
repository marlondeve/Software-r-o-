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
export const RUTA_LISTAR_ETIQUETAS = 20
/** Hub de bandejas en piso sin flujos operativos (23–25). */
export const RUTA_BANDEJAS_PISO = 26
export const RUTA_EXPORTAR_REPORTES = 41
export const RUTA_VER_REPORTES_CLINICOS = 42
export const RUTA_VER_REPORTES_PRODUCCION = 43

/** Códigos clínicos reales (dietas + catálogo). Sin conciliación ni etiquetas. */
const CODIGOS_LEGACY_REPORTES_CLINICOS = [1, 2, 3, 4, 5, 6, 7, 8]
/** Códigos de cocina / órdenes. Sin impresión de etiquetas (21). */
const CODIGOS_LEGACY_REPORTES_PRODUCCION = [10, 11, 12, 13]

/** Permisos granulares API (`RutaDietas`) agrupados por sección del sidebar UI. */
const RUTA_UI_A_API: Record<RutaDietasConfig, number[]> = {
  inicio: [40],
  dietas: [1, 2, 3, 4],
  "dietas-tarifas": [5, 6, 7, 8],
  cocina: [10, 11, 12, 13],
  "impresion-etiquetas": [RUTA_LISTAR_ETIQUETAS, CAPACIDAD_A_RUTA_API.impresion_proveedor],
  "recepcion-proveedor": [RUTA_LISTAR_ETIQUETAS, CAPACIDAD_A_RUTA_API.recepcion_proveedor],
  "bandejas-piso": [RUTA_LISTAR_ETIQUETAS, RUTA_BANDEJAS_PISO],
  conciliacion: [30, 31, 32, 33],
  "reportes-clinicos": [RUTA_VER_REPORTES_CLINICOS],
  "reportes-produccion": [RUTA_VER_REPORTES_PRODUCCION],
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

function inferirRutasLogisticaDesdeApi(setApi: Set<number>): Record<string, boolean> {
  const tieneListar = setApi.has(RUTA_LISTAR_ETIQUETAS)
  const caps = RUTAS_CAPACIDAD_ETIQUETAS.filter((codigo) => setApi.has(codigo))

  const impresion =
    setApi.has(CAPACIDAD_A_RUTA_API.impresion_proveedor) ||
    (tieneListar && caps.length === 0)
  const recepcion = setApi.has(CAPACIDAD_A_RUTA_API.recepcion_proveedor)
  const piso =
    setApi.has(RUTA_BANDEJAS_PISO) ||
    RUTAS_CAPACIDAD_ETIQUETAS.some(
      (codigo) =>
        codigo !== CAPACIDAD_A_RUTA_API.impresion_proveedor &&
        codigo !== CAPACIDAD_A_RUTA_API.recepcion_proveedor &&
        setApi.has(codigo),
    )

  return {
    "impresion-etiquetas": impresion,
    "recepcion-proveedor": recepcion,
    "bandejas-piso": piso,
  }
}

function inferirRutasReportesDesdeApi(setApi: Set<number>): Record<string, boolean> {
  if (
    setApi.has(RUTA_VER_REPORTES_CLINICOS) ||
    setApi.has(RUTA_VER_REPORTES_PRODUCCION)
  ) {
    return {
      "reportes-clinicos": setApi.has(RUTA_VER_REPORTES_CLINICOS),
      "reportes-produccion": setApi.has(RUTA_VER_REPORTES_PRODUCCION),
    }
  }

  if (!setApi.has(RUTA_EXPORTAR_REPORTES)) {
    return {
      "reportes-clinicos": false,
      "reportes-produccion": false,
    }
  }

  const esAdmin = setApi.has(70) && setApi.has(71)
  const clinico =
    esAdmin ||
    CODIGOS_LEGACY_REPORTES_CLINICOS.some((codigo) => setApi.has(codigo))
  const produccion =
    esAdmin ||
    CODIGOS_LEGACY_REPORTES_PRODUCCION.some((codigo) => setApi.has(codigo))

  if (!clinico && !produccion) {
    return {
      "reportes-clinicos": true,
      "reportes-produccion": true,
    }
  }

  return {
    "reportes-clinicos": clinico,
    "reportes-produccion": produccion,
  }
}

function permisosUiDesdeRutasApi(rutasApi: number[]): Record<string, boolean> {
  const setApi = new Set(rutasApi)
  const logistica = inferirRutasLogisticaDesdeApi(setApi)
  const reportes = inferirRutasReportesDesdeApi(setApi)

  return Object.fromEntries(
    RUTAS_DIETAS.map((ruta) => {
      if (
        ruta.id === "impresion-etiquetas" ||
        ruta.id === "recepcion-proveedor" ||
        ruta.id === "bandejas-piso"
      ) {
        return [ruta.id, logistica[ruta.id] ?? false]
      }
      if (ruta.id === "reportes-clinicos" || ruta.id === "reportes-produccion") {
        return [ruta.id, reportes[ruta.id] ?? false]
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
    if (ruta.id === "reportes-clinicos" || ruta.id === "reportes-produccion") {
      continue
    }
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

  rutas = rutas.filter(
    (codigo) =>
      codigo !== RUTA_LISTAR_ETIQUETAS &&
      codigo !== RUTA_BANDEJAS_PISO &&
      !RUTAS_CAPACIDAD_ETIQUETAS.includes(codigo) &&
      codigo !== RUTA_EXPORTAR_REPORTES,
  )

  if (permisos["impresion-etiquetas"]) {
    rutas.push(RUTA_LISTAR_ETIQUETAS, CAPACIDAD_A_RUTA_API.impresion_proveedor)
  }
  if (permisos["recepcion-proveedor"]) {
    rutas.push(RUTA_LISTAR_ETIQUETAS, CAPACIDAD_A_RUTA_API.recepcion_proveedor)
  }
  if (permisos["bandejas-piso"]) {
    rutas.push(RUTA_LISTAR_ETIQUETAS)
    const capsBandejas = (capacidadesEtiquetas ?? []).filter((cap) =>
      (
        [
          "entrega_paciente",
          "rechazo_antes_entrega",
          "recogida_bandeja",
        ] as CapacidadEtiquetas[]
      ).includes(cap),
    )
    for (const cap of capsBandejas) {
      rutas.push(CAPACIDAD_A_RUTA_API[cap])
    }
    if (capsBandejas.length === 0) {
      rutas.push(RUTA_BANDEJAS_PISO)
    }
  }

  if (permisos["reportes-clinicos"]) {
    rutas.push(RUTA_VER_REPORTES_CLINICOS)
  }
  if (permisos["reportes-produccion"]) {
    rutas.push(RUTA_VER_REPORTES_PRODUCCION)
  }
  if (permisos["reportes-clinicos"] || permisos["reportes-produccion"]) {
    rutas.push(RUTA_EXPORTAR_REPORTES)
  }

  return { rutas: Array.from(new Set(rutas)).sort((a, b) => a - b) }
}

export { rutasApiDesdePermisosUi, permisosUiDesdeRutasApi, RUTA_UI_A_API }
