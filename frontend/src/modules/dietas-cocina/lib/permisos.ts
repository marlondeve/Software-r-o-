import type { RutaDietas } from "@/modules/dietas-cocina/types/enums"
import { cargarConfigAccesoModulos } from "@/lib/configAccesoModulos"
import {
  obtenerMatrizPermisosApi,
  obtenerRutasPermitidasDesdeApi,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"

export type { RutaDietas }

const RUTAS_LOGISTICA_UI: RutaDietas[] = [
  "impresion-etiquetas",
  "recepcion-proveedor",
  "bandejas-piso",
]

const RUTAS_VALIDAS: RutaDietas[] = [
  "inicio",
  "dietas",
  "dietas-tarifas",
  "cocina",
  ...RUTAS_LOGISTICA_UI,
  "reportes-clinicos",
  "reportes-produccion",
  "conciliacion",
  "parametros",
  "auditoria",
  "usuarios",
]

function extraerRutaDietas(pathname: string): RutaDietas | null {
  const segmento = pathname.replace(/^\/dietas-cocina\/?/, "").split("/")[0]
  if (!segmento) return "inicio"
  if (!RUTAS_VALIDAS.includes(segmento as RutaDietas)) return null
  return segmento as RutaDietas
}

export function obtenerRutasPermitidas(rol: string | null): RutaDietas[] {
  if (!rol) return []

  const matriz = obtenerMatrizPermisosApi()
  if (matriz !== null) {
    return (obtenerRutasPermitidasDesdeApi(rol) ?? []) as RutaDietas[]
  }

  const config = cargarConfigAccesoModulos()
  return (config.permisosDietas[rol] ?? []) as RutaDietas[]
}

export function puedeAccederRuta(
  rol: string | null,
  pathname: string,
): boolean {
  if (!pathname.startsWith("/dietas-cocina")) return true

  const ruta = extraerRutaDietas(pathname)
  if (!ruta) return false

  return obtenerRutasPermitidas(rol).includes(ruta)
}

export function obtenerPlaceholderBusqueda(rol: string | null): string {
  if (!rol) return "Buscar..."
  if (obtenerRutasPermitidas(rol).includes("cocina")) {
    return "Buscar órdenes, pacientes..."
  }
  return "Buscar paciente o habitación..."
}

export function rutaDietasPermitida(
  rol: string | null,
  segmento: string,
): boolean {
  const rutas = obtenerRutasPermitidas(rol)
  const ruta = (segmento === "" ? "inicio" : segmento) as RutaDietas
  return rutas.includes(ruta)
}

export function tieneAccesoClinicoDietas(rol: string | null): boolean {
  return (
    rutaDietasPermitida(rol, "dietas") ||
    rutaDietasPermitida(rol, "dietas-tarifas") ||
    rutaDietasPermitida(rol, "conciliacion")
  )
}

/** Rol con permisos de administración del módulo (usuarios + parámetros). */
export function esRolAdministracionModulo(rol: string | null): boolean {
  return (
    rutaDietasPermitida(rol, "usuarios") &&
    rutaDietasPermitida(rol, "parametros")
  )
}

export function tieneAccesoLogisticaBandejas(rol: string | null): boolean {
  return RUTAS_LOGISTICA_UI.some((ruta) => rutaDietasPermitida(rol, ruta))
}

export function tieneAccesoReportesClinicos(rol: string | null): boolean {
  return rutaDietasPermitida(rol, "reportes-clinicos")
}

export function tieneAccesoReportesProduccion(rol: string | null): boolean {
  return rutaDietasPermitida(rol, "reportes-produccion")
}

export function tieneAccesoReportes(rol: string | null): boolean {
  return (
    tieneAccesoReportesClinicos(rol) || tieneAccesoReportesProduccion(rol)
  )
}

export const RUTA_LISTAR_CONCILIACION = 30
export const RUTA_APROBAR_CONCILIACION = 31
export const RUTA_RECHAZAR_CONCILIACION = 32
export const RUTA_CARGAR_PLANILLA_CONCILIACION = 33

/** Nutricionista y admin registran cantidades de cocina en conciliación. */
export function puedeCapturarCocinaConciliacion(rol: string | null): boolean {
  if (!rol) return false
  const clave = rol.trim().toLowerCase()
  if (clave === "administrador" || clave === "nutricionista") {
    return true
  }
  if (clave === "proveedor") return false

  const matriz = obtenerMatrizPermisosApi()
  if (matriz) {
    const entry =
      matriz.find((item) => item.rol?.toLowerCase() === clave) ??
      matriz.find((item) => item.rolId === rol)
    const rutas = entry?.rutas ?? []
    return (
      rutas.includes(RUTA_CARGAR_PLANILLA_CONCILIACION) ||
      rutas.includes(RUTA_APROBAR_CONCILIACION)
    )
  }

  return false
}

/** Nutricionista y Admin capturan cantidades y cierran líneas. */
export function puedeResolverConciliacion(rol: string | null): boolean {
  if (!rol) return false
  const clave = rol.trim().toLowerCase()
  if (clave === "proveedor") return false
  if (clave === "administrador" || clave === "nutricionista") return true

  const matriz = obtenerMatrizPermisosApi()
  if (matriz) {
    const entry =
      matriz.find((item) => item.rol?.toLowerCase() === clave) ??
      matriz.find((item) => item.rolId === rol)
    const rutas = entry?.rutas ?? []
    return (
      rutas.includes(RUTA_APROBAR_CONCILIACION) ||
      rutas.includes(RUTA_RECHAZAR_CONCILIACION)
    )
  }

  return false
}
