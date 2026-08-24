import type {
  EstadoCategoria,
  ModoCargaAnticipada,
  TiempoComida,
} from "@/modules/dietas-cocina/types/enums"

export interface HitoTiempo {
  id: string
  label: string
  /** Hora interna/API en HH:mm (0–23); en UI siempre se muestra en 12 h. */
  hora: string
}

export interface ParametrosTiempoComida {
  id: TiempoComida
  label: string
  activo: boolean
  hitos: HitoTiempo[]
  ventanaCambios: { inicio: string; fin: string; label: string }
}

export interface CategoriaEdad {
  id: string
  nombre: string
  rangoMin: number
  rangoMax: number
  unidad: "Años" | "Meses" | "Días"
  estado: EstadoCategoria
}

export interface ConfigTiempos {
  activos: Record<TiempoComida, boolean>
  modoCarga: ModoCargaAnticipada
  horasPorComida: Record<TiempoComida, Record<string, string>>
}
