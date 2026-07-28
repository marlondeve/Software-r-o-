import type { ModuloId } from "@/types/module"

export function encuestasHabilitado(): boolean {
  return import.meta.env.VITE_ENCUESTAS_ENABLED === "true"
}

export function moduloHabilitado(moduloId: ModuloId): boolean {
  if (moduloId === "encuestas") return encuestasHabilitado()
  return true
}
