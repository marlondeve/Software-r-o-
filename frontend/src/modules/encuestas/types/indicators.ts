import type {
  ContactoBrecha,
  EstadoBrecha,
  TonoMotivoBrecha,
} from "@/modules/encuestas/types/enums"

export interface KpiExperiencia {
  label: string
  valor: string
  sufijo?: string
  trend?: { direction: "up" | "down"; texto: string }
  nota?: string
}

export interface SegmentoBarra {
  label: string
  value: number
  color: string
}

export interface FilaBrecha {
  id: string
  iniciales: string
  nombre: string
  documento: string
  fecha: string
  servicio: string
  convenio: string
  contacto: ContactoBrecha
  gestionNombre: string | null
  intentos: number
  motivo: string
  motivoTono: TonoMotivoBrecha
  estado: EstadoBrecha
}
