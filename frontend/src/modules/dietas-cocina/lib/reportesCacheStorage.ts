import type { mapReporteDto } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"

const STORAGE_KEY = "dietas-cocina-reportes-cache"

type ReporteView = ReturnType<typeof mapReporteDto>

interface EntradaCacheReporte {
  tipo: "clinico" | "produccion"
  filtrosKey: string
  data: ReporteView
  guardadoEn: string
}

function claveFiltros(filtros: Record<string, string | undefined>): string {
  return JSON.stringify(filtros)
}

export function guardarReporteEnCache(
  tipo: "clinico" | "produccion",
  filtros: Record<string, string | undefined>,
  data: ReporteView,
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const actuales: EntradaCacheReporte[] = raw ? JSON.parse(raw) : []
    const filtrosKey = claveFiltros(filtros)
    const sinDuplicado = actuales.filter(
      (e) => !(e.tipo === tipo && e.filtrosKey === filtrosKey),
    )
    sinDuplicado.push({
      tipo,
      filtrosKey,
      data,
      guardadoEn: new Date().toISOString(),
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sinDuplicado.slice(-20)))
  } catch {
    // ignore quota
  }
}

export function cargarReporteDesdeCache(
  tipo: "clinico" | "produccion",
  filtros: Record<string, string | undefined>,
): ReporteView | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const actuales = JSON.parse(raw) as EntradaCacheReporte[]
    const filtrosKey = claveFiltros(filtros)
    return (
      actuales.find((e) => e.tipo === tipo && e.filtrosKey === filtrosKey)?.data ??
      null
    )
  } catch {
    return null
  }
}
