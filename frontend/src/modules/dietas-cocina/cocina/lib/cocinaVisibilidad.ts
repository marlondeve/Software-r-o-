import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"

/** Confirmada en adelante: lo que el proveedor puede ver y producir. */
const ESTADOS_ACTIVOS_EN_COCINA = new Set<EstadoDieta>([
  "confirmada",
  "por-iniciar",
  "preparando",
  "en-preparacion",
  "lista-despacho",
  "despachada",
  "recibida",
  "devuelta",
])

export type FilaVisibilidadCocina = Pick<
  FilaDieta,
  "estado" | "ordenCocinaId" | "cancelacionTardia"
>

/**
 * Dieta visible en cocina: solo las que llegaron a Confirmada (orden de cocina).
 * Una cancelada entra solo si alguna vez estuvo comprometida; Guardado/Solicitada
 * canceladas nunca aparecen porque nunca salieron del flujo clínico.
 */
export function estuvoComprometidaConCocina(fila: FilaVisibilidadCocina): boolean {
  if (fila.estado === "cancelada") {
    return Boolean(fila.ordenCocinaId || fila.cancelacionTardia)
  }
  return ESTADOS_ACTIVOS_EN_COCINA.has(fila.estado)
}
