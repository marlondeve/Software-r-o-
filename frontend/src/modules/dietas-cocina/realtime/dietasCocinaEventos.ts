import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

export const EVENTOS_DIETAS_COCINA = {
  FilaActualizada: "FilaActualizada",
  CensoActualizado: "CensoActualizado",
  OrdenActualizada: "OrdenActualizada",
  EtiquetasActualizadas: "EtiquetasActualizadas",
  ParametrosActualizados: "ParametrosActualizados",
  CatalogoActualizado: "CatalogoActualizado",
  ConciliacionActualizada: "ConciliacionActualizada",
  PermisosActualizados: "PermisosActualizados",
} as const

export type TipoEventoDietasCocina =
  (typeof EVENTOS_DIETAS_COCINA)[keyof typeof EVENTOS_DIETAS_COCINA]

export type EventoDietasCocina =
  | { tipo: typeof EVENTOS_DIETAS_COCINA.FilaActualizada; payload: unknown }
  | {
      tipo: typeof EVENTOS_DIETAS_COCINA.CensoActualizado
      payload: { fechaOperativa?: string; comida?: string | TiempoComida }
    }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.OrdenActualizada; payload: unknown }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.EtiquetasActualizadas; payload: unknown }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.ParametrosActualizados; payload?: unknown }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.CatalogoActualizado; payload?: unknown }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.ConciliacionActualizada; payload?: unknown }
  | { tipo: typeof EVENTOS_DIETAS_COCINA.PermisosActualizados; payload?: unknown }

type Listener = (evento: EventoDietasCocina) => void

const listeners = new Set<Listener>()

export function emitirEventoDietasCocina(evento: EventoDietasCocina): void {
  for (const listener of listeners) listener(evento)
}

export function suscribirEventosDietasCocina(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
