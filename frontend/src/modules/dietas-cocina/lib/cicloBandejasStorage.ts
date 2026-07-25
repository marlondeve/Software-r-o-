import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
const STORAGE_KEY = "dietas-cocina-ciclo-bandejas"

export interface EstadoCicloBandejasPersistido {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}

export function cargarCicloBandejas(): EstadoCicloBandejasPersistido | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EstadoCicloBandejasPersistido
  } catch {
    return null
  }
}

export function guardarCicloBandejas(estado: EstadoCicloBandejasPersistido) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
}

export function limpiarCicloBandejasStorage() {
  localStorage.removeItem(STORAGE_KEY)
}
