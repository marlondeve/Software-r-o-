import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"

const STORAGE_KEY = "dietas-cocina-ciclo-bandejas"

export interface EstadoCicloBandejasPersistido {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
  fechaOperativa?: string
}

export function cargarCicloBandejas(): EstadoCicloBandejasPersistido | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as EstadoCicloBandejasPersistido

    // El turno es del día: con API no se arrastran bandejas de jornadas anteriores.
    if (usarApiDietasCocina() && parsed.fechaOperativa !== fechaOperativaHoy()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function guardarCicloBandejas(estado: EstadoCicloBandejasPersistido) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...estado, fechaOperativa: fechaOperativaHoy() }),
    )
  } catch {
    // ignore quota errors in demo
  }
}

export function limpiarCicloBandejasStorage() {
  localStorage.removeItem(STORAGE_KEY)
}
