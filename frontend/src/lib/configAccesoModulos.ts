import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import type { ModuloId } from "@/types/module"

const STORAGE_KEY = "bital:config-acceso-modulos"

export type RolEncuestas = "Administrador" | "Analista SIAO" | "Operador de encuestas"

export type RutaEncuestas =
  | "inicio"
  | "captura-presencial"
  | "captura-telefonica"
  | "encuestas-realizadas"
  | "cuestionarios"
  | "indicadores"
  | "analisis-brechas"
  | "parametros"
  | "usuarios"
  | "auditoria"

export type RutaDietasConfig =
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

export interface ConfigAccesoModulos {
  rolesConAcceso: Record<ModuloId, string[]>
  permisosDietas: Record<RolDietas, RutaDietasConfig[]>
  permisosEncuestas: Record<RolEncuestas, RutaEncuestas[]>
  /** Permisos granulares de flujos QR en Etiquetas, por nombre de rol. */
  capacidadesEtiquetas: Record<string, CapacidadEtiquetas[]>
}

export const ROLES_DIETAS: RolDietas[] = [
  "Administrador",
  "Nutricionista",
  "Doctor",
  "Proveedor",
  "Enfermera",
  "Auxiliar de Cocina",
]

export const ROLES_ENCUESTAS: RolEncuestas[] = [
  "Administrador",
  "Analista SIAO",
  "Operador de encuestas",
]

export const RUTAS_DIETAS: { id: RutaDietasConfig; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "dietas", label: "Gestión de dietas" },
  { id: "dietas-tarifas", label: "Dietas y tarifas" },
  { id: "cocina", label: "Cocina y seguimiento" },
  { id: "etiquetas", label: "Etiquetas" },
  { id: "reportes", label: "Reportes" },
  { id: "conciliacion", label: "Conciliación" },
  { id: "parametros", label: "Parámetros" },
  { id: "auditoria", label: "Auditoría" },
  { id: "usuarios", label: "Usuarios y roles" },
]

export const RUTAS_ENCUESTAS: { id: RutaEncuestas; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "captura-presencial", label: "Captura presencial" },
  { id: "captura-telefonica", label: "Captura telefónica" },
  { id: "encuestas-realizadas", label: "Encuestas realizadas" },
  { id: "cuestionarios", label: "Cuestionarios" },
  { id: "indicadores", label: "Indicadores" },
  { id: "analisis-brechas", label: "Análisis de brechas" },
  { id: "parametros", label: "Parámetros" },
  { id: "usuarios", label: "Usuarios y roles" },
  { id: "auditoria", label: "Auditoría" },
]

const RUTAS_CLINICAS = RUTAS_DIETAS.map((r) => r.id).filter(
  (id) => id !== "cocina" && id !== "etiquetas",
)

const CAPACIDADES_BANDEJAS_PISO: CapacidadEtiquetas[] = [
  "entrega_paciente",
  "rechazo_antes_entrega",
  "recogida_bandeja",
]

const CONFIG_DEFAULT: ConfigAccesoModulos = {
  rolesConAcceso: {
    "dietas-cocina": [...ROLES_DIETAS],
    encuestas: [...ROLES_ENCUESTAS],
  },
  permisosDietas: {
    Administrador: RUTAS_DIETAS.map((r) => r.id),
    Nutricionista: RUTAS_CLINICAS,
    Doctor: RUTAS_CLINICAS,
    Proveedor: ["inicio", "cocina", "etiquetas", "reportes"],
    Enfermera: ["inicio", "dietas", "etiquetas"],
    "Auxiliar de Cocina": ["inicio", "etiquetas"],
  },
  permisosEncuestas: {
    Administrador: RUTAS_ENCUESTAS.map((r) => r.id),
    "Analista SIAO": RUTAS_ENCUESTAS.map((r) => r.id),
    "Operador de encuestas": [
      "inicio",
      "captura-presencial",
      "captura-telefonica",
      "encuestas-realizadas",
    ],
  },
  capacidadesEtiquetas: {
    Administrador: [
      "impresion_proveedor",
      "recepcion_proveedor",
      ...CAPACIDADES_BANDEJAS_PISO,
    ],
    Proveedor: ["impresion_proveedor"],
    Enfermera: ["recepcion_proveedor"],
    "Auxiliar de Cocina": [...CAPACIDADES_BANDEJAS_PISO],
    Nutricionista: [],
    Doctor: [],
  },
}

function clonarConfig(config: ConfigAccesoModulos): ConfigAccesoModulos {
  return {
    rolesConAcceso: {
      "dietas-cocina": [...config.rolesConAcceso["dietas-cocina"]],
      encuestas: [...config.rolesConAcceso.encuestas],
    },
    permisosDietas: { ...config.permisosDietas },
    permisosEncuestas: { ...config.permisosEncuestas },
    capacidadesEtiquetas: { ...config.capacidadesEtiquetas },
  }
}

export function obtenerConfigAccesoDefault(): ConfigAccesoModulos {
  return clonarConfig(CONFIG_DEFAULT)
}

export function cargarConfigAccesoModulos(): ConfigAccesoModulos {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return obtenerConfigAccesoDefault()

  try {
    const parsed = JSON.parse(raw) as ConfigAccesoModulos
    return {
      ...obtenerConfigAccesoDefault(),
      ...parsed,
      rolesConAcceso: {
        ...CONFIG_DEFAULT.rolesConAcceso,
        ...parsed.rolesConAcceso,
      },
      permisosDietas: {
        ...CONFIG_DEFAULT.permisosDietas,
        ...parsed.permisosDietas,
      },
      permisosEncuestas: {
        ...CONFIG_DEFAULT.permisosEncuestas,
        ...parsed.permisosEncuestas,
      },
      capacidadesEtiquetas: {
        ...CONFIG_DEFAULT.capacidadesEtiquetas,
        ...parsed.capacidadesEtiquetas,
      },
    }
  } catch {
    return obtenerConfigAccesoDefault()
  }
}

export function guardarConfigAccesoModulos(config: ConfigAccesoModulos): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function restablecerConfigAccesoModulos(): ConfigAccesoModulos {
  localStorage.removeItem(STORAGE_KEY)
  return obtenerConfigAccesoDefault()
}

export function rolTieneAccesoModulo(
  config: ConfigAccesoModulos,
  moduloId: ModuloId,
  rol: string,
): boolean {
  return config.rolesConAcceso[moduloId].includes(rol)
}

export function alternarAccesoModulo(
  config: ConfigAccesoModulos,
  moduloId: ModuloId,
  rol: string,
  activo: boolean,
): ConfigAccesoModulos {
  const roles = new Set(config.rolesConAcceso[moduloId])
  if (activo) roles.add(rol)
  else roles.delete(rol)

  return {
    ...config,
    rolesConAcceso: {
      ...config.rolesConAcceso,
      [moduloId]: Array.from(roles),
    },
  }
}

export function alternarPermisoRutaDietas(
  config: ConfigAccesoModulos,
  rol: RolDietas,
  ruta: RutaDietasConfig,
  activo: boolean,
): ConfigAccesoModulos {
  const rutas = new Set(config.permisosDietas[rol] ?? [])
  if (activo) rutas.add(ruta)
  else rutas.delete(ruta)

  return {
    ...config,
    permisosDietas: {
      ...config.permisosDietas,
      [rol]: Array.from(rutas) as RutaDietasConfig[],
    },
  }
}

export function alternarCapacidadEtiquetas(
  config: ConfigAccesoModulos,
  rol: string,
  capacidad: CapacidadEtiquetas,
  activo: boolean,
): ConfigAccesoModulos {
  const actuales = new Set(config.capacidadesEtiquetas[rol] ?? [])
  if (activo) actuales.add(capacidad)
  else actuales.delete(capacidad)

  return {
    ...config,
    capacidadesEtiquetas: {
      ...config.capacidadesEtiquetas,
      [rol]: Array.from(actuales) as CapacidadEtiquetas[],
    },
  }
}

export function alternarPermisoRutaEncuestas(
  config: ConfigAccesoModulos,
  rol: RolEncuestas,
  ruta: RutaEncuestas,
  activo: boolean,
): ConfigAccesoModulos {
  const rutas = new Set(config.permisosEncuestas[rol] ?? [])
  if (activo) rutas.add(ruta)
  else rutas.delete(ruta)

  return {
    ...config,
    permisosEncuestas: {
      ...config.permisosEncuestas,
      [rol]: Array.from(rutas) as RutaEncuestas[],
    },
  }
}
