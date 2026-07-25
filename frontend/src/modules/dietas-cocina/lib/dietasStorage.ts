import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"

const STORAGE_KEY_MOCK = "dietas-cocina-operativas-mock-v1"
const STORAGE_KEY_API = "dietas-cocina-operativas-api-v1"

export interface EstadoDietasPersistido {
  filas: FilaDieta[]
  ultimaSincronizacion: string
}

function storageKey(): string {
  return usarApiDietasCocina() ? STORAGE_KEY_API : STORAGE_KEY_MOCK
}

export function cargarDietasOperativas(): EstadoDietasPersistido | null {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return null
    return JSON.parse(raw) as EstadoDietasPersistido
  } catch {
    return null
  }
}

export function guardarDietasOperativas(estado: EstadoDietasPersistido): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(estado))
  } catch {
    // ignore quota errors in demo
  }
}
