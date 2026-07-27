import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

type ListenerCenso = (comida: TiempoComida) => void

const listeners = new Set<ListenerCenso>()

/** Solicita recargar el censo tras una mutación de cocina (estado persistido en API). */
export function solicitarRefreshCenso(comida: TiempoComida): void {
  for (const listener of listeners) {
    listener(comida)
  }
}

export function suscribirRefreshCenso(listener: ListenerCenso): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
