import type { ChecklistItem } from "@/modules/dietas-cocina/types/kitchen"

const STORAGE_KEY = "dietas-cocina:cocina-overrides"

interface OverrideCocina {
  checklist?: ChecklistItem[]
  ordenCocinaApiId?: string
  actualizadoEn: number
}

function leerMapa(): Record<string, OverrideCocina> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, OverrideCocina>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function escribirMapa(mapa: Record<string, OverrideCocina>): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapa))
}

function leerOverride(filaId: string): OverrideCocina | undefined {
  return leerMapa()[filaId]
}

function actualizarOverride(
  filaId: string,
  cambios: Partial<Omit<OverrideCocina, "actualizadoEn">>,
): void {
  const mapa = leerMapa()
  mapa[filaId] = {
    ...mapa[filaId],
    ...cambios,
    actualizadoEn: Date.now(),
  }
  escribirMapa(mapa)
}

export function cargarChecklistOrden(filaId: string): ChecklistItem[] | undefined {
  return leerOverride(filaId)?.checklist
}

export function guardarChecklistOrden(filaId: string, checklist: ChecklistItem[]): void {
  actualizarOverride(filaId, { checklist })
}

export function cargarOrdenCocinaApiId(filaId: string): string | undefined {
  return leerOverride(filaId)?.ordenCocinaApiId
}

export function guardarOrdenCocinaApiId(filaId: string, ordenCocinaApiId: string): void {
  actualizarOverride(filaId, { ordenCocinaApiId })
}

export function limpiarOverrideCocina(filaId: string): void {
  const mapa = leerMapa()
  delete mapa[filaId]
  escribirMapa(mapa)
}

/** Migra datos del key anterior de checklist-only si existían. */
export function migrarOverridesCocinaLegacy(): void {
  const legacyKey = "dietas-cocina:cocina-checklist"
  try {
    const raw = sessionStorage.getItem(legacyKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<
      string,
      { checklist: ChecklistItem[]; actualizadoEn: number }
    >
    if (!parsed || typeof parsed !== "object") return
    const mapa = leerMapa()
    for (const [filaId, data] of Object.entries(parsed)) {
      mapa[filaId] = {
        ...mapa[filaId],
        checklist: data.checklist,
        actualizadoEn: data.actualizadoEn,
      }
    }
    escribirMapa(mapa)
    sessionStorage.removeItem(legacyKey)
  } catch {
    // Sin migración
  }
}
