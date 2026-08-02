import type { RutaDietas } from "@/modules/dietas-cocina/types/enums"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"

/** Rutas de navegación del módulo de reportes. */
export const RUTAS_REPORTES = {
  clinico: "/dietas-cocina/reportes-clinicos",
  produccion: "/dietas-cocina/reportes-produccion",
} as const

const ORDEN_RUTAS_REPORTES: RutaDietas[] = [
  "reportes-clinicos",
  "reportes-produccion",
]

/** Primera página de reportes permitida (clínicos → producción). */
export function obtenerPrimeraRutaReportesPermitida(
  rol: string | null,
): string | null {
  if (!rol) return null
  for (const ruta of ORDEN_RUTAS_REPORTES) {
    if (rutaDietasPermitida(rol, ruta)) {
      if (ruta === "reportes-clinicos") return RUTAS_REPORTES.clinico
      if (ruta === "reportes-produccion") return RUTAS_REPORTES.produccion
    }
  }
  return null
}
