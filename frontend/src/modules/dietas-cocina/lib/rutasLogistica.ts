import type { RutaDietas } from "@/modules/dietas-cocina/types/enums"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"

/** Rutas de navegación del módulo de logística de bandejas. */
export const RUTAS_LOGISTICA = {
  impresion: "/dietas-cocina/impresion-etiquetas",
  recepcion: "/dietas-cocina/recepcion-proveedor",
  piso: "/dietas-cocina/bandejas-piso",
  recepcionEscaneo: "/dietas-cocina/recepcion-proveedor/escaneo",
  recepcionExito: "/dietas-cocina/recepcion-proveedor/exito",
  pisoEntrega: "/dietas-cocina/bandejas-piso/entrega",
  pisoConsulta: "/dietas-cocina/bandejas-piso/consulta",
  pisoDevolucion: "/dietas-cocina/bandejas-piso/devolucion",
  pisoExito: "/dietas-cocina/bandejas-piso/exito",
} as const

const ORDEN_RUTAS_LOGISTICA: RutaDietas[] = [
  "recepcion-proveedor",
  "bandejas-piso",
  "impresion-etiquetas",
]

export function rutaLogisticaConsulta(codigo: string): string {
  return `${RUTAS_LOGISTICA.pisoConsulta}/${encodeURIComponent(codigo)}`
}

export function rutaLogisticaDevolucion(tipo: string): string {
  return `${RUTAS_LOGISTICA.pisoDevolucion}/${tipo}`
}

/** Primera página de logística permitida para el rol (recepción → piso → impresión). */
export function obtenerPrimeraRutaLogisticaPermitida(
  rol: string | null,
): string | null {
  if (!rol) return null
  for (const ruta of ORDEN_RUTAS_LOGISTICA) {
    if (rutaDietasPermitida(rol, ruta)) {
      if (ruta === "impresion-etiquetas") return RUTAS_LOGISTICA.impresion
      if (ruta === "recepcion-proveedor") return RUTAS_LOGISTICA.recepcion
      if (ruta === "bandejas-piso") return RUTAS_LOGISTICA.piso
    }
  }
  return null
}
