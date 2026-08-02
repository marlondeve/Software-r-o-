import { cargarConfigAccesoModulos } from "@/lib/configAccesoModulos"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"
import { capacidadesDesdeRutasApi } from "@/modules/dietas-cocina/api/mappers/permisos.mapper"
import {
  obtenerMatrizPermisosApi,
  useMatrizPermisosVersion,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"

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

const RUTA_LISTAR_ETIQUETAS = 20

function capacidadesDesdeMatrizApi(rol: string): CapacidadEtiquetas[] {
  const matriz = obtenerMatrizPermisosApi()
  if (!matriz) return []

  const clave = rol.trim().toLowerCase()
  const entry =
    matriz.find((item) => item.rol?.toLowerCase() === clave) ??
    matriz.find((item) => item.rolId === rol)

  if (!entry?.rutas?.length) return []

  const caps = capacidadesDesdeRutasApi(entry.rutas)
  if (caps.length === 0 && entry.rutas.includes(RUTA_LISTAR_ETIQUETAS)) {
    return [...TODAS_CAPACIDADES_ETIQUETAS]
  }
  return caps
}

export function obtenerCapacidadesEtiquetas(
  rol: string | null,
): CapacidadEtiquetas[] {
  if (!rol) return []

  const matriz = obtenerMatrizPermisosApi()
  if (matriz !== null) {
    return capacidadesDesdeMatrizApi(rol)
  }

  const config = cargarConfigAccesoModulos()
  const capsConfig = config.capacidadesEtiquetas?.[rol]
  if (capsConfig && capsConfig.length > 0) {
    return capsConfig
  }

  const caps: CapacidadEtiquetas[] = []
  if (rutaDietasPermitida(rol, "impresion-etiquetas")) {
    caps.push("impresion_proveedor")
  }
  if (rutaDietasPermitida(rol, "recepcion-proveedor")) {
    caps.push("recepcion_proveedor")
  }
  if (rutaDietasPermitida(rol, "bandejas-piso")) {
    caps.push(...CAPACIDADES_BANDEJAS_PISO)
  }
  return caps
}

export function puedeCapacidadEtiquetas(
  rol: string | null,
  capacidad: CapacidadEtiquetas,
): boolean {
  return obtenerCapacidadesEtiquetas(rol).includes(capacidad)
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
