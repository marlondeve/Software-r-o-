import type { ModuloId } from "@/types/module"

const MODULOS_PRODUCTO: ModuloId[] = ["dietas-cocina", "encuestas"]

export function encuestasHabilitado(): boolean {
  return import.meta.env.VITE_ENCUESTAS_ENABLED === "true"
}

export function moduloHabilitado(moduloId: ModuloId): boolean {
  if (moduloId === "encuestas") return encuestasHabilitado()
  return true
}

/** true cuando en el producto solo hay un módulo operativo (p. ej. solo dietas-cocina). */
export function omitirSeleccionModulo(): boolean {
  return MODULOS_PRODUCTO.filter(moduloHabilitado).length <= 1
}
