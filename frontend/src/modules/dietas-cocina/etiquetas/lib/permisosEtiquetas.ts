import { cargarConfigAccesoModulos } from "@/lib/configAccesoModulos"
import { normalizarRolDietas } from "@/modules/dietas-cocina/lib/roles"
import { capacidadesDesdeRutasApi } from "@/modules/dietas-cocina/api/mappers/permisos.mapper"
import {
  obtenerMatrizPermisosApi,
  useMatrizPermisosVersion,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import type { CapacidadEtiquetas, RolDietas } from "@/modules/dietas-cocina/types/enums"

/** Flujos en piso: entrega, rechazo y recogida (cualquier rol con permiso). */
export const CAPACIDADES_BANDEJAS_PISO: CapacidadEtiquetas[] = [
  "entrega_paciente",
  "rechazo_antes_entrega",
  "recogida_bandeja",
]

export const CAPACIDADES_ETIQUETAS: {
  id: CapacidadEtiquetas
  label: string
  grupo: "recepcion" | "bandejas" | "proveedor"
  descripcion?: string
}[] = [
  {
    id: "impresion_proveedor",
    label: "Impresión de etiquetas",
    grupo: "proveedor",
  },
  {
    id: "recepcion_proveedor",
    label: "Recepción del proveedor",
    grupo: "recepcion",
    descripcion: "Recibe bandejas del proveedor en planta (habitualmente enfermería).",
  },
  {
    id: "entrega_paciente",
    label: "Entrega al paciente",
    grupo: "bandejas",
  },
  {
    id: "rechazo_antes_entrega",
    label: "Rechazo antes de entrega",
    grupo: "bandejas",
  },
  {
    id: "recogida_bandeja",
    label: "Recogida de bandeja",
    grupo: "bandejas",
  },
]

export const TODAS_CAPACIDADES_ETIQUETAS: CapacidadEtiquetas[] =
  CAPACIDADES_ETIQUETAS.map((item) => item.id)

const CAPACIDADES_POR_ROL_DEFAULT: Record<RolDietas, CapacidadEtiquetas[]> = {
  Administrador: TODAS_CAPACIDADES_ETIQUETAS,
  Proveedor: ["impresion_proveedor"],
  Enfermera: ["recepcion_proveedor"],
  "Auxiliar de Cocina": [...CAPACIDADES_BANDEJAS_PISO],
  Nutricionista: [],
  Doctor: [],
}

export function obtenerCapacidadesEtiquetasDefault(
  rol: string | null,
): CapacidadEtiquetas[] {
  if (!rol) return []
  const normalizado = normalizarRolDietas(rol)
  if (normalizado) {
    return [...(CAPACIDADES_POR_ROL_DEFAULT[normalizado] ?? [])]
  }
  return []
}

export function obtenerCapacidadesEtiquetas(
  rol: string | null,
): CapacidadEtiquetas[] {
  if (!rol) return []
  if (rol === "Administrador") return TODAS_CAPACIDADES_ETIQUETAS

  const matriz = obtenerMatrizPermisosApi()
  if (matriz) {
    const clave = rol.trim().toLowerCase()
    const entry =
      matriz.find((item) => item.rol?.toLowerCase() === clave) ??
      matriz.find((item) => item.rolId === rol)
    if (entry?.rutas?.length) {
      return capacidadesDesdeRutasApi(entry.rutas)
    }
  }

  const config = cargarConfigAccesoModulos()
  const personalizadas = config.capacidadesEtiquetas?.[rol]
  if (personalizadas) return [...personalizadas]

  return obtenerCapacidadesEtiquetasDefault(rol)
}

export function puedeCapacidadEtiquetas(
  rol: string | null,
  capacidad: CapacidadEtiquetas,
): boolean {
  return obtenerCapacidadesEtiquetas(rol).includes(capacidad)
}

export function tieneVistaImpresionEtiquetas(rol: string | null): boolean {
  return puedeCapacidadEtiquetas(rol, "impresion_proveedor")
}

export function puedeRecepcionProveedor(rol: string | null): boolean {
  return puedeCapacidadEtiquetas(rol, "recepcion_proveedor")
}

export function tieneOperacionBandejasPiso(rol: string | null): boolean {
  return CAPACIDADES_BANDEJAS_PISO.some((capacidad) =>
    puedeCapacidadEtiquetas(rol, capacidad),
  )
}

/** Acceso al hub operativo de bandejas (recepción y/o piso). */
export function tieneVistaOperativaBandejas(rol: string | null): boolean {
  return (
    puedeRecepcionProveedor(rol) || tieneOperacionBandejasPiso(rol)
  )
}

export function resolverTituloEtiquetasOperativas(rol: string | null): string {
  const recepcion = puedeRecepcionProveedor(rol)
  const piso = tieneOperacionBandejasPiso(rol)

  if (recepcion && piso) return "Recepción y entrega de bandejas"
  if (recepcion) return "Recepción de bandejas del proveedor"
  if (piso) return "Entrega y recogida de bandejas"
  return "Etiquetas de bandejas"
}

export function filtrarCapacidadesEtiquetas(
  rol: string | null,
  capacidades: CapacidadEtiquetas[],
): CapacidadEtiquetas[] {
  const permitidas = new Set(obtenerCapacidadesEtiquetas(rol))
  return capacidades.filter((capacidad) => permitidas.has(capacidad))
}

/** Hook reactivo a la matriz API de permisos. */
export function useCapacidadesEtiquetas(rol: string | null): CapacidadEtiquetas[] {
  useMatrizPermisosVersion()
  return obtenerCapacidadesEtiquetas(rol)
}

export function usePuedeCapacidadEtiquetas(
  rol: string | null,
  capacidad: CapacidadEtiquetas,
): boolean {
  useMatrizPermisosVersion()
  return puedeCapacidadEtiquetas(rol, capacidad)
}

export function useTieneVistaOperativaBandejas(rol: string | null): boolean {
  useMatrizPermisosVersion()
  return tieneVistaOperativaBandejas(rol)
}
