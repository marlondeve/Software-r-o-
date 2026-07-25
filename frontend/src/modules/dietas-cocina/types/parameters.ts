import type {
  EstadoCategoria,
  ModoCargaAnticipada,
  TiempoComida,
} from "@/modules/dietas-cocina/types/enums"

export interface HitoTiempo {
  id: string
  label: string
  /** Hora en formato 24 h (HH:mm) para inputs nativos */
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
