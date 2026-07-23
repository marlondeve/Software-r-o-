import {
  normalizarRolDietas,
  resolverRolPermisos,
  type RolDietas,
} from "@/modules/dietas-cocina/lib/roles"
import { cargarConfigAccesoModulos } from "@/lib/configAccesoModulos"

export type RutaDietas =
  | "inicio"
  | "dietas"
  | "dietas-tarifas"
  | "cocina"
  | "etiquetas"
  | "reportes"
  | "conciliacion"
  | "parametros"
  | "auditoria"
  | "usuarios"

const RUTAS_CLINICAS: RutaDietas[] = [
  "inicio",
  "dietas",
  "dietas-tarifas",
  "reportes",
  "conciliacion",
  "parametros",
  "auditoria",
]

const PERMISOS_POR_ROL_DEFAULT: Record<RolDietas, RutaDietas[]> = {
  Administrador: [
    "inicio",
    "dietas",
    "dietas-tarifas",
    "cocina",
    "etiquetas",
    "reportes",
    "conciliacion",
    "parametros",
    "auditoria",
    "usuarios",
  ],
  Nutricionista: RUTAS_CLINICAS,
  Doctor: RUTAS_CLINICAS,
  Proveedor: ["inicio", "cocina", "etiquetas", "reportes"],
  Enfermera: ["inicio", "dietas", "etiquetas"],
}

function obtenerPermisosPorRol(): Record<RolDietas, RutaDietas[]> {
  const config = cargarConfigAccesoModulos()
  return {
    ...PERMISOS_POR_ROL_DEFAULT,
    ...config.permisosDietas,
  } as Record<RolDietas, RutaDietas[]>
}

const PLACEHOLDER_BUSQUEDA: Record<RolDietas, string> = {
  Administrador: "Buscar paciente o habitación...",
  Nutricionista: "Buscar paciente o habitación...",
  Doctor: "Buscar paciente o habitación...",
  Proveedor: "Buscar órdenes, pacientes...",
  Enfermera: "Buscar paciente o habitación...",
}

function extraerRutaDietas(pathname: string): RutaDietas | null {
  const segmento = pathname.replace(/^\/dietas-cocina\/?/, "").split("/")[0]
  if (!segmento) return "inicio"

  const rutasValidas: RutaDietas[] = [
    "inicio",
    "dietas",
    "dietas-tarifas",
    "cocina",
    "etiquetas",
    "reportes",
    "conciliacion",
    "parametros",
    "auditoria",
    "usuarios",
  ]
  return rutasValidas.includes(segmento as RutaDietas)
    ? (segmento as RutaDietas)
    : null
}

export function obtenerRutasPermitidas(rol: RolDietas | string | null): RutaDietas[] {
  const rolNormalizado = normalizarRolDietas(rol)
  if (!rolNormalizado) return []
  const rolPermisos = resolverRolPermisos(rolNormalizado)
  const permisos = obtenerPermisosPorRol()
  return permisos[rolPermisos] ?? []
}

export function puedeAccederRuta(
  rol: RolDietas | string | null,
  pathname: string,
): boolean {
  if (!pathname.startsWith("/dietas-cocina")) return true

  const ruta = extraerRutaDietas(pathname)
  if (!ruta) return false

  return obtenerRutasPermitidas(rol).includes(ruta)
}

export function obtenerPlaceholderBusqueda(
  rol: RolDietas | string | null,
): string {
  const rolNormalizado = normalizarRolDietas(rol)
  if (!rolNormalizado) return "Buscar..."
  return PLACEHOLDER_BUSQUEDA[rolNormalizado]
}

export function rutaDietasPermitida(
  rol: RolDietas | string | null,
  segmento: string,
): boolean {
  const rutas = obtenerRutasPermitidas(rol)
  const ruta = (segmento === "" ? "inicio" : segmento) as RutaDietas
  return rutas.includes(ruta)
}
