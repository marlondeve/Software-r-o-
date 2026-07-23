import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"

const STORAGE_KEY = "dietas-cocina-operativas-v1"

export interface EstadoDietasPersistido {
  filas: FilaDieta[]
  ultimaSincronizacion: string
}

export function cargarDietasOperativas(): EstadoDietasPersistido | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EstadoDietasPersistido
  } catch {
    return null
  }
}

export function guardarDietasOperativas(estado: EstadoDietasPersistido): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
  } catch {
    // ignore quota errors in demo
  }
}
